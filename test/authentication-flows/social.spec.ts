import { describe, expect, it } from "@jest/globals";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
} from "../../src/types";
import { mockedContext, mockedController } from "../helpers";

import { socialAuthCallback } from "../../src/authentication-flows";
import { headers } from "../../src/constants";

describe("socialAuth", () => {
  it("should redirect to login using and packing the authParams in the state", async () => {
    // https://example.com/callback?
    // state=VIcbol-G1j9chVJBrC5PymcpGK-ceywf&
    // code=4%2F0AVHEtk5HOteFuj-0pabtchc9e2cDjEmVG3MCYzyyWqUKoM9XlMKt4Zc72GuSj5GdVru0ug&
    // scope=email+profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&
    // authuser=0&
    // hd=sesamy.com&
    // prompt=none
    const ctx = mockedContext();
    const controller = mockedController();

    await socialAuthCallback({
      ctx,
      controller,
      state: "",
      code: "4/0AVHEtk5HOteFuj-0pabtchc9e2cDjEmVG3MCYzyyWqUKoM9XlMKt4Zc72GuSj5GdVru0ug",
    });

    expect(controller.getHeader(headers.location)).toBe(
      "http://localhost:3000/?code=8K9tq1yXuQkfXjqty4yBjpb1xSI222mdfuN3Jzro-4wyD&state=V1BfQmd4amVSaDN4ckplR3lpczYxYkhaNTlNZ1pQYVBTWW4uYXQ4NXpyUQ%3D%3D"
    );
  });
});
