#!/usr/bin/env bash
# Usage: scripts/run-benchmark.sh [schedule.csv]
# Resume: completed samples are skipped.
# CSV is rebuilt from schedule and saved JSON files.

set -uo pipefail

SCHEDULE="${1:-schedule.csv}"
RESULTS_DIR="${RESULTS_DIR:-results}"
RAW_DIR="$RESULTS_DIR/raw"
CSV="$RESULTS_DIR/results.csv"
BASE_URL="http://localhost:3000"

COOLDOWN=5

mkdir -p "$RAW_DIR"
touch "$RESULTS_DIR/k6.err"

log() {
  echo "[$(date '+%F %T')] $*"
}

# Pastikan schedule tersedia.
if [ ! -f "$SCHEDULE" ]; then
  log "ERROR: Schedule tidak ditemukan: $SCHEDULE"
  exit 1
fi

# Pastikan dependensi tersedia.
for cmd in docker curl jq awk python3 k6; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "ERROR: Perintah '$cmd' tidak ditemukan."
    exit 1
  fi
done

# Jalankan psql di container PostgreSQL.
psql_db() {
  docker compose exec -T postgres \
    psql -v ON_ERROR_STOP=1 -q \
    -U benchmark -d library_benchmark "$@"
}

# Reset database ke kondisi awal.
reset_db() {
  log "Reset database..."

  psql_db < db/seed.sql > /dev/null || {
    log "ERROR: Reset database gagal."
    return 1
  }

  psql_db -c "ANALYZE;" > /dev/null || {
    log "ERROR: ANALYZE gagal."
    return 1
  }

  return 0
}

# Jalankan API dengan ORM yang dipilih.
start_container() {
  local orm="$1"

  log "Starting API dengan DATA_ACCESS=$orm"

  DATA_ACCESS="$orm" docker compose up \
    -d --no-build --force-recreate api > /dev/null 2>&1 || {
      log "ERROR: Gagal menjalankan container API."
      docker compose logs --tail=100 api
      return 1
    }

  local ready=0

  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null "$BASE_URL/books"; then
      ready=1
      break
    fi

    sleep 1
  done

  if [ "$ready" -ne 1 ]; then
    log "ERROR: API tidak siap dalam 60 detik."
    docker compose logs --tail=100 api
    return 1
  fi

  local actual

  actual=$(docker compose exec -T api printenv DATA_ACCESS | tr -d '\r') || {
    log "ERROR: Gagal membaca DATA_ACCESS."
    return 1
  }

  if [ "$actual" != "$orm" ]; then
    log "ERROR: Mode aktif '$actual', seharusnya '$orm'."
    return 1
  fi

  log "API siap dengan mode $orm."
  return 0
}

# Jalankan satu pengujian k6.
run_k6() {
  # $1 = ORM
  # $2 = operation
  # $3 = VUS
  # $4 = output JSON

  reset_db || return 1

  sleep 2

  ORM="$1" \
  VUS="$3" \
  OUT="$4" \
  BASE_URL="$BASE_URL" \
    k6 run --quiet "k6/bench/$2.js" \
      > /dev/null 2>> "$RESULTS_DIR/k6.err"
}

# Bangun ulang CSV berdasarkan schedule dan JSON.
build_csv() {
  SCHEDULE_PATH="$SCHEDULE" \
  RAW_PATH="$RAW_DIR" \
  CSV_PATH="$CSV" \
    python3 - <<'PY'
import csv
import json
import os

schedule_path = os.environ["SCHEDULE_PATH"]
raw_path = os.environ["RAW_PATH"]
csv_path = os.environ["CSV_PATH"]

columns = [
    "repetition", "orm_order", "combo_order", "orm", "operation", "vus",
    "p95_ms", "throughput_rps", "error_rate", "requests",
    "attempts", "valid", "timestamp",
]

with open(schedule_path, newline="") as schedule_file:
    schedule = list(csv.DictReader(schedule_file))

output_rows = []

for row in schedule:
    key = (
        f'{row["repetition"]}_{row["orm"]}_'
        f'{row["operation"]}_{row["vus"]}'
    )
    path = os.path.join(raw_path, key + ".json")

    if not os.path.isfile(path):
        continue

    try:
        with open(path) as result_file:
            result = json.load(result_file)

        # Pastikan identitas hasil sesuai jadwal
        expected = {
            "orm": row["orm"],
            "operation": row["operation"],
            "vus": int(row["vus"]),
        }

        for field, expected_value in expected.items():
            if result.get(field) != expected_value:
                raise ValueError(
                    f"{field} mismatch: "
                    f"jadwal={expected_value}, hasil={result.get(field)}"
                )

        metadata = result.get("_runner", {})

        if metadata.get("valid") not in (0, 1):
            raise ValueError(f"Metadata valid tidak ditemukan: {path}")

        if metadata.get("attempts") != 1:
            raise ValueError(f"Metadata attempts tidak sesuai: {path}")

        output_rows.append({
            "repetition": row["repetition"],
            "orm_order": row["orm_order"],
            "combo_order": row["combo_order"],
            "orm": row["orm"],
            "operation": row["operation"],
            "vus": row["vus"],
            "p95_ms": result.get("p95_ms"),
            "throughput_rps": result.get("throughput_rps"),
            "error_rate": result.get("error_rate"),
            "requests": result.get("requests"),
            "attempts": metadata.get("attempts"),
            "valid": metadata.get("valid"),
            "timestamp": metadata.get("timestamp"),
        })

    except (json.JSONDecodeError, OSError, ValueError) as error:
        raise RuntimeError(f"Gagal memvalidasi {path}: {error}") from error

with open(csv_path, "w", newline="") as output_file:
    writer = csv.DictWriter(output_file, fieldnames=columns)
    writer.writeheader()
    writer.writerows(output_rows)

print(f"CSV berhasil dibuat: {csv_path}")
print(f"Jumlah hasil: {len(output_rows)} dari {len(schedule)} sampel")
PY
}

# Pulihkan CSV dari hasil sebelumnya.
log "Membangun CSV dari hasil yang tersedia..."

build_csv || {
  log "ERROR: Gagal membangun CSV."
  exit 1
}

current_turn=""

# Baca schedule tanpa mengambil header.
while IFS=, read -r rep orm_order combo_order orm op vus <&3; do

  # Bersihkan karakter CRLF jika schedule berasal dari Windows.
  rep="${rep//$'\r'/}"
  orm_order="${orm_order//$'\r'/}"
  combo_order="${combo_order//$'\r'/}"
  orm="${orm//$'\r'/}"
  op="${op//$'\r'/}"
  vus="${vus//$'\r'/}"

  # Lewati baris kosong.
  [ -z "${rep:-}" ] && continue

  key="${rep}_${orm}_${op}_${vus}"
  final="$RAW_DIR/$key.json"

  # Lewati sampel yang sudah selesai.
  if [ -f "$final" ]; then
    log "SKIP: $key sudah tersedia."
    continue
  fi

  # Satu container untuk satu blok repetisi dan ORM.
  turn="${rep}_${orm}"

  if [ "$turn" != "$current_turn" ]; then
    start_container "$orm" || {
      log "FATAL: Tidak dapat menjalankan ORM $orm."
      exit 1
    }

    log "Run pemanasan (dibuang) untuk $orm"
    run_k6 "$orm" read 10 "$RESULTS_DIR/discard.json" || true

    current_turn="$turn"
  fi

  # Percobaan utama hanya dilakukan satu kali.
  attempt_file="$RAW_DIR/${key}.attempt1.json"

  rm -f "$attempt_file"

  log "Menjalankan rep=$rep orm=$orm op=$op vus=$vus"

  k6_status=0

  run_k6 "$orm" "$op" "$vus" "$attempt_file" || k6_status=$?

  if [ ! -s "$attempt_file" ]; then
    log "FATAL: k6 tidak menghasilkan JSON untuk $key."
    log "Exit code: $k6_status"
    exit 1
  fi

  # Periksa error rate.
  err=$(jq -r '.error_rate // 1' "$attempt_file" 2>/dev/null || echo 1)

  valid=0

  if [ "$k6_status" -eq 0 ] && \
     awk "BEGIN { exit !($err == 0) }"; then
    valid=1
    log "Sampel valid: tidak ada request error."
  else
    log "WARNING: Sampel tidak valid (error_rate=$err, exit=$k6_status)."
  fi

  # Tambahkan metadata runner ke hasil JSON.
  jq \
    --argjson attempts 1 \
    --argjson valid "$valid" \
    --arg timestamp "$(date -Iseconds)" \
    '. + {
      "_runner": {
        "attempts": $attempts,
        "valid": $valid,
        "timestamp": $timestamp
      }
    }' "$attempt_file" > "$final.tmp" && mv "$final.tmp" "$final" || {
      rm -f "$final.tmp"
      log "FATAL: Gagal menyimpan hasil final $key."
      exit 1
    }

  log "Hasil disimpan: $final (valid=$valid)"

  # Perbarui CSV setelah setiap sampel.
  build_csv || {
    log "FATAL: Gagal memperbarui CSV."
    exit 1
  }

  sleep "$COOLDOWN"

done 3< <(tail -n +2 "$SCHEDULE")

log "Semua baris schedule telah diproses."
log "CSV hasil: $CSV"
log "JSON mentah: $RAW_DIR"
