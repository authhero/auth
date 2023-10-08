import { nanoid } from "nanoid";
import { Certificate } from "../models/Certificate";

export interface KeyPair {
  privateKey: string;
  publicKey: any;
  created_at: number;
}

export async function create(): Promise<Certificate> {
  let keyPair = (await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )) as CryptoKeyPair;

  const kid = nanoid();

  const privateKey = await toPrivatePEM(keyPair.privateKey, kid);
  const publicJWKS = await toJWKS(keyPair.publicKey);

  return {
    privateKey,
    publicKey: {
      alg: "RS256",
      e: "AQAB",
      kty: "RSA",
      n: publicJWKS.n,
      use: "sig",
    },
    kid,
    created_at: Date.now(),
  };
}

function arrayBufferToBase64String(arrayBuffer: ArrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = "";
  for (var i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return btoa(byteString);
}

function convertBinaryToPem(binaryData: ArrayBuffer, label: string) {
  const base64Cert = arrayBufferToBase64String(binaryData);
  let pemCert = "-----BEGIN RSA PRIVATE KEY-----\r\n";
  let nextIndex = 0;

  while (nextIndex < base64Cert.length) {
    if (nextIndex + 64 <= base64Cert.length) {
      pemCert += base64Cert.substr(nextIndex, 64) + "\r\n";
    } else {
      pemCert += base64Cert.substr(nextIndex) + "\r\n";
    }
    nextIndex += 64;
  }
  pemCert += "-----END RSA PRIVATE KEY-----\r\n";
  return pemCert;
}

export async function toPrivatePEM(
  key: CryptoKey,
  kid: string,
): Promise<string> {
  const pkcs8Key = (await crypto.subtle.exportKey("pkcs8", key)) as ArrayBuffer;

  return convertBinaryToPem(pkcs8Key, kid);
}

export async function toJWKS(key: CryptoKey): Promise<JsonWebKey> {
  return (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
}
