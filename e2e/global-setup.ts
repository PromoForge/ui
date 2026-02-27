import { saveTestState } from "./test-state";

const API_URL = "http://localhost:7243";

async function apiPost(
  path: string,
  body: Record<string, unknown>,
  ignoreConflict = false
) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (ignoreConflict && res.status === 409) {
      return null;
    }
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
      eventType: "EVENT_TYPE_CUSTOM",
    },
    {
      entity: "ATTRIBUTE_ENTITY_APPLICATION",
      name: "e2e_editable_attr",
      title: "Editable Attr",
      type: "ATTRIBUTE_TYPE_STRING",
      description: "Attribute for edit/delete E2E tests",
      suggestions: ["option_a", "option_b", "option_c"],
      restrictedBySuggestions: true,
    },
  ];

  const attributeIds: number[] = [];
  for (const config of attributeConfigs) {
    const attrRes = await apiPost(
      "/api/v1/attributes",
      { ...config, subscribedApplicationsIds: [app.id] },
      true // ignore 409 — attribute may exist from a previous run
    );
    if (attrRes) {
      const attr = attrRes.attribute;
      attributeIds.push(attr.id);
      console.log(`Created attribute: ${attr.title} (id=${attr.id})`);
    } else {
      console.log(`Attribute ${config.title} already exists, skipping`);
    }
  }

  // Create test additional costs
  const additionalCostConfigs = [
    {
      name: "e2e_shipping_cost",
      title: "Shipping Cost",
      description: "Delivery charges for the purchase.",
      type: "ADDITIONAL_COST_TYPE_SESSION",
      subscribedApplicationsIds: [app.id],
    },
    {
      name: "e2e_extra_fees",
      title: "Extra Fees",
      description: "Extra fees applied to order.",
      type: "ADDITIONAL_COST_TYPE_ITEM",
    },
    {
      name: "e2e_editable_cost",
      title: "Editable Cost",
      description: "Cost for edit/delete E2E tests",
      type: "ADDITIONAL_COST_TYPE_BOTH",
      subscribedApplicationsIds: [app.id],
    },
  ];

  const additionalCostIds: number[] = [];
  for (const config of additionalCostConfigs) {
    const costRes = await apiPost(
      "/api/v1/additional_costs",
      config,
      true, // ignore 409
    );
    if (costRes) {
      const costObj = costRes.additionalCost;
      additionalCostIds.push(costObj.id);
      console.log(`Created additional cost: ${costObj.title} (id=${costObj.id})`);
    } else {
      console.log(`Additional cost ${config.title} already exists, skipping`);
    }
  }

  // Create test collections
  const collectionConfigs = [
    {
      name: "E2E Test Collection",
      description: "Collection for E2E display tests",
      subscribedApplicationsIds: [app.id],
    },
    {
      name: "E2E Editable Collection",
      description: "Collection for edit/delete E2E tests",
      subscribedApplicationsIds: [app.id],
    },
  ];

  const collectionIds: number[] = [];
  for (const config of collectionConfigs) {
    const colRes = await apiPost(
      "/api/v1/collections",
      config,
      true, // ignore 409
    );
    if (colRes) {
      const col = colRes.collection;
      collectionIds.push(col.id);
      console.log(`Created collection: ${col.name} (id=${col.id})`);
    } else {
      console.log(`Collection ${config.name} already exists, skipping`);
    }
  }

  // Create test catalogs
  const catalogConfigs = [
    {
      name: "E2E Test Catalog",
      description: "Catalog for E2E display tests",
      subscribedApplicationsIds: [app.id],
    },
    {
      name: "E2E Editable Catalog",
      description: "Catalog for edit/delete E2E tests",
      subscribedApplicationsIds: [app.id],
    },
  ];

  const catalogIds: number[] = [];
  for (const config of catalogConfigs) {
    const catRes = await apiPost(
      "/api/v1/catalogs",
      config,
      true, // ignore 409
    );
    if (catRes) {
      const cat = catRes.catalog;
      catalogIds.push(cat.id);
      console.log(`Created catalog: ${cat.name} (id=${cat.id})`);
    } else {
      console.log(`Catalog ${config.name} already exists, skipping`);
    }
  }

  saveTestState({
    applicationId: app.id,
    applicationName: app.name,
    attributeIds,
    additionalCostIds,
    collectionIds,
    catalogIds,
  });

  console.log("Test data seeded successfully.");
}
