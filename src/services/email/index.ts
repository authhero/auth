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

  switch (domain?.emailService) {
    case "mailgun":
      if (!domain.apiKey) {
        throw new Error("Api key required");
      }

      return sendWithMailgun(emailOptions, domain.apiKey);
    case "mailchannels":
    default:
      return sendWithMailchannels(emailOptions, domain?.dkimPrivateKey);
  }
}
