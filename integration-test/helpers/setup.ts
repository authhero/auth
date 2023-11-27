import exp from "constants";
import { getAdminToken } from "./token";

export async function setup(worker: any) {
  const token = await getAdminToken();

  const createTenantResponse = await worker.fetch("/api/v2/tenants", {
    method: "POST",
    body: JSON.stringify({
      name: "tenant",
      audience: "test",
      sender_name: "test",
      sender_email: "test@example.com",
    }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });

  if (createTenantResponse.status !== 201) {
    throw new Error(
      `Setup: Failed to create tenant: ${await createTenantResponse.text()}`,
    );
  }

  const tenant = await createTenantResponse.json();

  const createAppResponse = await worker.fetch(
    `/tenants/${tenant.id}/applications`,
    {
      method: "POST",
      body: JSON.stringify({
        id: "app",
        name: "string",
        allowed_web_origins: "",
        allowed_callback_urls: "",
        allowed_logout_urls: "",
        email_validation: "disabled",
        client_secret: "appSecret",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    },
  );

  if (createAppResponse.status !== 201) {
    throw new Error(
      `Setup: Failed to create tenant: ${await createAppResponse.text()}`,
    );
  }

  // create a new foobar user here that can use to login
  const createUserResponse = await worker.fetch("/api/v2/users", {
    method: "POST",
    body: JSON.stringify({
      email: "foo@bar.com",
      password: "password",
    }),
    headers: {
      authorization: `Bearer ${token}`,
      "tenant-id": tenant.id,
      "content-type": "application/json",
    },
  });

  if (createUserResponse.status !== 201) {
    throw new Error(
      `Setup: Failed to create user: ${await createUserResponse.text()}`,
    );
  }

  // create a new conneciton fake-social-connection
  const createConnectionResponse = await worker.fetch(
    `/tenants/${tenant.id}/connections`,
    {
      method: "POST",
      body: JSON.stringify({
        name: "fake-social-connection",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": tenant.id,
        "content-type": "application/json",
      },
    },
  );

  if (createConnectionResponse.status !== 201) {
    throw new Error(
      `Setup: Failed to create connection: ${await createConnectionResponse.text()}`,
    );
  }

  return token;
}
