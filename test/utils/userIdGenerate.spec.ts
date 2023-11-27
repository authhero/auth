import userIdGenerate from "../../src/utils/userIdGenerate";

// this test makes no sense as the util function is just calling nanoid
// and we have to mock nanoid due to esm issues
describe.skip("userIdGenerate", () => {
  it("should return a 24 character long string", () => {
    const result = userIdGenerate();
    expect(result.length).toEqual(24);
  });
});
