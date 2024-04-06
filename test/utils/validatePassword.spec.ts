import { describe, it, expect } from "vitest";
import validatePassword from "../../src/utils/validatePassword";

describe("validatePassword", () => {
  it("should return true if the password matches all the conditions", () => {
    const password = "Password123!";
    const result = validatePassword(password);
    expect(result).toBe(true);
  });

  it("should return false if the password does not contain a special character", () => {
    const password = "Password123";
    const result = validatePassword(password);
    expect(result).toBe(false);
  });

  it("should return false if the password does not contain a lower case character", () => {
    const password = "PASSWORD123!";
    const result = validatePassword(password);
    expect(result).toBe(false);
  });

  it("should return false if the password does not contain an upper case character", () => {
    const password = "password123!";
    const result = validatePassword(password);
    expect(result).toBe(false);
  });

  it("should return false if the password does not contain a number", () => {
    const password = "Password!";
    const result = validatePassword(password);
    expect(result).toBe(false);
  });

  it("should return false if the password is less than 8 characters", () => {
    const password = "Pass1!";
    const result = validatePassword(password);
    expect(result).toBe(false);
  });
});
