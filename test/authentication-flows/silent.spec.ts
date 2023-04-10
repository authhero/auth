import { describe, expect, it } from "@jest/globals";
import {
  AuthorizationResponseType,
  CodeChallengeMethod,
} from "../../src/types";
import { mockedContext, mockedController, mockedNamespace } from "../helpers";

import { silentAuth } from "../../src/authentication-flows";
import { State } from "../../src/models";

describe("silentAuth", () => {
  it('should render an iframe with "login required" as error if the user is not authenticated', async () => {
    const ctx = mockedContext();
    const controller = mockedController();

    const actual = await silentAuth({
      ctx,
      controller,
      cookieHeader: null,
      redirectUri: "https://example.com",
      state: "",
      responseType: AuthorizationResponseType.CODE,
    });

    expect(actual.includes("login_required")).toBe(true);
  });

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

    const ctx = mockedContext();
    const controller = mockedController();

    const actual = await silentAuth({
      ctx,
      controller,
      cookieHeader: "auth-token=token-state",
      redirectUri: "https://example.com",
      state: "RTdoMnEyWnRmdFFyR3RydG0ub3V4akNTSEQuV0RkVHZ0bVdPaXFVOXYxRQ==",
      responseType: AuthorizationResponseType.CODE,
      nonce: "nonce",
      codeChallengeMethod: CodeChallengeMethod.S265,
      codeChallenge: "48-0wuTLqfWbYToVwavCU9afSDV5iVB1NZccOOjjeY",
      State: mockedNamespace<typeof State>({
        getState: {
          query: async () => {
            return JSON.stringify({
              foo: "bar",
            });
          },
        },
      }),
    });

    expect(
      actual.includes(
        '{"code":"-o5wLPh_YNZjbEV8vGM3VWcqdoFW34p30l5xI0Zm5JUd1","state":"RTdoMnEyWnRmdFFyR3RydG0ub3V4akNTSEQuV0RkVHZ0bVdPaXFVOXYxRQ=="}'
      )
    ).toBe(true);
  });
});
