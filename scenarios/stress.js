import { sleep } from "k6";
import { defaultThresholds } from "../config/thresholds.js";
import { get } from "../utils/request.js";
import { checkStatus } from "../helpers/checks.js";

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // below normal
    { duration: "2m", target: 30 }, // normal load
    { duration: "2m", target: 50 }, // around breaking point
    { duration: "2m", target: 80 }, // beyond breaking point
    { duration: "2m", target: 0 }, // recovery
  ],
  thresholds: defaultThresholds,
};

export default function () {
  const res = get("/v1/pets");
  checkStatus(res, 200);
  sleep(1);
}
