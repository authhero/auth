import createFetchMock from "vitest-fetch-mock";
import { describe, it, expect, beforeEach, vi } from "vitest";
import send from "../../../src/services/email/mailgun";
import { EmailOptions } from "../../../src/services/email/EmailOptions";

describe("send", () => {
  beforeEach(() => {
    const fetchMocker = createFetchMock(vi);
    fetchMocker.enableMocks();
  });

  it("should correctly call Mailgun API", async () => {
    const testEmailOptions: EmailOptions = {
      to: [{ email: "test@example.com", name: "Test User" }],
      from: { email: "sender@mydomain.com", name: "Sender" },
      subject: "Test Subject",
      content: [
        { type: "text/plain", value: "Test plain content" },
        { type: "text/html", value: "<p>Test HTML content</p>" },
      ],
    };

    fetchMock.mockResponse(JSON.stringify({ message: "Queued. Thank you." }), {
      status: 200, // or whatever status you expect for success
      headers: { "content-type": "application/json" },
    });

    await send(testEmailOptions, "test-api-key");

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "https://api.eu.mailgun.net/v3/mydomain.com/messages",
    );
    expect(fetchMock.mock.calls?.[0]?.[1]?.method).toEqual("POST");
  });

  it("should throw an error for bad responses", async () => {
    const testEmailOptions: EmailOptions = {
      to: [{ email: "test@example.com", name: "Test User" }],
      from: { email: "sender@mydomain.com", name: "Sender" },
      subject: "Test Subject",
      content: [
        { type: "text/plain", value: "Test plain content" },
        { type: "text/html", value: "<p>Test HTML content</p>" },
      ],
    };

    fetchMock.mockReject(new Error("API call failed"));

    await expect(send(testEmailOptions, "test-api-key")).rejects.toThrow(
      "API call failed",
    );
  });
});
