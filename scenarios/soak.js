import { sleep } from "k6";
import { defaultThresholds } from "../config/thresholds.js";
import { get } from "../utils/request.js";
import { checkStatus } from "../helpers/checks.js";

export const options = {
  stages: [
    { duration: "2m", target: 10 }, // ramp up
    { duration: "30m", target: 10 }, // sustained load
    { duration: "2m", target: 0 }, // ramp down
  ],
  thresholds: defaultThresholds,
};

export default function () {
  const res = get("/v1/pets");
  checkStatus(res, 200);
  sleep(1);
}
