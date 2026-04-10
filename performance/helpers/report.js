import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export function generateReport(data, scenarioName = "test") {
  const now = new Date();
  const roTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // UTC+3 (Romania EEST)
  const timestamp = roTime.toISOString().slice(0, 19).replace(/[:.]/g, "-");
  return {
    [`performance/results/${scenarioName}_${timestamp}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    [`performance/results/${scenarioName}_${timestamp}.json`]: JSON.stringify(data),
  };
}
