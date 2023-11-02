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
}
