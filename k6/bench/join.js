import {
  options,
  runBenchmark,
  createSummary,
} from './config.js';

export { options };

export default function () {
  runBenchmark('join');
}

export const handleSummary = createSummary('join');
