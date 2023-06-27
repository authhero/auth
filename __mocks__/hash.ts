// This is a mock function for your `hash` function
export default async function hash(
  data: string,
  algorithm: "SHA-256" | "SHA-1" = "SHA-256"
): Promise<string> {
  // You can define the behavior of your mock function here.
  // In this example, we'll just return a static string.
  return "mock-hash-string";
}
