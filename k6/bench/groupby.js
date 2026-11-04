import {
  options,
  runBenchmark,
  createSummary,
} from './config.js';

export { options };

export default function () {
  runBenchmark('groupby');
}

export const handleSummary = createSummary('groupby');