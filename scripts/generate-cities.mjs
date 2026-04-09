import fs from "node:fs";
import path from "node:path";
import proj4 from "proj4";

const sourcePath = path.join(process.cwd(), "src", "data", "city_latitude.csv");
const targetPath = path.join(process.cwd(), "src", "data", "cities.ts");

proj4.defs(
  "EPSG:2039",
  "+proj=tmerc +lat_0=31.7343936111111 +lon_0=35.2045169444445 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=-24.0024,-17.1032,-17.8444,-0.33077,-1.85269,1.66969,5.4248 +units=m +no_defs"
);

const csv = fs.readFileSync(sourcePath, "utf8");
const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const rows = lines.slice(1);

const localitiesByName = new Map();

for (const row of rows) {
  const [name, pointX, pointY] = row.split(",");
  const cleanName = name?.trim();
  const x = Number(pointX);
  const y = Number(pointY);

  if (!cleanName || Number.isNaN(x) || Number.isNaN(y) || localitiesByName.has(cleanName)) {
    continue;
  }

  const [lng, lat] = proj4("EPSG:2039", "WGS84", [x, y]);
  localitiesByName.set(cleanName, {
    id: Buffer.from(cleanName).toString("hex"),
    name: cleanName,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6))
  });
}

const sortedLocalities = [...localitiesByName.values()].sort((left, right) =>
  left.name.localeCompare(right.name, "he")
);

const fileContents = `import { City } from "../types/models";

export const cities: City[] = ${JSON.stringify(sortedLocalities, null, 2)};
`;

fs.writeFileSync(targetPath, fileContents, "utf8");

console.log(`Generated ${sortedLocalities.length} localities into ${targetPath}`);
