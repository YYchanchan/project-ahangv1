import { MysqlStore } from "./mysql-store";
import type { Store } from "./store-types";

export function createStore(): Store {
  return new MysqlStore();
}

export type { Store } from "./store-types";
