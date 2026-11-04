
import http from 'k6/http';
import exec from 'k6/execution';
import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const WARMUP_SECONDS = 5;
export const MEASUREMENT_SECONDS = 30;
export const TOTAL_SECONDS = WARMUP_SECONDS + MEASUREMENT_SECONDS;

export const VUS = Number(__ENV.VUS || 10);

const ALLOWED_VUS = [10, 50, 100];

if (!ALLOWED_VUS.includes(VUS)) {
  throw new Error(`VUS harus 10, 50, atau 100. Nilai diterima: ${VUS}`);
}

export const measurementDuration = new Trend(
  'measurement_http_req_duration',
  true
);

export const measurementRequests = new Counter(
  'measurement_http_reqs'
);

export const measurementErrors = new Rate(
  'measurement_error_rate'
);

export const options = {
  scenarios: {
    benchmark: {
      executor: 'constant-vus',
      vus: VUS,
      duration: `${TOTAL_SECONDS}s`,
      gracefulStop: '10s',
    },
  },
};

const ENDPOINTS = {
  read: {
    method: 'GET',
    path: '/books',
    expectedStatus: 200,
  },
  create: {
    method: 'POST',
    path: '/books',
    expectedStatus: 201,
  },
  join: {
    method: 'GET',
    path: '/loans/details',
    expectedStatus: 200,
  },
  groupby: {
    method: 'GET',
    path: '/books/stats',
    expectedStatus: 200,
  },
};

export function runBenchmark(operation) {
  const endpoint = ENDPOINTS[operation];

  if (!endpoint) {
    throw new Error(`Operasi tidak dikenal: ${operation}`);
  }

  const elapsed = Date.now() - exec.scenario.startTime;
  const phase = elapsed < WARMUP_SECONDS * 1000
    ? 'warmup'  
    : 'measurement';

  const url = `${BASE_URL}${endpoint.path}`;

  const params = {
    timeout: '10s',
    tags: { phase },
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let response;

  if (endpoint.method === 'POST') {
    const body = JSON.stringify({
      title: `Benchmark-${__VU}-${__ITER}`,
      author: 'Benchmark Test',
      categoryId: 1,
      stock: 5,
    });

    response = http.post(url, body, params);
  } else {
    response = http.get(url, params);
  }

  const success = response.status === endpoint.expectedStatus;

  check(response, {
    [`${operation}: status ${endpoint.expectedStatus}`]: () => success,
  });

  // Hanya request yang dimulai pada fase measurement
  // yang masuk ke metrik penelitian.
  if (phase === 'measurement') {
    measurementDuration.add(response.timings.duration);
    measurementRequests.add(1);
    measurementErrors.add(success ? 0 : 1);
  }
}

export function createSummary(operation) {
  return function handleSummary(data) {
    const duration =
      data.metrics.measurement_http_req_duration?.values;

    const requests =
      data.metrics.measurement_http_reqs?.values?.count ?? 0;

    const errors =
      data.metrics.measurement_error_rate?.values?.rate ?? 0;

    const result = {
      orm: __ENV.ORM || 'unspecified',
      operation,
      vus: VUS,
      warmup_seconds: WARMUP_SECONDS,
      measurement_seconds: MEASUREMENT_SECONDS,
      total_seconds: TOTAL_SECONDS,
      requests,
      p95_ms: duration?.['p(95)'] ?? null,
      avg_ms: duration?.avg ?? null,
      min_ms: duration?.min ?? null,
      max_ms: duration?.max ?? null,
      throughput_rps: requests / MEASUREMENT_SECONDS,
      error_rate: errors,
    };

    const outputPath =
      __ENV.OUT || `results/${operation}_vus${VUS}.json`;

    return {
      [outputPath]: JSON.stringify(result, null, 2),
      stdout: JSON.stringify(result, null, 2) + '\n',
    };
  };
}
