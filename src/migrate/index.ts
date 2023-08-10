import { Migrator } from "kysely";
import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import migrations from "./migrations";
import ReferenceMigrationProvider from "./ReferenceMigrationProvider";
import { getDb } from "../services/db";

export async function migrateToLatest(ctx: Context<Env>) {
  const provider = new ReferenceMigrationProvider(migrations);
  const db = getDb(ctx.env);

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
  const db = getDb(ctx.env);

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
