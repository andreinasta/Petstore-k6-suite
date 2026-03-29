import { userThresholds } from "../../config/thresholds.js";
import { crudUsers } from "../../tests/users.test.js";
import { generateReport } from "../../helpers/report.js";

export const options = {
  stages: [
    { duration: "10s", target: 10 }, // ramp up to 10 VUs
    { duration: "30s", target: 10 }, // stay at 10 VUs
    { duration: "10s", target: 0 }, // ramp down to 0
  ],
  thresholds: userThresholds,
};

export default function () {
  crudUsers();
}

export function handleSummary(data) {
  return generateReport(data, "users-load");
}
