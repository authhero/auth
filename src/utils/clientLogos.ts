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

// I think we'll still want to do this clientside?

function getClientLogo(client_id: string) {
  const client = CLIENT_LOGOS.find((c) => c.client_id === client_id);
  if (client) {
    return client.logo;
  }
  return SESAMY_LOGO.logo;
}

const IMAGE_PROXY_URL = "https://imgproxy.prod.sesamy.cloud";

// this is what we're doing currently on the checkout_v2 emails
// https://imgproxy.prod.sesamy.cloud/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmNvbS9sb2dvcy9icmVha2l0LnN2Zw==

export function getClientLogoPngGreyBg(client_id: string) {
  const svgLogo = getClientLogo(client_id);

  const svgLogoBase64 = btoa(svgLogo);

  const pngLogo = `${IMAGE_PROXY_URL}/unsafe/format:png/rs:fill:166/${svgLogoBase64}`;

  return pngLogo;
}
