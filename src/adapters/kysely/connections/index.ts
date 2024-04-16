import { ConnectionsAdapter } from "../../interfaces/Connections";
import { create } from "./create";
import { Database } from "../../../types";
import { Kysely } from "kysely";
import { list } from "./list";

export function createConnectionsAdapter(
  db: Kysely<Database>,
): ConnectionsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
