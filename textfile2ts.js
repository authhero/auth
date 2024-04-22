// duplicate of build-tailwind: use this there!
const fs = require("fs");

if (process.argv.length !== 3) {
  console.error("src, dest, name are required");
  process.exit(1);
}

const src = process.argv[0];
const dest = process.argv[1];
const name = process.argv[2];

const srcContent = fs.readFileSync(src, "utf8");

// this was needed for the tailwind CSS files...
const contentCleaned = cssContent.replaceAll("`", "'");

const tsContent = `export const ${name} = \`
    ${contentCleaned}\`
`;

fs.writeFileSync(dest, tsContent);
