interface GetTokenParams {
  privateKey: string;
  payload: { [key: string]: string };
  alg: string;
  headerAdditions: { [key: string]: string };
}

export async function getToken(params: GetTokenParams) {
  return JSON.stringify(params.payload);
}
