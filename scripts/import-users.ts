import * as fs from "fs";
import { getDb } from "../src/services/db";
import { z } from "zod";
import { PlanetScaleDialect } from "kysely-planetscale";
import { SqlUser } from "../src/types";

const profileDataSchema = z.object({
  email_verified: z.union([z.boolean(), z.string()]),
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

const userSchema = z.object({
  identities: z.array(identitySchema),
  email: z.string().optional(),
  name: z.string(),
  nickname: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url(),
  email_verified: z.union([z.boolean(), z.string()]),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  locale: z.string().optional(),
});

type User = z.infer<typeof userSchema>;

const tenantId = "qo0kCHUE8qAvpNPznuoRW";

const dialect = new PlanetScaleDialect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: (opts, init) =>
    fetch(new Request(opts, { ...init, cache: undefined })),
});

const db = getDb(dialect);

async function addUser(user: User) {
  // if (user.email !== "markus@sesamy.com") {
  //   return;
  // }

  for await (const identity of user.identities) {
    const id = `${identity.provider}|${identity.user_id}`;

    const sqlUser: SqlUser = {
      id,
      email: user.email || "",
      email_verified:
        (
          identity.profileData.email_verified || user.email_verified
        ).toString() === "true"
          ? 1
          : 0,
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
      tenant_id: "59MkuLqTm7xtzwXh-A2FP",
      created_at: user.created_at,
      updated_at: user.updated_at,
      linked_to: user.user_id === id ? undefined : user.user_id,
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

    // await addUser(JSON.parse(lines[0]));

    for (const line of lines) {
      try {
        const user = userSchema.parse(JSON.parse(line));
        await addUser(user);
      } catch (error: any) {
        console.error(`Failed to parse line: ${line}. Error: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error(`Failed to read file: ${error.message}`);
  }
}

importUsers("./data/sesamy-dev.json");
// importUsersFromCsv("./data/kvartal-auth0.csv");
