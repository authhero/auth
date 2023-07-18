import { describe, expect, it } from "@jest/globals";
import {
  AuthorizationResponseType,
  CodeChallengeMethod,
} from "../../src/types";
import { contextFixture, controllerFixture } from "../fixtures";

import { silentAuth } from "../../src/authentication-flows";
import { base64ToHex } from "../../src/utils/base64";

describe("silentAuth", () => {
  it('should render an iframe with "login required" as error if the user is not authenticated', async () => {
    const ctx = contextFixture();
    const controller = controllerFixture();

    const actual = await silentAuth({
      env: ctx.env,
      controller,
      cookie_header: null,
      redirect_uri: "https://example.com",
      state: "",
      response_type: AuthorizationResponseType.CODE,
    });

    expect(actual.includes("login_required")).toBe(true);
  });

  // these tests are duplicated on authorize.spec.ts
  it("should render an iframe with a code and state if the code challenge method is S256", async () => {
    // https://auth.example.com/authorize?
    //   client_id=0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW&
    //   scope=openid+profile+email&
    //   redirect_uri=http%3A%2F%2Flocalhost%3A3000&
    //   prompt=none&response_type=code&
    //   response_mode=web_message&
    //   state=RTdoMnEyWnRmdFFyR3RydG0ub3V4akNTSEQuV0RkVHZ0bVdPaXFVOXYxRQ%3D%3D&
    //   nonce=NUgzNzVyTUVnU2o4WERNYVFwYjJ2VUU2WnpRTTFmVzlSaVNsUGp5QlZIRQ%3D%3D&
    //   code_challenge=48-0wuTLqfWbYToVwavCU9afSDV5iVB1NZccOOjjeYg&
    //   code_challenge_method=S256&
    //   auth0Client=eyJuYW1lIjoiYXV0aDAtcmVhY3QiLCJ2ZXJzaW9uIjoiMi4wLjEifQ%3D%3D' \

    const stateInstanceId = base64ToHex("token-state");

    const ctx = contextFixture({
      stateData: {
        [stateInstanceId]: JSON.stringify({
          foo: "bar",
        }),
      },
    });
    const controller = controllerFixture();

    const actual = await silentAuth({
      env: ctx.env,
      controller,
      cookie_header: "auth-token=token-state",
      redirect_uri: "https://example.com",
      state: "RTdoMnEyWnRmdFFyR3RydG0ub3V4akNTSEQuV0RkVHZ0bVdPaXFVOXYxRQ==",
      response_type: AuthorizationResponseType.CODE,
      nonce: "nonce",
      code_challenge_method: CodeChallengeMethod.S265,
      code_challenge: "48-0wuTLqfWbYToVwavCU9afSDV5iVB1NZccOOjjeY",
    });

    expect(
      actual.includes(
        '{"code":"AAAAAA4","state":"RTdoMnEyWnRmdFFyR3RydG0ub3V4akNTSEQuV0RkVHZ0bVdPaXFVOXYxRQ=="}',
      ),
    ).toBe(true);
  });

  it("should render an iframe with a new access and id-token", async () => {
   

    const stateInstanceId = base64ToHex("token-state");

    const ctx = contextFixture({
      stateData: {
        [stateInstanceId]: JSON.stringify({
          foo: "bar",
        }),
      },
    });
    const controller = controllerFixture();

    const actual = await silentAuth({
      env: ctx.env,
      controller,
      cookie_header: "auth-token=token-state",
      redirect_uri: "https://example.com",
      state: "RTdoMnEyWnRmdFFyR3RydG0ub3V4akNTSEQuV0RkVHZ0bVdPaXFVOXYxRQ==",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      nonce: "nonce",
    });

  
    expect(actual).toContain('response: {"access_token');
    expect(actual).toContain("id_token");

    expect(actual).toContain('var targetOrigin = "https://example.com";');
  });
});
