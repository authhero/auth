export function getDomainFromEmail(email: string): string {
  const domainMatch = email.match(/@([\w.-]+)/);
  return domainMatch ? domainMatch[1] : "";
}
