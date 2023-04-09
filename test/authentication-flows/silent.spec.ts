import { silentAuth } from "../../src/authentication-flows";
import { describe, expect, it } from "@jest/globals";
import { AuthorizationResponseType, Env } from "../../src/types";
import { mockedContext, mockedController } from "../helpers";

describe("silentAuth", () => {
  it('should render an iframe with "login required" as error if the user is not authenticated', async () => {
    const ctx = mockedContext();
    const controller = mockedController();

    controller.setHeader("asdf", "asdf");

    const actual = await silentAuth(
      ctx,
      controller,
      null,
      "https://example.com",
      "",
      AuthorizationResponseType.CODE
    );

    expect(actual.includes("login_required")).toBe(true);
  });
});
