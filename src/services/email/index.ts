import { getDomainFromEmail } from "../../utils/email";
import { Client } from "../../types";
import { EmailOptions } from "./EmailOptions";

import sendWithMailchannels from "./mailchannels";
import sendWithMailgun from "./mailgun";

export default async function sendEmail(
  client: Client,
  emailOptions: EmailOptions,
) {
  const domainName = getDomainFromEmail(emailOptions.from.email);

  const domain = client.domains.find((d) => d.domain === domainName);

  switch (domain?.email_service) {
    case "mailgun":
      if (!domain.api_key) {
        throw new Error("Api key required");
      }

      return sendWithMailgun(emailOptions, domain.api_key);
    case "mailchannels":
    default:
      return sendWithMailchannels(emailOptions, domain?.dkim_private_key);
  }
}
