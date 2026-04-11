import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";

import { cities } from "../src/data/cities";
import { calculateDistanceKm } from "../src/services/distance";
import { getDb, persistDb } from "./db";
import { seedDatabase } from "./seed";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

function rowsFromQuery<T>(sql: string, params: Array<string | number | null> = []) {
  return async () => {
    const db = await getDb();
    return db.query<T>(sql, params);
  };
}

app.get("/health", async (_request, response) => {
  const db = await getDb();
  response.json({ ok: true, database: db.provider });
});

app.get("/api/cities", async (request, response) => {
  const query = String(request.query.q ?? "").trim();
  const filtered = query ? cities.filter((city) => city.name.includes(query)).slice(0, 20) : cities.slice(0, 20);
  response.json(filtered);
});

app.get("/api/streets", async (request, response) => {
  const cityName = String(request.query.city ?? "").trim();
  const query = String(request.query.q ?? "").trim();

  if (!cityName || !query) {
    response.json([]);
    return;
  }

  const streets = await rowsFromQuery<{ id: string; street_name: string }>(
    "SELECT id, street_name FROM streets WHERE city_name = ? AND street_name LIKE ? ORDER BY street_name LIMIT 20",
    [cityName, `%${query}%`]
  )();

  response.json(
    streets.map((street) => ({
      id: street.id,
      name: street.street_name,
      cityName,
      displayName: `${street.street_name}, ${cityName}`
    }))
  );
});

app.get("/api/equipment", async (_request, response) => {
  const equipment = await rowsFromQuery<{ id: string; name: string; category: string }>(
    "SELECT id, name, category FROM equipment ORDER BY category, name"
  )();
  response.json(equipment);
});

app.get("/api/users/:id", async (request, response) => {
  const userId = request.params.id;
  const users = await rowsFromQuery<{
    id: string;
    full_name: string;
    phone_number: string;
    city_id: string;
    street_name: string | null;
    house_number: string | null;
    lat: number | null;
    lng: number | null;
    temporary_city_id: string | null;
    temporary_duration_hours: number | null;
    temporary_expires_at: string | null;
  }>("SELECT * FROM users WHERE id = ?", [userId])();

  const user = users[0];

  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  const equipment = await rowsFromQuery<{ equipment_id: string }>(
    "SELECT equipment_id FROM user_equipment WHERE user_id = ?",
    [userId]
  )();

  response.json({
    id: user.id,
    fullName: user.full_name,
    phoneNumber: user.phone_number,
    cityId: user.city_id,
    equipmentIds: equipment.map((item) => item.equipment_id),
    address: user.street_name
      ? {
          cityId: user.city_id,
          streetName: user.street_name,
          houseNumber: user.house_number ?? "",
          lat: user.lat,
          lng: user.lng
        }
      : undefined,
    temporaryLocation:
      user.temporary_city_id && user.temporary_expires_at
        ? {
            cityId: user.temporary_city_id,
            durationHours: user.temporary_duration_hours ?? 0,
            expiresAt: user.temporary_expires_at
          }
        : undefined
  });
});

app.post("/api/users/register", async (request, response) => {
  const {
    fullName,
    phoneNumber,
    cityId,
    streetName,
    houseNumber,
    lat,
    lng,
    equipmentIds,
    temporaryLocation
  } = request.body as {
    fullName: string;
    phoneNumber: string;
    cityId: string;
    streetName?: string;
    houseNumber?: string;
    lat?: number;
    lng?: number;
    equipmentIds: string[];
    temporaryLocation?: {
      cityId: string;
      durationHours: number;
      expiresAt: string;
    };
  };

  if (!fullName?.trim() || !phoneNumber?.trim() || !cityId || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
    response.status(400).json({ message: "Missing required fields" });
    return;
  }

  const userId = randomUUID();
  const db = await getDb();

  await db.execute(
    `INSERT INTO users (
      id, full_name, phone_number, city_id, street_name, house_number, lat, lng,
      temporary_city_id, temporary_duration_hours, temporary_expires_at
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fullName.trim(),
      phoneNumber.trim(),
      cityId,
      streetName ?? null,
      houseNumber ?? null,
      lat ?? null,
      lng ?? null,
      temporaryLocation?.cityId ?? null,
      temporaryLocation?.durationHours ?? null,
      temporaryLocation?.expiresAt ?? null
    ]
  );

  for (const equipmentId of equipmentIds) {
    await db.execute("INSERT INTO user_equipment (user_id, equipment_id) VALUES (?, ?)", [userId, equipmentId]);
  }

  await persistDb();
  response.status(201).json({ id: userId });
});

app.put("/api/users/:id", async (request, response) => {
  const userId = request.params.id;
  const {
    fullName,
    phoneNumber,
    cityId,
    streetName,
    houseNumber,
    lat,
    lng,
    equipmentIds,
    temporaryLocation
  } = request.body as {
    fullName: string;
    phoneNumber: string;
    cityId: string;
    streetName?: string;
    houseNumber?: string;
    lat?: number;
    lng?: number;
    equipmentIds: string[];
    temporaryLocation?: {
      cityId: string;
      durationHours: number;
      expiresAt: string;
    };
  };

  if (!fullName?.trim() || !phoneNumber?.trim() || !cityId || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
    response.status(400).json({ message: "Missing required fields" });
    return;
  }

  const db = await getDb();
  const existingUser = await rowsFromQuery<{ id: string }>("SELECT id FROM users WHERE id = ?", [userId])();

  if (existingUser.length === 0) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  await db.execute(
    `UPDATE users
     SET full_name = ?, phone_number = ?, city_id = ?, street_name = ?, house_number = ?, lat = ?, lng = ?,
         temporary_city_id = ?, temporary_duration_hours = ?, temporary_expires_at = ?
     WHERE id = ?`,
    [
      fullName.trim(),
      phoneNumber.trim(),
      cityId,
      streetName ?? null,
      houseNumber ?? null,
      lat ?? null,
      lng ?? null,
      temporaryLocation?.cityId ?? null,
      temporaryLocation?.durationHours ?? null,
      temporaryLocation?.expiresAt ?? null,
      userId
    ]
  );

  await db.execute("DELETE FROM user_equipment WHERE user_id = ?", [userId]);

  for (const equipmentId of equipmentIds) {
    await db.execute("INSERT INTO user_equipment (user_id, equipment_id) VALUES (?, ?)", [userId, equipmentId]);
  }

  await persistDb();
  response.json({ ok: true });
});

app.delete("/api/users/:id", async (request, response) => {
  const userId = request.params.id;
  const db = await getDb();
  const existingUser = await rowsFromQuery<{ id: string }>("SELECT id FROM users WHERE id = ?", [userId])();

  if (existingUser.length === 0) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  await db.execute("DELETE FROM user_equipment WHERE user_id = ?", [userId]);
  await db.execute("DELETE FROM requests WHERE requester_user_id = ?", [userId]);
  await db.execute("DELETE FROM users WHERE id = ?", [userId]);

  await persistDb();
  response.json({ ok: true });
});

app.post("/api/requests/search", async (request, response) => {
  const { requesterUserId, equipmentIds, searchMode, cityId, streetName, houseNumber, lat, lng } = request.body as {
    requesterUserId?: string;
    equipmentIds: string[];
    searchMode: "gps" | "city";
    cityId?: string;
    streetName?: string;
    houseNumber?: string;
    lat?: number;
    lng?: number;
  };

  if (!Array.isArray(equipmentIds) || equipmentIds.length === 0) {
    response.status(400).json({ message: "equipmentIds is required" });
    return;
  }

  let baseLat = lat;
  let baseLng = lng;

  if ((typeof baseLat !== "number" || typeof baseLng !== "number") && cityId) {
    const city = cities.find((item) => item.id === cityId);
    baseLat = city?.lat;
    baseLng = city?.lng;
  }

  if (typeof baseLat !== "number" || typeof baseLng !== "number") {
    response.json([]);
    return;
  }

  const equipmentRows = await rowsFromQuery<{ id: string; name: string }>(
    `SELECT DISTINCT e.id, e.name
     FROM equipment e
     WHERE e.id IN (${equipmentIds.map(() => "?").join(",")})`,
    equipmentIds
  )();

  const users = await rowsFromQuery<{
    id: string;
    full_name: string;
    phone_number: string;
    city_id: string;
    street_name: string | null;
    house_number: string | null;
    lat: number | null;
    lng: number | null;
    temporary_city_id: string | null;
    temporary_duration_hours: number | null;
    temporary_expires_at: string | null;
  }>("SELECT * FROM users")();

  const userEquipment = await rowsFromQuery<{ user_id: string; equipment_id: string }>("SELECT * FROM user_equipment")();
  const equipmentMap = new Map(equipmentRows.map((item) => [item.id, item]));
  const userEquipmentMap = new Map<string, string[]>();

  for (const item of userEquipment) {
    if (!userEquipmentMap.has(item.user_id)) {
      userEquipmentMap.set(item.user_id, []);
    }

    userEquipmentMap.get(item.user_id)!.push(item.equipment_id);
  }

  const results = users
    .flatMap((user) => {
      if (requesterUserId && user.id === requesterUserId) {
        return [];
      }

      const matchedEquipmentIds = (userEquipmentMap.get(user.id) ?? []).filter((equipmentId) => equipmentIds.includes(equipmentId));

      if (matchedEquipmentIds.length === 0) {
        return [];
      }

      const hasActiveTemporaryLocation =
        !!user.temporary_city_id &&
        !!user.temporary_expires_at &&
        new Date(user.temporary_expires_at).getTime() > Date.now();

      const resultCityId = hasActiveTemporaryLocation ? user.temporary_city_id : user.city_id;
      const city = cities.find((item) => item.id === resultCityId);

      if (!city) {
        return [];
      }

      const canUseStreetAddress = !hasActiveTemporaryLocation && typeof user.lat === "number" && typeof user.lng === "number";
      const targetLat = canUseStreetAddress ? user.lat! : city.lat;
      const targetLng = canUseStreetAddress ? user.lng! : city.lng;
      const distanceKm = calculateDistanceKm(baseLat!, baseLng!, targetLat, targetLng);

      return matchedEquipmentIds.map((equipmentId) => ({
        userId: user.id,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        city: city.name,
        cityId: city.id,
        streetName: user.street_name,
        houseNumber: user.house_number,
        equipment: equipmentMap.get(equipmentId)?.name ?? equipmentId,
        distanceKm,
        lat: targetLat,
        lng: targetLng,
        locationSource: hasActiveTemporaryLocation ? "temporary" : "home",
        distanceBasis: canUseStreetAddress ? "street" : "city"
      }));
    })
    .sort((left, right) => left.distanceKm - right.distanceKm);

  const requestId = randomUUID();
  const db = await getDb();
  await db.execute(
    `INSERT INTO requests (id, requester_user_id, equipment_ids_json, search_mode, city_id, street_name, house_number, lat, lng, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requestId,
      requesterUserId ?? "anonymous",
      JSON.stringify(equipmentIds),
      searchMode,
      cityId ?? null,
      streetName ?? null,
      houseNumber ?? null,
      baseLat,
      baseLng,
      new Date().toISOString()
    ]
  );
  await persistDb();

  response.json(results);
});

async function start() {
  await seedDatabase();
  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
