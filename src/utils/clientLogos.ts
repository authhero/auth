export function getClientLogoPngGreyBg(svgLogo: string, imageProxyUrl: string) {
  const svgLogoBase64 = btoa(svgLogo);

  const pngLogo = `${imageProxyUrl}/unsafe/format:png/rs:fill:166/${svgLogoBase64}`;

  return pngLogo;
}
