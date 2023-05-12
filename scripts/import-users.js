const fs = require("fs");
const readline = require("readline");

async function processLineByLine() {
  const fileStream = fs.createReadStream("data/sesamy-dev.json");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Each line in the input will be successively available here as `line`.
    // Parse the line as JSON
    const obj = JSON.parse(line);

    // Now `obj` is an object, and you can access its properties:
    console.log(obj);
  }
}

processLineByLine();
