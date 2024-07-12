const fs = require("fs");
const csv = require("csv-parser");

const token =
  "eyJraWQiOiJZdjdFdFNWalRjcDZVS3k4SzBCa08iLCJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkZWZhdWx0Iiwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsInBlcm1pc3Npb25zIjpbImF1dGg6cmVhZCIsImF1dGg6d3JpdGUiLCJyZWFkOnN0YXRlIl0sInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTA4NzkxMDA0NjcxMDcyODE3Nzk0Iiwia2lkIjoiWXY3RXRTVmpUY3A2VUt5OEswQmtPIiwiaXNzIjoiaHR0cHM6Ly90b2tlbi5zZXNhbXkuY29tLyIsImlhdCI6MTcyMDc2NzcwNiwiZXhwIjoxNzIwODU0MTA2fQ.3M5k-DhaRfGgk714lBceE-gc_SvW82S1euFKJyFpRIkwdVZsMJmCh-N6b45p0SJeeUQ7svATjEzzgNpXv1uLhDTxGQJIBScj0Mo3dGGEsQnhCGR4tWK_e-Ny1vDVSQ-8l2aBwnTKe1dnYceHothjmlL-WM_grz7jmRcU5HjZAyMSkvHdDhw5jYLFwOH3YWY3P3FUgL2l4UnlLQdCkQPcPJ-wnAxKY3m-gNPitjNT5LGuxNKswE_rjXnUW2l12ZNKMwduAoWkKS7NOmKAnl7-UslmD_cQnBwwyt379AOMKsbLu1H4NBT9DMo9MocttwYpJaSYZYEySNi2NlhTUEVskZ3jF_QVVYdajZtaEzAeVBmqPmUh_E7Rk_sWi1nfHE0vhVaJ_MYGaI-0TYP_p5aejJoXjN116ZcyhM1ozuSmiLlRReDZgSzF9JgqqhNVGlQvDOueId9iMCOnih3tPsygPaiy6Q047iklR-6FdgcT2JJy9kQzuTERs-RpoSNS_QzEpmMOQRP1h5oXjOzWQ7Io76Tptotf_Xvwg-xqXnuronwpqGdRwvpfrX-pPeO_Ls5PWNmPgApS22IC2cbDGRwnJ2_G4Ef-LX7wYzoxDpd3HQPEEYBoPOLmiTzGrTLzNrHQmKroZxz1DKGss3PjvSCbX-obJjmjot_hFe4eSuL5f0k";

function getProviderAndId(id) {
  const [provider, userId] = id.split("|");

  switch (provider) {
    case "google-oauth2":
      return {
        provider: "google-oauth2",
        connection: "google-oauth2",
        user_id: userId,
      };
    case "facebook":
      return { provider: "facebook", connection: "facebook", user_id: userId };
    case "apple":
      return { provider: "apple", connection: "apple", user_id: userId };
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
