import { describe, expect, it } from "@jest/globals";
import { contextFixture, controllerFixture } from "../fixtures";

import { ticketAuth } from "../../src/authentication-flows";
import { base64ToHex } from "../../src/utils/base64";

describe("passwordlessAuth", () => {
  it("should redirect with implicit flow as anchor links", async () => {
    const ticketInstanceId = base64ToHex("ticket");

    const ctx = contextFixture({
      stateData: {
        [ticketInstanceId]: JSON.stringify({
          authParams: {
            scope: "openid profile email",
          },
        }),
      },
    });
    const controller = controllerFixture();
    const ticket = "ticket";
    const state =
      "redirect_uri=https%3A%2F%2Fexample.com&client_id=kvartal&response_type=code&state=12345678";
    const redirectUri = "https://example.com";

    const response = await ticketAuth(
      ctx.env,
      controller,
      ticket,
      state,
      redirectUri
    );

    const redirectHeader = controller.getHeader("location") as string;
    const redirectURL = new URL(redirectHeader);
    const hashParams = new URLSearchParams(redirectURL.hash.slice(1));

    // console.log(redirectURL.hash.slice(1));

    expect(response).toEqual("Redirecting");
    expect(controller.getStatus()).toEqual(302);
    expect(hashParams.get("access_token")).toBe("access_token");
    expect(hashParams.get("id_token")).toBe("id_token");
    expect(hashParams.get("token_type")).toBe("Bearer");
    expect(hashParams.get("expires_in")).toBe("28800");
    expect(hashParams.get("state")).toBe(encodeURIComponent(state));
    expect(hashParams.get("state")).toBe(
      "redirect_uri%3Dhttps%253A%252F%252Fexample.com%26client_id%3Dkvartal%26response_type%3Dcode%26state%3D12345678"
    );
    expect(hashParams.get("scope")).toBe("openid profile email");
  });
});
