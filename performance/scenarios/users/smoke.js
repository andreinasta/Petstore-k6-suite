import { userThresholds } from "../../config/thresholds.js";
import { crudUsers } from "../../tests/users.test.js";
import { generateReport } from "../../helpers/report.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: userThresholds,
};

export default function () {
  crudUsers();
}

export function handleSummary(data) {
  return generateReport(data, "users-smoke");
}
