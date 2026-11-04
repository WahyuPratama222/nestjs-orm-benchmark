import {
  options,
  runBenchmark,
  createSummary,
} from './config.js';

export { options };

export default function () {
  runBenchmark('read');
}

export const handleSummary = createSummary('read');
