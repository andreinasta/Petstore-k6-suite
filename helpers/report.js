import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export function generateReport(data, scenarioName = "test") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    [`results/${scenarioName}_${timestamp}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "results/summary.json": JSON.stringify(data),
  };
}
