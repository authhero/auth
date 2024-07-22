import * as fs from "fs";
import { getDb } from "../src/services/db";
import { z } from "zod";
import { PlanetScaleDialect } from "kysely-planetscale";
import { SqlUser } from "../src/types";

const profileDataSchema = z.object({
  email_verified: z.union([z.boolean(), z.string()]).optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  nickname: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
});

const identitySchema = z.object({
  profileData: profileDataSchema,
  connection: z.string(),
  provider: z.string(),
  user_id: z.string(),
  isSocial: z.boolean(),
});

type Identity = z.infer<typeof identitySchema>;

const userSchema = z.object({
  identities: z.array(identitySchema),
  email: z.string().optional(),
  name: z.string(),
  nickname: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url(),
  email_verified: z.union([z.boolean(), z.string()]).optional(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  locale: z.string().optional(),
});

type User = z.infer<typeof userSchema>;

const tenant_id = "2pcx5edjYqVDJCOhgwcik";

const dialect = new PlanetScaleDialect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: (opts, init) =>
    fetch(new Request(opts, { ...init, cache: undefined })),
});

function chunkArray(array: SqlUser[], chunkSize: number) {
  let result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    let chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

const db = getDb(dialect);

const usersToInsert: SqlUser[] = [];

function toSnakeCase(str: string): string {
  // Remove spaces and then convert the first character to lower case
  // After that, add underscores before uppercase letters and convert them to lowercase
  return str
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`) // Convert camelCase/PascalCase to snake_case
    .replace(/^_/, ""); // Remove leading underscore if it exists
}

function snakeCaseKeys(obj: any): any {
  const result: { [key: string]: any } = {};
  Object.entries(obj).forEach(([key, value]) => {
    const snakeKey = toSnakeCase(key);
    // Check if the value is an object and handle it recursively
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[snakeKey] = snakeCaseKeys(value);
    } else {
      result[snakeKey] = value;
    }
  });
  return result;
}

function removeNonUniqueByKey(array: Identity[]) {
  const seen = new Set();
  return array.filter((item) => {
    if (seen.has(item.user_id)) {
      return false; // If the key has been seen, filter out the item
    } else {
      seen.add(item.user_id);
      return true; // If the key hasn't been seen, keep the item and mark the key as seen
    }
  });
}

async function addUser(user: User) {
  for await (const identity of removeNonUniqueByKey(user.identities)) {
    const user_id = `${identity.provider}|${identity.user_id}`;

    const email_verified =
      (
        identity.profileData.email_verified ||
        user.email_verified ||
        false
      ).toString() === "true"
        ? 1
        : 0;

    const sqlUser: SqlUser = {
      user_id,
      email: user.email || "",
      email_verified,
      login_count: 0,
      given_name: identity.profileData.given_name || user.given_name || "",
      family_name: identity.profileData.family_name || user.family_name || "",
      name: identity.profileData.name || user.name || "",
      nickname: identity.profileData.nickname || user.nickname || "",
      picture: identity.profileData.picture || user.picture || "",
      locale: identity.profileData.locale || user.locale || "",
      provider: identity.provider,
      connection: identity.connection,
      is_social: identity.isSocial ? 1 : 0,
      tenant_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      linked_to: user.user_id === user_id ? undefined : user.user_id,
    };

    await db.insertInto("users").values(sqlUser).execute();
  }
}

async function importUsers(filePath: string) {
  try {
    // Read the entire file content
    const fileContent = fs.readFileSync(filePath);

    // Split the content into lines
    const lines = fileContent.toString("utf-8").split(/\r?\n/);

    for (const line of lines) {
      try {
        const userJson = snakeCaseKeys(JSON.parse(line));

        const user = userSchema.parse(userJson);
        await addUser(user);
      } catch (error: any) {
        console.error(`Failed to parse line: ${line}. Error: ${error.message}`);
      }
    }

    const chunks = chunkArray(usersToInsert, 100).slice(822);

    for (const chunk of chunks) {
      await db.insertInto("users").values(chunk).execute();
    }
  } catch (error: any) {
    console.error(`Failed to read file: ${error.message}`);
  }
}

importUsers("./data/authy0-export.json");
