import { getDb } from "../services/db";
import { Env, Migration } from "../types";

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";

export async function auth0login(
  migration: Migration,
  username: string,
  password: string,
) {
  const response = await fetch(`https://${migration.domain}/co/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: migration.origin,
      "user-agent": userAgent,
    },
    body: JSON.stringify({
      credential_type: "http://auth0.com/oauth/grant-type/password-realm",
      realm: "Username-Password-Authentication",
      username,
      password,
      client_id: migration.client_id,
    }),
  });

  return response.ok;
}

export async function connectIdLogin(
  migration: Migration,
  username: string,
  password: string,
) {
  const response = await fetch(
    `https://${
      migration.domain
    }/user/oauth/authorize?state=${Date.now()}&response_type=code&approval_prompt=auto&redirect_uri=${
      migration.origin
    }k&client_id=${migration.client_id}`,
    {
      headers: {
        "user-agent": userAgent,
        accept: "*/*",
      },
      redirect: "manual",
    },
  );

  if (response.status !== 302) {
    return false;
  }

  const cookies = response.headers.get("set-cookie");
  const location = response.headers.get("location");

  if (!location || !cookies) {
    return false;
  }

  const loginFormResponse = await fetch(location, {
    headers: {
      "user-agent": userAgent,
      cookie: cookies,
    },
  });

  const body = await loginFormResponse.text();
  const csrfTokenMatches = body.match(
    /<meta\s+name\s*=\s*"_csrf"\s+content\s*=\s*"([^"]*)"\s*\/>/,
  );
  const clientIdMatches = body.match(/clientId:\s*(\d+),/);
  if (!csrfTokenMatches || !clientIdMatches) {
    return false;
  }

  const csrfToken = csrfTokenMatches[1];
  const clientId = parseInt(clientIdMatches[1], 10);

  const loginResponse = await fetch(
    `https://${migration.domain}/user/programmaticLogin`,
    {
      method: "POST",
      headers: {
        "user-agent": userAgent,
        cookie: cookies,
        "content-type": "application/json;charset=UTF-8",
        "x-csrf-token": csrfToken,
        accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify({
        actuallySend: true,
        alwaysVerifyPassword: false,
        captcha: {},
        clientId,
        credential: username,
        password: password,
        rememberMe: true,
        transitions: [],
      }),
      redirect: "manual",
    },
  );

  return loginResponse.ok;
}

export async function migratePasswordHook(
  env: Env,
  tenantId: string,
  username: string,
  password: string,
) {
  const db = getDb(env);

  console.log("Start migration");

  try {
    const migrations = await db
      .selectFrom("migrations")
      .where("migrations.tenant_id", "=", tenantId)
      .selectAll()
      .execute();

    for (const migration of migrations) {
      let profile;

      switch (migration.provider) {
        case "auth0":
          profile = await auth0login(migration, username, password);
          break;
        case "connectId":
          profile = await connectIdLogin(migration, username, password);
          break;
      }

      if (profile) {
        return profile;
      }
    }

    return false;
  } catch (err) {
    console.log("Failed to fetch migrations");
    return false;
  }
}
