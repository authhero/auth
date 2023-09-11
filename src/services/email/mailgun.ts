import { getDomainFromEmail } from "../../utils/email";
import { EmailOptions } from "./EmailOptions";

export default async function send(emailOptions: EmailOptions, apiKey: string) {
  const apiUrl = `https://api.eu.mailgun.net/v3/${getDomainFromEmail(
    emailOptions.from.email,
  )}/messages`;

  const headers = new Headers();
  headers.set("Authorization", `Basic ${btoa(`api:${apiKey}`)}`);
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

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed with status: ${response.status}`);
  }
}
