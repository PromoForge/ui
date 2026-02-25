import { saveTestState } from "./test-state";

const API_URL = "http://localhost:7243";

async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function waitForServer(maxRetries = 30, intervalMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${API_URL}/api/v1/applications?pageSize=1`);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Server at ${API_URL} not ready after ${maxRetries} retries`);
}

export default async function globalSetup() {
  console.log("Waiting for promoforge server...");
  await waitForServer();
  console.log("Server is ready. Seeding test data...");

  // Create test application
  const appRes = await apiPost("/api/v1/applications", {
    name: `e2e-test-app-${Date.now()}`,
    description: "E2E test application",
    currency: "USD",
    timezone: "America/New_York",
    environment: "APPLICATION_ENVIRONMENT_SANDBOX",
  });
  const app = appRes.application;
  console.log(`Created application: ${app.name} (id=${app.id})`);

  // Create test attributes with different entity/type combos
  const attributeConfigs = [
    {
      entity: "ATTRIBUTE_ENTITY_CUSTOMER_PROFILE",
      name: "e2e_loyalty_tier",
      title: "Loyalty Tier",
      type: "ATTRIBUTE_TYPE_STRING",
      description: "Customer loyalty tier level",
    },
    {
      entity: "ATTRIBUTE_ENTITY_CART_ITEM",
      name: "e2e_item_weight",
      title: "Item Weight",
      type: "ATTRIBUTE_TYPE_NUMBER",
      description: "Weight of the cart item in grams",
    },
    {
      entity: "ATTRIBUTE_ENTITY_CUSTOMER_SESSION",
      name: "e2e_is_returning",
      title: "Is Returning",
      type: "ATTRIBUTE_TYPE_BOOLEAN",
      description: "Whether this is a returning customer session",
    },
    {
      entity: "ATTRIBUTE_ENTITY_EVENT",
      name: "e2e_event_tags",
      title: "Event Tags",
      type: "ATTRIBUTE_TYPE_LIST_OF_STRINGS",
      description: "Tags associated with the event",
    },
  ];

  const attributeIds: number[] = [];
  for (const config of attributeConfigs) {
    const attrRes = await apiPost("/api/v1/attributes", {
      ...config,
      subscribedApplicationsIds: [app.id],
    });
    const attr = attrRes.attribute;
    attributeIds.push(attr.id);
    console.log(`Created attribute: ${attr.title} (id=${attr.id})`);
  }

  saveTestState({
    applicationId: app.id,
    applicationName: app.name,
    attributeIds,
  });

  console.log("Test data seeded successfully.");
}
