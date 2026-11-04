#!/usr/bin/env python3
import csv
import random

SEED = 20261102
REPS = 10
ORMS = ["prisma", "typeorm", "drizzle", "raw"]
OPS = ["read", "create", "join", "groupby"]
VUS = [10, 50, 100]

rng = random.Random(SEED)
combos = [(op, vu) for op in OPS for vu in VUS]

with open("schedule.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        "repetition", "orm_order", "combo_order",
        "orm", "operation", "vus"
    ])

    for rep in range(1, REPS + 1):
        orm_order = ORMS[:]
        rng.shuffle(orm_order)

        # Acak kombinasi hanya sekali untuk setiap ronde
        combo_order = combos[:]
        rng.shuffle(combo_order)

        for oi, orm in enumerate(orm_order, 1):
            for ci, (op, vu) in enumerate(combo_order, 1):
                writer.writerow([
                    rep, oi, ci, orm, op, vu
                ])

print("schedule.csv berhasil dibuat.")
print("Total sampel:", REPS * len(ORMS) * len(combos))