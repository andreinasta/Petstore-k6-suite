import { defaultThresholds } from "../config/thresholds.js";
import { crudPets } from "../tests/pets.test.js";
import { registerUser } from "../helpers/auth.js";

export const options = {
  stages: [
    { duration: "10s", target: 10 }, // ramp up
    { duration: "1m", target: 10 }, // sustained load
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: defaultThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}
