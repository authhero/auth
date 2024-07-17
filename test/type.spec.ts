import {
  applicationInsertSchema,
  ApplicationInsert,
} from "@authhero/adapter-interfaces";
import { describe, expect, it } from "vitest";

describe("ApplicationInsert", () => {
  it("should validate the ApplicationInsert schema", () => {
    const exampleData: ApplicationInsert = {
      id: "123",
      name: "Example",
      allowed_web_origins: "",
      allowed_callback_urls: "",
      allowed_logout_urls: "",
      email_validation: "enabled",
      client_secret: "",
      disable_sign_ups: false,
    };

    const parsedData = applicationInsertSchema.parse(exampleData);

    expect(exampleData).toEqual(parsedData);
  });
});
