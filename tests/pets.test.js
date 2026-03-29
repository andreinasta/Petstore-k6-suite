import { sleep } from "k6";
import { get, post, put, del } from "../utils/request.js";
import {
  checkStatus,
  checkResponseTime,
  checkBody,
} from "../helpers/checks.js";
import { group } from "k6";

// GET all existing pets
export function crudPets(token) {
  let petId;
  group("List Pets", () => {
    const listPetRes = get("/v1/pets");
    checkStatus(listPetRes, 200);
    checkResponseTime(listPetRes, 500);
  });

  // POST create a pet
  group("Create Pets", () => {
    const createPetRes = post(
      "/v1/pets",
      {
        name: "Pisa",
        species: "CAT",
        breed: "Dumpsteranian",
        ageMonths: 120,
        size: "MEDIUM",
        color: "Grey",
        gender: "FEMALE",
        goodWithKids: true,
        price: "250.00",
        currency: "USD",
        status: "AVAILABLE",
        description: "Gorgeous Dumpsteranian grey breed.",
        medicalInfo: {
          vaccinated: true,
          spayedNeutered: true,
          microchipped: true,
          specialNeeds: false,
          healthNotes: "Up to date on all vaccinations",
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    checkStatus(createPetRes, 201);

    petId = createPetRes.json().id;
  });

  // GET single pet by id
  group("Get Pet", () => {
    const getPetRes = get(`/v1/pets/${petId}`);
    checkStatus(getPetRes, 200);
    checkBody(getPetRes, "name");
  });

  // PUT update pet
  group("Update Pet", () => {
    const updatePetRes = put(
      `/v1/pets/${petId}`,
      {
        species: "CAT",
        name: "Pisa Updated Pet",
        ageMonths: 121,
        price: "300.00",
        currency: "USD",
        status: "AVAILABLE",
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    checkStatus(updatePetRes, 200);
  });

  // DELETE pet
  group("Delete Pet", () => {
    const deletePetRes = del(`/v1/pets/${petId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    checkStatus(deletePetRes, 204);
    sleep(1);
  });
}
