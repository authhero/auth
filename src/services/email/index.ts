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

  const domain = client.domains.find((d) => d.domain === domainName) || {};

  const emailOptionsWithDefaults = {
    ...domain,
    ...emailOptions,
  };

  switch (emailOptionsWithDefaults.emailService) {
    case "mailgun":
      return sendWithMailgun(emailOptions);
    case "mailchannels":
    default:
      return sendWithMailchannels(emailOptions);
  }
}
