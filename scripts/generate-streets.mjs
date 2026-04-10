import fs from "node:fs";
import path from "node:path";

const sourceArg = process.argv[2];

if (!sourceArg) {
  console.error("Usage: node scripts/generate-streets.mjs <csv-path>");
  process.exit(1);
}

const sourcePath = path.resolve(sourceArg);
const targetPath = path.join(process.cwd(), "src", "data", "streets.ts");

const csv = fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, "");
const lines = csv.split(/\r?\n/).filter(Boolean);
const rows = lines.slice(1);
const streetsByCity = new Map();

for (const row of rows) {
  const [cityCode, cityNameRaw, streetCodeRaw, streetNameRaw] = row.split(",").map((part) => part?.trim());
  const cityName = cityNameRaw?.trim();
  const streetCode = streetCodeRaw?.trim();
  const streetName = streetNameRaw?.trim();

  if (!cityName || !streetName || !streetCode) {
    continue;
  }

  if (!streetsByCity.has(cityName)) {
    streetsByCity.set(cityName, new Map());
  }

  const cityMap = streetsByCity.get(cityName);
  cityMap.set(streetCode, {
    id: `${cityCode}-${streetCode}`,
    name: streetName
  });
}

const outputObject = Object.fromEntries(
  [...streetsByCity.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], "he"))
    .map(([cityName, streets]) => [
      cityName,
      [...streets.values()].sort((left, right) => left.name.localeCompare(right.name, "he"))
    ])
);

const fileContents = `export const streetsByCity = ${JSON.stringify(outputObject, null, 2)} as const;\n`;

fs.writeFileSync(targetPath, fileContents, "utf8");

console.log(`Generated streets dataset with ${Object.keys(outputObject).length} cities into ${targetPath}`);
