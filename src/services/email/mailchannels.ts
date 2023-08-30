import { EmailOptions } from "./EmailOptions";

export default async function send(emailOptions: EmailOptions) {
  const { to, from, dkim, subject, content } = emailOptions;

  const body = JSON.stringify({
    personalizations: [
      {
        to,
        // Add dkim if configured
        ...(dkim
          ? {
              dkim_domain: dkim.domain,
              dkim_selector: "mailchannels",
              dkim_private_key: dkim.dkimPrivateKey,
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
