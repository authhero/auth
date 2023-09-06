const fs = require("fs");
const readline = require("readline");
const Papa = require("papaparse");

const token = "add token here...";
const tenantId = "YH0yxCXqdc-UuPD_1MqSY";
const apiUrl = "https://auth2.sesamy.com";

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

  const response = await fetch(`${apiUrl}/tenants/${tenantId}/users`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    console.log(
      `Status: ${response.status}, with error ${await response.text()}`,
    );
  } else {
    console.log(".");
  }
}

function getCsvUsers(filePath) {
  const csvString = fs.readFileSync(filePath, "utf8");

  const { data } = Papa.parse(csvString, {
    header: true,
  });

  return data.map((user) => ({
    name: user.fullName,
    email: user.email,
    tags: [],

    id: user.id,
    createdAt: user.createdAt,
  }));
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

async function importUsersFromCsv(file) {
  const users = getCsvUsers(file);

  for await (const user of users) {
    try {
      await postUser(user);
    } catch (error) {
      console.error(`Failed to parse line: ${user}. Error: ${error.message}`);
    }
  }
}

// importUsers("./data/auth0-dev.json");
importUsersFromCsv("./data/kvartal-auth0.csv");
