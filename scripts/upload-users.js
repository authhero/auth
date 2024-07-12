const fs = require("fs");
const csv = require("csv-parser");

const token = "add token here...";

function getProviderAndId(id) {
  const [provider, userId] = id.split("|");

  switch (provider) {
    case "google-oauth2":
      return {
        provider: "google-oauth2",
        connection: "google-oauth2",
        user_id: userId,
        is_social: true,
      };
    case "facebook":
      return {
        provider: "facebook",
        connection: "facebook",
        user_id: userId,
        is_social: true,
      };
    case "apple":
      return {
        provider: "apple",
        connection: "apple",
        user_id: userId,
        is_social: true,
      };
    case "email":
      return { provider: "email", connection: "email", user_id: userId };
    case "auth0":
      return {
        provider: "auth0",
        connection: "Username-Password-Authentication",
        user_id: userId,
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function postUser(user) {
  const body = JSON.stringify({
    name: user["Address Name"],
    email: user.Email,
    nickname: user["Nickname"],
    picture: user.picture || "", // Assuming there's no picture field in CSV, add a default or handle it accordingly
    given_name: user["First Name"],
    family_name: user["Last name"],
    created_at: user["User creation date"],
    modified_at: user["User modified date"],
    ...getProviderAndId(user["User id"]),
  });

  const response = await fetch("http://localhost:8787/api/v2/users", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "tenant-id": "0DNqqRWQ1KsGzMNVu5qkY",
    },
    body,
  });

  if (!response.ok) {
    console.log(
      `Status: ${response.status}, with error ${await response.text()}`,
    );
  } else {
    console.log(`User: ${user["User id"]} posted successfully`);
  }
}

async function importUsers(filePath) {
  const fileStream = fs.createReadStream(filePath);

  const users = [];

  fileStream
    .pipe(csv())
    .on("data", (data) => users.push(data))
    .on("end", async () => {
      for (const user of users) {
        try {
          await postUser(user);
        } catch (error) {
          console.error(
            `Failed to post user: ${user["User id"]}. Error: ${error.message}`,
          );
        }
      }
    });
}

importUsers("./data/feber.csv");
