import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), "node_modules/lightningcss/node/index.js");

if (!existsSync(target)) {
  process.exit(0);
}

const source = readFileSync(target, "utf8");
const original = `  try {
    module.exports = require(\`lightningcss-\${parts.join('-')}\`);
  } catch (err) {
    module.exports = require(\`../lightningcss.\${parts.join('-')}.node\`);
  }
`;

const patched = `  try {
    module.exports = require(\`lightningcss-\${parts.join('-')}\`);
  } catch (err) {
    try {
      module.exports = require(\`../../lightningcss-\${parts.join('-')}/lightningcss.\${parts.join('-')}.node\`);
    } catch (fallbackErr) {
      module.exports = require(\`../lightningcss.\${parts.join('-')}.node\`);
    }
  }
`;

if (source.includes("../../lightningcss-")) {
  process.exit(0);
}

if (!source.includes(original)) {
  throw new Error("Unexpected lightningcss loader format");
}

writeFileSync(target, source.replace(original, patched));
