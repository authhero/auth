import { getDomainFromEmail } from "../../utils/email";
import { EmailOptions } from "./EmailOptions";

export default async function send(emailOptions: EmailOptions) {
  const API_URL = `https://api.mailgun.net/v3/${getDomainFromEmail(
    emailOptions.from.email,
  )}/messages`;
  const API_KEY = emailOptions.apiKey;

  const headers = new Headers();
  headers.set("Authorization", "Basic " + btoa(`api ${API_KEY}`));
  headers.set("Content-Type", "application/x-www-form-urlencoded");

  const htmlContent = emailOptions.content.find(
    (content) => content.type === "text/html",
  );

  const textContent = emailOptions.content.find(
    (content) => content.type === "text/plain",
  );

  const recipients = emailOptions.to
    .map((recipient) => `${recipient.name} <${recipient.email}>`)
    .join(",");

  const formData = new URLSearchParams();
  formData.append(
    "from",
    `${emailOptions.from.name} <${emailOptions.from.email}>`,
  );
  formData.append("to", recipients);
  formData.append("subject", emailOptions.subject);
  if (htmlContent) {
    formData.append("html", htmlContent.value);
  }
  if (textContent) {
    formData.append("text", textContent.value);
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: headers,
    body: formData,
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Failed with status: ${response.status}`);
  }
}
