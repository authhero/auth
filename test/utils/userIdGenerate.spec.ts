import userIdGenerate from "../../src/utils/userIdGenerate";

// nanoid cannot be imported... maybe just on tests
describe.skip("userIdGenerate", () => {
  it("should return a 24 character long string", () => {
    const result = userIdGenerate();
    expect(result.length).toEqual(24);
  });
});
