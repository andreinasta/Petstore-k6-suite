// NOTE: Store/order endpoints (/v1/inventory, /v1/orders) return 404 as of 2026-03-29
// The API docs describe them but they are not working on the live server
// Tests are kept to demonstrate the pattern

import { sleep } from "k6";
import { get, post, del } from "../utils/request.js";
import {
  checkStatus,
  checkResponseTime,
  checkBody,
} from "../helpers/checks.js";
import { group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics
const orderCrudDuration = new Trend("order_crud_cycle_duration");
const ordersCreated = new Counter("orders_created");
const orderCrudSuccess = new Rate("order_crud_success_rate");

export function crudOrders(token, petId, userId) {
  const startTime = Date.now();
  let orderId;
  let success = true;

  // GET store inventory
  group("Get Inventory", () => {
    const inventoryRes = get("/v1/inventory", {
      tags: { name: "get-inventory" },
    });
    checkStatus(inventoryRes, 200);
    if (inventoryRes.status !== 200) success = false;

    checkBody(inventoryRes, "available");
  });

  // POST create order
  group("Create Order", () => {
    const createOrderRes = post(
      "/v1/orders",
      {
        petId: petId,
        userId: userId,
        totalAmount: "150.00",
        currency: "USD",
        status: "PLACED",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        tags: { name: "create-order" },
      },
    );
    checkStatus(createOrderRes, 201);

    if (createOrderRes.status !== 201) success = false;
    else ordersCreated.add(1);

    orderId = createOrderRes.json().id;
  });

  // GET order by id
  group("Get Order", () => {
    const getOrderRes = get(`/v1/orders/${orderId}`, {
      tags: { name: "get-order" },
    });
    checkStatus(getOrderRes, 200);
    if (getOrderRes.status !== 200) success = false;

    checkBody(getOrderRes, "status");
  });

  // DELETE (cancel) order
  group("Cancel Order", () => {
    const cancelOrderRes = del(`/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "cancel-order" },
    });
    checkStatus(cancelOrderRes, 204);
    if (cancelOrderRes.status !== 204) success = false;
  });

  // Metrics
  orderCrudSuccess.add(success);
  orderCrudDuration.add(Date.now() - startTime);

  // Pause between iterations to simulate real user behavior
  sleep(1);
}
