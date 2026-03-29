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
const userCrudDuration = new Trend("users_crud_cycle_duration");
const usersCreated = new Counter("users_created");
const userCrudSuccess = new Rate("users_crud_success_rate");

export function crudUsers() {
  const startTime = Date.now();
  const uniqueId = `${Date.now()}_${__VU}_${__ITER}`;

  let userId;
  let token;

  const user = {
    username: `k6user_${uniqueId}`,
    email: `k6user_${uniqueId}@test.com`,
    password: "SecurePass123!",
    firstName: "K6",
    lastName: "Tester",
  };

  let success = true;

  // POST create a user
  group("Create User", () => {
    const createUserRes = post("/v1/users", user, {
      tags: { name: "create-user" },
    });
    checkStatus(createUserRes, 201);

    if (createUserRes.status !== 201) success = false;
    else {
      usersCreated.add(1);
      userId = createUserRes.json().id;
    }
  });

  // GET User Token
  group("Get User Token", () => {
    const userTokenRes = post(
      "/v1/auth/tokens",
      {
        username: user.username,
        password: user.password,
      },
      {
        tags: { name: "get-token" },
      },
    );
    checkStatus(userTokenRes, 200);
    if (userTokenRes.status !== 200) success = false;
    else token = userTokenRes.json().token;
  });

  // GET single user by id
  group("Get User", () => {
    const getUserRes = get(`/v1/users/${userId}`, {
      tags: { name: "get-user" },
    });
    checkStatus(getUserRes, 200);

    if (getUserRes.status !== 200) success = false;

    checkBody(getUserRes, "username");
  });

  // PUT update user
  group("Update user", () => {
    const updateUserRes = put(
      `/v1/users/${userId}`,
      {
        firstName: `${user.firstName}_updated`,
        lastName: `${user.lastName}_updated`,
        email: `${user.email}`,
        username: user.username,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        tags: { name: "update-user" },
      },
    );
    checkStatus(updateUserRes, 200);
    if (updateUserRes.status !== 200) success = false;
  });

  // DELETE user
  group("Delete user", () => {
    const deleteUserRes = del(`/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "delete-user" },
    });
    checkStatus(deleteUserRes, 204);
    if (deleteUserRes.status !== 204) success = false;
  });

  // Metrics
  userCrudSuccess.add(success);
  userCrudDuration.add(Date.now() - startTime);

  //Pause between iterations to simulate real user behavior
  sleep(1);
}
