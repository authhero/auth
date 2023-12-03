import { stateEncode, stateDecode } from "../../src/utils/stateEncode";

describe("stateEncode", () => {
  it("should encode a state object to a string", () => {
    const state = {
      userId: "123",
      authParams: "abc",
      nonce: "xyz",
      state: "state",
      sid: "sid",
      user: "user",
    };
    expect(stateEncode(state)).toEqual(
      "eyJ1c2VySWQiOiIxMjMiLCJhdXRoUGFyYW1zIjoiYWJjIiwibm9uY2UiOiJ4eXoiLCJzdGF0ZSI6InN0YXRlIiwic2lkIjoic2lkIiwidXNlciI6InVzZXIifQ",
    );
  });
});

describe("stateDecode", () => {
  it("should decode a state string to an object", () => {
    const state =
      "eyJ1c2VySWQiOiIxMjMiLCJhdXRoUGFyYW1zIjoiYWJjIiwibm9uY2UiOiJ4eXoiLCJzdGF0ZSI6InN0YXRlIiwic2lkIjoic2lkIiwidXNlciI6InVzZXIifQ";
    expect(stateDecode(state)).toEqual({
      userId: "123",
      authParams: "abc",
      nonce: "xyz",
      state: "state",
      sid: "sid",
      user: "user",
    });
  });
});
