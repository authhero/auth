import { requestWithContext } from "../../fixtures/requestWithContext";
import { LogoutController } from "../../../src/routes/tsoa/logout";

import { contextFixture } from "../../fixtures/context";

describe("logout", () => {
  it("should return a redirect to the returnTo param and clear the session cookie", async () => {
    const stateData = {};

    const ctx = contextFixture({
      stateData,
    });

    const controller = new LogoutController();
    const actual = await controller.logout(
      requestWithContext(ctx),
      "clientId",
      "http://localhost:3000",
    );

    expect(actual).toBe("Redirecting");
    expect(controller.getStatus()).toBe(302);

    const location = controller.getHeader("location");
    expect(location).toBe("http://localhost:3000");

    const cookieHeader = controller.getHeader("set-cookie");
    expect(cookieHeader).toBe(
      "auth-token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None",
    );
  });

  it("should return a redirect to the referer header if the returnTo is not specified", async () => {
    const stateData = {};

    const ctx = contextFixture({
      stateData,
      headers: {
        referer: "http://localhost:3000",
      },
    });

    const controller = new LogoutController();
    const actual = await controller.logout(
      requestWithContext(ctx),
      "clientId",
      undefined,
    );

    expect(actual).toBe("Redirecting");
    expect(controller.getStatus()).toBe(302);

    const location = controller.getHeader("location");
    expect(location).toBe("http://localhost:3000");

    const cookieHeader = controller.getHeader("set-cookie");
    expect(cookieHeader).toBe(
      "auth-token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None",
    );
  });
});
