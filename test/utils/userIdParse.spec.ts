import userIdParse from "../../src/utils/userIdParse";

// mock console.error just for this test suite
// the second test will console.error
jest.spyOn(console, "error").mockImplementation(() => {});

describe("userIdParse", () => {
  it("should return the id part of the user_id if prefixed with provider and pipe", () => {
    const result = userIdParse("auth0|1234567890");
    expect(result).toEqual("1234567890");
  });

  it("should return the id if user_id only only contains the id", () => {
    // this is the defensive programming
    const result = userIdParse("1234567890");
    expect(result).toEqual("1234567890");
  });
});
