import { customAlphabet } from "nanoid";

const ID_LENGTH = 24;

export default function userIdGenerate() {
  const alphabet = "0123456789abcdef";

  console.log("customAlphabet is", customAlphabet);

  const generateHexId = customAlphabet(alphabet, ID_LENGTH);

  const hexId = generateHexId();
  return hexId;
}
