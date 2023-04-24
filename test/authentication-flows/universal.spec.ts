import { describe, expect, it } from "@jest/globals";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
} from "../../src/types";
import { mockedContext, mockedController } from "../test-helpers";

import { universalAuth } from "../../src/authentication-flows";
import { headers } from "../../src/constants";

describe("universalAuth", () => {
  it("should redirect to login using and packing the authParams in the state", async () => {
    // https://example.com/authorize?
    //   client_id=0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW&
    //   scope=openid+profile+email&
    //   redirect_uri=http%3A%2F%2Flocalhost%3A3000&
    //   response_type=code&
    //   response_mode=query&
    //   state=OE5oUVR4Y0NlMjR4fm9hVDBFaUVxbGZSWXVIUFU4VktFOElFcG11SWo1bw%3D%3D&
    //   nonce=Ykk2M0JNa2E1WnM5TUZwX2UxUjJtV2VITTlvbktGNnhCb1NmZG1idEJBdA%3D%3D&
    //   code_challenge=4OR7xDlggCgZwps3XO2AVaUXEB82O6xPQBkJIGzkvww&
    //   code_challenge_method=S256&
    //   auth0Client=eyJuYW1lIjoiYXV0aDAtcmVhY3QiLCJ2ZXJzaW9uIjoiMi4wLjEifQ%3D%3D
    const ctx = mockedContext();
    const controller = mockedController();

    await universalAuth({
      controller,
      authParams: {
        redirectUri: "http://localhost:3000",
        clientId: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
        nonce: "Ykk2M0JNa2E1WnM5TUZwX2UxUjJtV2VITTlvbktGNnhCb1NmZG1idEJBdA==&",
        responseType: AuthorizationResponseType.CODE,
        responseMode: AuthorizationResponseMode.QUERY,
        scope: "openid profile email",
        codeChallengeMethod: CodeChallengeMethod.S265,
        codeChallenge: "4OR7xDlggCgZwps3XO2AVaUXEB82O6xPQBkJIGzkvww",
      },
    });

    expect(controller.getHeader(headers.location)).toBe(
      "/u/login?state=eyJhdXRoUGFyYW1zIjp7InJlZGlyZWN0VXJpIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiY2xpZW50SWQiOiIwTjB3VUhYRmwwVE1UWTJMOWFESll2d1g3WHk4NEhrVyIsIm5vbmNlIjoiWWtrMk0wSk5hMkUxV25NNVRVWndYMlV4VWpKdFYyVklUVGx2Ymt0R05uaENiMU5tWkcxaWRFSkJkQT09JiIsInJlc3BvbnNlVHlwZSI6ImNvZGUiLCJyZXNwb25zZU1vZGUiOiJxdWVyeSIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJjb2RlQ2hhbGxlbmdlTWV0aG9kIjoiUzI1NiIsImNvZGVDaGFsbGVuZ2UiOiI0T1I3eERsZ2dDZ1p3cHMzWE8yQVZhVVhFQjgyTzZ4UFFCa0pJR3prdnd3In19"
    );
  });
});
