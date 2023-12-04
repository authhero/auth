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

  // TODO - why not move all this into test-server.ts?
  const createOtherTenantResponse = await worker.fetch("/api/v2/tenants", {
    method: "POST",
    body: JSON.stringify({
      name: "otherTenant",
      // change these!
      audience: "test",
      sender_name: "test",
      sender_email: "test@example.com",
    }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });

  if (createOtherTenantResponse.status !== 201) {
    throw new Error(
      `Setup: Failed to create other tenant: ${await createTenantResponse.text()}`,
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

  return token;
}
