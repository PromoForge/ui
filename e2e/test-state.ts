import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, ".test-state.json");

export interface TestState {
  applicationId: number;
  applicationName: string;
  attributeIds: number[];
  additionalCostIds: number[];
  collectionIds: number[];
  catalogIds: number[];
}

export function saveTestState(state: TestState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function loadTestState(): TestState {
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

export function cleanTestState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}
