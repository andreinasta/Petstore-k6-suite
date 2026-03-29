import { sleep } from "k6";
import { defaultThresholds } from "../config/thresholds.js";
import { get } from "../utils/request.js";
import { checkStatus } from "../helpers/checks.js";

export const options = {
  stages: [
    { duration: "30s", target: 5 }, // warm up
    { duration: "10s", target: 100 }, // spike!
    { duration: "1m", target: 100 }, // stay at spike
    { duration: "10s", target: 5 }, // drop back
    { duration: "1m", target: 5 }, // recovery
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: defaultThresholds,
};

export default function () {
  const res = get("/v1/pets");
  checkStatus(res, 200);
  sleep(1);
}
