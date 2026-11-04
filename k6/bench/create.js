import {
  options,
  runBenchmark,
  createSummary,
} from './config.js';

export { options };

export default function () {
  runBenchmark('create');
}

export const handleSummary = createSummary('create');
