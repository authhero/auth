import { D1Dialect } from "kysely-d1";
import { Kysely, Migrator } from "kysely";
import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import migrations from "./migrations";
import ReferenceMigrationProvider from "./ReferenceMigrationProvider";

export async function migrateToLatest(ctx: Context<Env>) {
  const provider = new ReferenceMigrationProvider(migrations);
  const db = new Kysely<any>({
    dialect: new D1Dialect({ database: ctx.env.AUTH_DB }),
  });

  const migrator = new Migrator({
    db,
    provider,
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    throw error;
  }

  await db.destroy();
}

export async function migrateDown(ctx: Context<Env>) {
  const provider = new ReferenceMigrationProvider(migrations);
  const db = new Kysely<D1Dialect>({
    dialect: new D1Dialect({ database: ctx.env.AUTH_DB }),
  });

  const migrator = new Migrator({
    db,
    provider,
  });

  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    throw error;
  }

  await db.destroy();
}
