import { defaultThresholds } from "../config/thresholds.js";
import { crudPets } from "../tests/pets.test.js";
import { registerUser } from "../helpers/auth.js";

export const options = {
  stages: [
    { duration: "20s", target: 10 }, // below normal
    { duration: "40s", target: 30 }, // normal load
    { duration: "40s", target: 50 }, // around breaking point
    { duration: "40s", target: 80 }, // beyond breaking point
    { duration: "40s", target: 0 }, // recovery
  ],
  thresholds: defaultThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}
