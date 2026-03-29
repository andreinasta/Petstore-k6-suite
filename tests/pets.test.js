import { sleep } from "k6";
import { get, post, put, del } from "../utils/request.js";
import {
  checkStatus,
  checkResponseTime,
  checkBody,
} from "../helpers/checks.js";
import { group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Define Custom Metric types
const petsCrudDuration = new Trend("pets_crud_cycle_duration");
const petsCreated = new Counter("pets_created");
const petsCrudSuccess = new Rate("pets_crud_success_rate");

// Initialize test data
const testData = JSON.parse(open("../data/testdata.json"));

export function crudPets(token) {
  const startTime = Date.now();
  const pet = testData.pets[Math.floor(Math.random() * testData.pets.length)];

  let petId;
  let success = true;

  // GET all existing pets
  group("List Pets", () => {
    const listPetRes = get("/v1/pets", { tags: { name: "list-pets" } });
    checkStatus(listPetRes, 200);
    checkResponseTime(listPetRes, 500);
  });

  // POST create a pet
  group("Create Pets", () => {
    const createPetRes = post("/v1/pets", pet, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "create-pet" },
    });
    checkStatus(createPetRes, 201);

    if (createPetRes.status !== 201) success = false;
    else petsCreated.add(1);

    petId = createPetRes.json().id;
  });

  // GET single pet by id
  group("Get Pet", () => {
    const getPetRes = get(`/v1/pets/${petId}`, { tags: { name: "get-pet" } });
    checkStatus(getPetRes, 200);

    if (getPetRes.status !== 200) success = false;

    checkBody(getPetRes, "name");
  });

  // PUT update pet
  group("Update Pet", () => {
    const updatePetRes = put(
      `/v1/pets/${petId}`,
      {
        species: pet.species,
        name: `${pet.name} Updated`,
        ageMonths: pet.ageMonths + 1,
        price: "300.00",
        currency: "USD",
        status: "AVAILABLE",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        tags: { name: "update-pet" },
      },
    );
    checkStatus(updatePetRes, 200);
    if (updatePetRes.status !== 200) success = false;
  });

  // DELETE pet
  group("Delete Pet", () => {
    const deletePetRes = del(`/v1/pets/${petId}`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "delete-pet" },
    });
    checkStatus(deletePetRes, 204);
    if (deletePetRes.status !== 204) success = false;
  });

  // Metrics
  petsCrudSuccess.add(success);
  petsCrudDuration.add(Date.now() - startTime);

  //Pause between iterations to simulate real user behavior
  sleep(1);
}
