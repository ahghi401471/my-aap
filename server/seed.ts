import { cities } from "../src/data/cities";
import { streetsByCity } from "../src/data/streets";
import { equipmentCatalog } from "../src/data/equipment";
import { mockUsers } from "../src/data/mockUsers";
import { getDb, persistDb } from "./db";
import { migrationSql, schemaSql } from "./schema";

async function cleanupDemoUsers() {
  const db = await getDb();

  for (const user of mockUsers) {
    await db.execute("DELETE FROM user_equipment WHERE user_id = ?", [user.id]);
    await db.execute("DELETE FROM users WHERE id = ?", [user.id]);
  }

  await db.execute("DELETE FROM users WHERE username LIKE ?", ["demo_%"]);
}

export async function seedDatabase() {
  const db = await getDb();
  await db.execScript(schemaSql);
  await db.execScript(migrationSql);

  const cityCount = Number((await db.scalar("SELECT COUNT(*) FROM cities")) ?? 0);
  if (cityCount === 0) {
    for (const city of cities) {
      await db.execute("INSERT INTO cities (id, name, lat, lng) VALUES (?, ?, ?, ?)", [city.id, city.name, city.lat, city.lng]);
    }
  }

  const streetCount = Number((await db.scalar("SELECT COUNT(*) FROM streets")) ?? 0);
  if (streetCount === 0) {
    for (const [cityName, streets] of Object.entries(streetsByCity)) {
      for (const street of streets) {
        await db.execute("INSERT INTO streets (id, city_name, street_name) VALUES (?, ?, ?)", [street.id, cityName, street.name]);
      }
    }
  }

  const equipmentCount = Number((await db.scalar("SELECT COUNT(*) FROM equipment")) ?? 0);
  if (equipmentCount === 0) {
    for (const equipment of equipmentCatalog) {
      await db.execute("INSERT INTO equipment (id, name, category) VALUES (?, ?, ?)", [equipment.id, equipment.name, equipment.category]);
    }
  }

  await cleanupDemoUsers();
  await persistDb();
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  seedDatabase()
    .then(() => {
      console.log("Database seeded");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
