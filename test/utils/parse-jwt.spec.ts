import { parseJwt } from "../../src/utils/parse-jwt";

describe("parseJwt", () => {
  it("should parse a valid JWT", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const expectedPayload = {
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    };

    expect(parseJwt(token)).toEqual(expectedPayload);
  });

  it("should correctly parse special characters", () => {
    // Payload: {"name": "åäö"}
    const tokenWithSpecialChars =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiw6XDpMO2In0.6Nl1xRr_9UQa1Rclc7TgQysVUVhJwOZ9a9nD5EoUOI4";
    const expectedPayloadWithSpecialChars = {
      name: "åäö",
    };

    expect(parseJwt(tokenWithSpecialChars)).toEqual(
      expectedPayloadWithSpecialChars,
    );
  });

  it("should throw an error for an invalid token", () => {
    const invalidToken = "invalid.token";

    expect(() => parseJwt(invalidToken)).toThrow();
  });
});
