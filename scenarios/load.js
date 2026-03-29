import { sleep } from "k6";
import { defaultThresholds } from "../config/thresholds.js";
import { get } from "../utils/request.js";
import { checkStatus } from "../helpers/checks.js";

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // ramp up to 10 VUs
    { duration: "3m", target: 10 }, // stay at 10 VUs
    { duration: "1m", target: 0 }, // ramp down to 0
  ],
  thresholds: defaultThresholds,
};

export default function () {
  const res = get("/v1/pets");
  checkStatus(res, 200);
  sleep(1);
}
