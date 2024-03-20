import validatePassword from "../../src/utils/validatePassword";

describe("validatePassword", () => {
  it("should return true if the password is strong", () => {
    const password = "Password123!";
    const result = validatePassword(password);
    expect(result).toBe(true);
  });

  it("should return false if the password is weak", () => {
    const password = "password";
    const result = validatePassword(password);
    expect(result).toBe(false);
  });
});
