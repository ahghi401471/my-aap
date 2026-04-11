import { cities } from "../src/data/cities";
import { streetsByCity } from "../src/data/streets";
import { equipmentCatalog } from "../src/data/equipment";
import { mockUsers } from "../src/data/mockUsers";
import { hashPassword } from "./auth";
import { getDb, persistDb } from "./db";
import { migrationSql, schemaSql } from "./schema";

export async function seedDatabase() {
  const db = await getDb();
  await db.execScript(schemaSql);
  await db.execScript(migrationSql);

  const existingCount = Number((await db.scalar("SELECT COUNT(*) FROM users")) ?? 0);

  if (existingCount > 0) {
    return;
  }

  for (const city of cities) {
    await db.execute("INSERT INTO cities (id, name, lat, lng) VALUES (?, ?, ?, ?)", [city.id, city.name, city.lat, city.lng]);
  }

  for (const [cityName, streets] of Object.entries(streetsByCity)) {
    for (const street of streets) {
      await db.execute("INSERT INTO streets (id, city_name, street_name) VALUES (?, ?, ?)", [street.id, cityName, street.name]);
    }
  }

  for (const equipment of equipmentCatalog) {
    await db.execute("INSERT INTO equipment (id, name, category) VALUES (?, ?, ?)", [equipment.id, equipment.name, equipment.category]);
  }

  for (const user of mockUsers) {
    await db.execute(
      `INSERT INTO users (
        id, full_name, username, password_hash, phone_number, city_id, street_name, house_number, lat, lng,
        temporary_city_id, temporary_duration_hours, temporary_expires_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.fullName,
        `demo_${user.id.slice(0, 8)}`,
        hashPassword("Demo1234!"),
        user.phoneNumber,
        user.cityId,
        user.address?.streetName ?? null,
        user.address?.houseNumber ?? null,
        user.address?.lat ?? null,
        user.address?.lng ?? null,
        user.temporaryLocation?.cityId ?? null,
        user.temporaryLocation?.durationHours ?? null,
        user.temporaryLocation?.expiresAt ?? null
      ]
    );

    for (const equipmentId of user.equipmentIds) {
      await db.execute("INSERT INTO user_equipment (user_id, equipment_id) VALUES (?, ?)", [user.id, equipmentId]);
    }
  }

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
