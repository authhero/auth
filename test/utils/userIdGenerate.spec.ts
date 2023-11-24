import userIdGenerate from "../../src/utils/userIdGenerate";

describe("userIdGenerate", () => {
  it("should return a 24 character long string", () => {
    const result = userIdGenerate();
    expect(result.length).toEqual(24);
  });
});
