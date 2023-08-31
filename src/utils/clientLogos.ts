import { Env } from "../types/Env";

const SESAMY_LOGO = {
  client_id: "sesamy",
  // TODO - needs to be SVG!
  logo: "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
};

// we'll get these from the database - which should be pushed when HQ updates
const CLIENT_LOGOS = [
  SESAMY_LOGO,
  {
    client_id: "kvartal",
    logo: "https://checkout.sesamy.com/images/kvartal-logo.svg",
  },
  {
    client_id: "breakit",
    logo: "https://assets.sesamy.com/logos/breakit.svg",
  },
];

function getClientLogo(client_id: string) {
  const client = CLIENT_LOGOS.find((c) => c.client_id === client_id);
  if (client) {
    return client.logo;
  }
  return SESAMY_LOGO.logo;
}

export function getClientLogoPngGreyBg(
  client_id: string,
  imageProxyUrl: string,
) {
  const svgLogo = getClientLogo(client_id);

  const svgLogoBase64 = btoa(svgLogo);

  const pngLogo = `${imageProxyUrl}/unsafe/format:png/rs:fill:166/${svgLogoBase64}`;

  return pngLogo;
}
