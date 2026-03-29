import { sleep } from "k6";
import { defaultThresholds } from "../config/thresholds.js";
import { get } from "../utils/request.js";
import { checkStatus, checkResponseTime } from "../helpers/checks.js";
import { crudPets } from "../tests/pets.test.js";
import { registerUser } from "../helpers/auth.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: defaultThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}
