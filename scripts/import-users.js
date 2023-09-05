const fs = require("fs");
const readline = require("readline");

const token = "Add token here...";
const tenantId = "AH_1eG1-Ouam8jRlSd1fI";

async function postUser(user) {
  const body = JSON.stringify({
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    picture: user.picture,
    tags: [],
    givenName: user.given_name,
    familyName: user.family_name,
    id: user.user_id,
    createdAt: user.created_at,
    modifiedAt: user.updated_at,
  });

  const response = await fetch(
    `https://auth2.sesamy.dev/tenants/${tenantId}/users`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body,
    },
  );

  if (!response.ok) {
    console.log(
      `Status: ${response.status}, with error ${await response.text()}`,
    );
  }
}

async function importUsers(filePath) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity, // so it can handle even `\r\n` ending lines correctly
  });

  let counter = 0;

  for await (const line of rl) {
    try {
      const user = JSON.parse(line);

      await postUser(user);
    } catch (error) {
      console.error(`Failed to parse line: ${line}. Error: ${error.message}`);
    }
  }
}

importUsers("./data/auth0-dev.json");
