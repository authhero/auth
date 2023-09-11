import { getDomainFromEmail } from "../../utils/email";
import { EmailOptions } from "./EmailOptions";

export default async function send(emailOptions: EmailOptions, dkim?: string) {
  const { to, from, subject, content } = emailOptions;

  const domain = getDomainFromEmail(from.email);

  const body = JSON.stringify({
    personalizations: [
      {
        to,
        // Add dkim if configured
        ...(dkim
          ? {
              dkim_domain: domain,
              dkim_selector: "mailchannels",
              dkim_private_key: dkim,
            }
          : {}),
      },
    ],
    from,
    subject,
    content,
  });

  const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Failed to send email: " + (await response.text()));
  }
}
