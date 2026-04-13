import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";

import { cities } from "../src/data/cities";
import { calculateDistanceKm } from "../src/services/distance";
import { hashPassword, verifyPassword } from "./auth";
import { getDb, persistDb } from "./db";
import { seedDatabase } from "./seed";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME ?? "hagai").trim().toLowerCase();

async function hasAdminAccess(request: express.Request) {
  const requesterUserId = String(request.header("x-user-id") ?? "").trim();

  if (!requesterUserId) {
    return false;
  }

  const users = await rowsFromQuery<{ id: string; username: string | null; is_admin: number }>(
    "SELECT id, username, is_admin FROM users WHERE id = ?",
    [requesterUserId]
  )();

  const requester = users[0];

  if (!requester) {
    return false;
  }

  const isConfiguredAdmin = (requester.username ?? "").trim().toLowerCase() === ADMIN_USERNAME;

  if (isConfiguredAdmin && !requester.is_admin) {
    const db = await getDb();
    await db.execute("UPDATE users SET is_admin = 1 WHERE id = ?", [requester.id]);
    await persistDb();
    return true;
  }

  return Boolean(requester.is_admin) || isConfiguredAdmin;
}

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
    username: string | null;
    phone_number: string;
    share_phone_number: number;
    receive_broadcasts: number;
    is_admin: number;
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
    username: user.username ?? undefined,
    phoneNumber: user.phone_number,
    sharePhoneNumber: Boolean(user.share_phone_number),
    receiveBroadcasts: Boolean(user.receive_broadcasts),
    isAdmin: Boolean(user.is_admin),
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
    username,
    password,
    phoneNumber,
    sharePhoneNumber,
    receiveBroadcasts,
    cityId,
    streetName,
    houseNumber,
    lat,
    lng,
    equipmentIds,
    temporaryLocation
  } = request.body as {
    fullName: string;
    username: string;
    password: string;
    phoneNumber: string;
    sharePhoneNumber: boolean;
    receiveBroadcasts?: boolean;
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

  if (
    !fullName?.trim() ||
    !username?.trim() ||
    !password?.trim() ||
    password.trim().length < 6 ||
    !phoneNumber?.trim() ||
    typeof sharePhoneNumber !== "boolean" ||
    !sharePhoneNumber ||
    !cityId ||
    !Array.isArray(equipmentIds) ||
    equipmentIds.length === 0
  ) {
    response.status(400).json({ message: "Missing required fields" });
    return;
  }

  const nextReceiveBroadcasts = typeof receiveBroadcasts === "boolean" ? receiveBroadcasts : true;

  const userId = randomUUID();
  const db = await getDb();
  const existingUsername = await rowsFromQuery<{ id: string }>(
    "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
    [username.trim()]
  )();

  if (existingUsername.length > 0) {
    response.status(409).json({ message: "Username already exists" });
    return;
  }

  await db.execute(
    `INSERT INTO users (
      id, full_name, username, password_hash, phone_number, share_phone_number, receive_broadcasts, is_admin, city_id, street_name, house_number, lat, lng,
      temporary_city_id, temporary_duration_hours, temporary_expires_at
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fullName.trim(),
      username.trim(),
      hashPassword(password.trim()),
      phoneNumber.trim(),
      sharePhoneNumber ? 1 : 0,
      nextReceiveBroadcasts ? 1 : 0,
      username.trim().toLowerCase() === ADMIN_USERNAME ? 1 : 0,
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
    username,
    password,
    phoneNumber,
    sharePhoneNumber,
    receiveBroadcasts,
    cityId,
    streetName,
    houseNumber,
    lat,
    lng,
    equipmentIds,
    temporaryLocation
  } = request.body as {
    fullName: string;
    username: string;
    password?: string;
    phoneNumber: string;
    sharePhoneNumber: boolean;
    receiveBroadcasts?: boolean;
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

  if (
    !fullName?.trim() ||
    !username?.trim() ||
    !phoneNumber?.trim() ||
    typeof sharePhoneNumber !== "boolean" ||
    !cityId ||
    !Array.isArray(equipmentIds) ||
    equipmentIds.length === 0
  ) {
    response.status(400).json({ message: "Missing required fields" });
    return;
  }

  const nextReceiveBroadcasts = typeof receiveBroadcasts === "boolean" ? receiveBroadcasts : true;

  const db = await getDb();
  const existingUser = await rowsFromQuery<{ id: string; password_hash: string | null }>(
    "SELECT id, password_hash FROM users WHERE id = ?",
    [userId]
  )();

  if (existingUser.length === 0) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  const existingUsername = await rowsFromQuery<{ id: string }>(
    "SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id <> ?",
    [username.trim(), userId]
  )();

  if (existingUsername.length > 0) {
    response.status(409).json({ message: "Username already exists" });
    return;
  }

  const nextPasswordHash = password?.trim()
    ? hashPassword(password.trim())
    : existingUser[0].password_hash;

  await db.execute(
    `UPDATE users
     SET full_name = ?, username = ?, password_hash = ?, phone_number = ?, share_phone_number = ?, receive_broadcasts = ?, is_admin = ?, city_id = ?, street_name = ?, house_number = ?, lat = ?, lng = ?,
         temporary_city_id = ?, temporary_duration_hours = ?, temporary_expires_at = ?
     WHERE id = ?`,
    [
      fullName.trim(),
      username.trim(),
      nextPasswordHash ?? null,
      phoneNumber.trim(),
      sharePhoneNumber ? 1 : 0,
      nextReceiveBroadcasts ? 1 : 0,
      username.trim().toLowerCase() === ADMIN_USERNAME ? 1 : 0,
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

app.post("/api/auth/login", async (request, response) => {
  const { username, password } = request.body as {
    username: string;
    password: string;
  };

  if (!username?.trim() || !password?.trim()) {
    response.status(400).json({ message: "Missing credentials" });
    return;
  }

  const users = await rowsFromQuery<{
    id: string;
    full_name: string;
    username: string | null;
    password_hash: string | null;
    phone_number: string;
    share_phone_number: number;
    receive_broadcasts: number;
    is_admin: number;
    city_id: string;
    street_name: string | null;
    house_number: string | null;
    lat: number | null;
    lng: number | null;
    temporary_city_id: string | null;
    temporary_duration_hours: number | null;
    temporary_expires_at: string | null;
  }>("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", [username.trim()])();

  const user = users[0];

  if (!user?.password_hash || !verifyPassword(password.trim(), user.password_hash)) {
    response.status(401).json({ message: "Invalid username or password" });
    return;
  }

  const equipment = await rowsFromQuery<{ equipment_id: string }>(
    "SELECT equipment_id FROM user_equipment WHERE user_id = ?",
    [user.id]
  )();

  response.json({
    id: user.id,
    fullName: user.full_name,
    username: user.username ?? undefined,
    phoneNumber: user.phone_number,
    sharePhoneNumber: Boolean(user.share_phone_number),
    receiveBroadcasts: Boolean(user.receive_broadcasts),
    isAdmin: Boolean(user.is_admin),
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

app.delete("/api/users/:id", async (request, response) => {
  const userId = request.params.id;
  const db = await getDb();
  const existingUser = await rowsFromQuery<{ id: string }>("SELECT id FROM users WHERE id = ?", [userId])();

  if (existingUser.length === 0) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  response.json({ ok: true });
});

app.get("/api/admin/users", async (request, response) => {
  if (!(await hasAdminAccess(request))) {
    response.status(403).json({ message: "Admin access required" });
    return;
  }
  const users = await rowsFromQuery<{
    id: string;
    full_name: string;
    username: string | null;
    phone_number: string;
    city_id: string;
    share_phone_number: number;
    receive_broadcasts: number;
  }>(
    "SELECT id, full_name, username, phone_number, city_id, share_phone_number, receive_broadcasts FROM users ORDER BY full_name"
  )();

  response.json(
    users.map((user) => ({
      id: user.id,
      fullName: user.full_name,
      username: user.username ?? "",
      phoneNumber: user.phone_number,
      cityId: user.city_id,
      sharePhoneNumber: Boolean(user.share_phone_number),
      receiveBroadcasts: Boolean(user.receive_broadcasts)
    }))
  );
});

app.post("/api/admin/users", async (request, response) => {
  if (!(await hasAdminAccess(request))) {
    response.status(403).json({ message: "Admin access required" });
    return;
  }
  const {
    fullName,
    username,
    password,
    phoneNumber,
    cityId,
    equipmentIds,
    sharePhoneNumber,
    receiveBroadcasts
  } = request.body as {
    fullName: string;
    username: string;
    password: string;
    phoneNumber: string;
    cityId: string;
    equipmentIds: string[];
    sharePhoneNumber?: boolean;
    receiveBroadcasts?: boolean;
  };

  if (
    !fullName?.trim() ||
    !username?.trim() ||
    !password?.trim() ||
    password.trim().length < 6 ||
    !phoneNumber?.trim() ||
    !cityId ||
    !Array.isArray(equipmentIds) ||
    equipmentIds.length === 0
  ) {
    response.status(400).json({ message: "Missing required fields" });
    return;
  }

  const db = await getDb();
  const existingUsername = await rowsFromQuery<{ id: string }>(
    "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
    [username.trim()]
  )();

  if (existingUsername.length > 0) {
    response.status(409).json({ message: "Username already exists" });
    return;
  }

  const userId = randomUUID();
  await db.execute(
    `INSERT INTO users (
      id, full_name, username, password_hash, phone_number, share_phone_number, receive_broadcasts, is_admin, city_id
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fullName.trim(),
      username.trim(),
      hashPassword(password.trim()),
      phoneNumber.trim(),
      sharePhoneNumber === false ? 0 : 1,
      receiveBroadcasts === false ? 0 : 1,
      username.trim().toLowerCase() === ADMIN_USERNAME ? 1 : 0,
      cityId
    ]
  );

  for (const equipmentId of equipmentIds) {
    await db.execute("INSERT INTO user_equipment (user_id, equipment_id) VALUES (?, ?)", [userId, equipmentId]);
  }

  await persistDb();
  response.status(201).json({ id: userId });
});

app.delete("/api/admin/users/:id", async (request, response) => {
  if (!(await hasAdminAccess(request))) {
    response.status(403).json({ message: "Admin access required" });
    return;
  }
  const userId = request.params.id;
  const db = await getDb();
  const existingUser = await rowsFromQuery<{ id: string }>("SELECT id FROM users WHERE id = ?", [userId])();

  if (existingUser.length === 0) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  await db.execute("DELETE FROM user_equipment WHERE user_id = ?", [userId]);
  await db.execute("DELETE FROM broadcast_requests WHERE requester_user_id = ?", [userId]);
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
    username: string | null;
    phone_number: string;
    share_phone_number: number;
    receive_broadcasts: number;
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
  const requester = requesterUserId
    ? (
        await rowsFromQuery<{ id: string; username: string | null; phone_number: string | null }>(
          "SELECT id, username, phone_number FROM users WHERE id = ?",
          [requesterUserId]
        )()
      )[0]
    : undefined;

  for (const item of userEquipment) {
    if (!userEquipmentMap.has(item.user_id)) {
      userEquipmentMap.set(item.user_id, []);
    }

    userEquipmentMap.get(item.user_id)!.push(item.equipment_id);
  }

  const results = users
    .flatMap((user) => {
      if (
        (requesterUserId && user.id === requesterUserId) ||
        (requester?.username && user.username && requester.username.toLowerCase() === user.username.toLowerCase()) ||
        (requester?.phone_number && user.phone_number && requester.phone_number === user.phone_number)
      ) {
        return [];
      }

      const matchedEquipmentIds = (userEquipmentMap.get(user.id) ?? []).filter((equipmentId) => equipmentIds.includes(equipmentId));

      if (matchedEquipmentIds.length === 0) {
        return [];
      }

      if (!user.receive_broadcasts) {
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
        phoneNumber: user.share_phone_number ? user.phone_number : null,
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

  response.json(results);
});

app.post("/api/requests/broadcast", async (request, response) => {
  const { requesterUserId, equipmentIds, searchMode, cityId, streetName, houseNumber, lat, lng, returnPolicy } = request.body as {
    requesterUserId?: string;
    equipmentIds: string[];
    searchMode: "gps" | "city";
    cityId?: string;
    streetName?: string;
    houseNumber?: string;
    lat?: number;
    lng?: number;
    returnPolicy?: "within_week" | "within_two_weeks" | "no_return" | "prefer_no_return";
  };

  if (!requesterUserId || !Array.isArray(equipmentIds) || equipmentIds.length === 0 || !returnPolicy) {
    response.status(400).json({ message: "requesterUserId, equipmentIds and returnPolicy are required" });
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
    response.status(400).json({ message: "location is required" });
    return;
  }

  const db = await getDb();
  const recentBroadcast = (
    await rowsFromQuery<{ created_at: string }>(
      "SELECT created_at FROM broadcast_requests WHERE requester_user_id = ? ORDER BY created_at DESC LIMIT 1",
      [requesterUserId]
    )()
  )[0];

  if (recentBroadcast) {
    const elapsedMs = Date.now() - new Date(recentBroadcast.created_at).getTime();
    const cooldownMs = 3 * 60 * 60 * 1000;

    if (elapsedMs < cooldownMs) {
      const minutesLeft = Math.ceil((cooldownMs - elapsedMs) / (60 * 1000));
      response.status(429).json({
        message: `ניתן לשלוח הודעת בקשה אחת כל 3 שעות. נסה שוב בעוד ${minutesLeft} דקות.`
      });
      return;
    }
  }

  const equipmentRows = await rowsFromQuery<{ id: string; name: string }>(
    `SELECT DISTINCT e.id, e.name
     FROM equipment e
     WHERE e.id IN (${equipmentIds.map(() => "?").join(",")})`,
    equipmentIds
  )();
  const equipmentMap = new Map(equipmentRows.map((item) => [item.id, item]));

  const users = await rowsFromQuery<{
    id: string;
    full_name: string;
    username: string | null;
    phone_number: string;
    share_phone_number: number;
    receive_broadcasts: number;
    city_id: string;
    street_name: string | null;
    house_number: string | null;
    lat: number | null;
    lng: number | null;
    temporary_city_id: string | null;
    temporary_expires_at: string | null;
  }>("SELECT * FROM users")();
  const userEquipment = await rowsFromQuery<{ user_id: string; equipment_id: string }>("SELECT * FROM user_equipment")();
  const requester = (
    await rowsFromQuery<{ id: string; username: string | null; phone_number: string | null }>(
      "SELECT id, username, phone_number FROM users WHERE id = ?",
      [requesterUserId]
    )()
  )[0];

  if (!requester) {
    response.status(404).json({ message: "Requester user not found" });
    return;
  }

  const userEquipmentMap = new Map<string, string[]>();
  for (const item of userEquipment) {
    if (!userEquipmentMap.has(item.user_id)) {
      userEquipmentMap.set(item.user_id, []);
    }

    userEquipmentMap.get(item.user_id)!.push(item.equipment_id);
  }

  const maxDistanceKm = 10;
  const recipients = users
    .filter((user) => {
      if (user.id === requesterUserId) {
        return false;
      }

      if (requester.username && user.username && requester.username.toLowerCase() === user.username.toLowerCase()) {
        return false;
      }

      if (requester.phone_number && user.phone_number && requester.phone_number === user.phone_number) {
        return false;
      }

      if (!user.share_phone_number) {
        return false;
      }

      if (!user.receive_broadcasts) {
        return false;
      }

      const matchedEquipmentIds = (userEquipmentMap.get(user.id) ?? []).filter((equipmentId) => equipmentIds.includes(equipmentId));
      if (matchedEquipmentIds.length === 0) {
        return false;
      }

      const hasActiveTemporaryLocation =
        !!user.temporary_city_id &&
        !!user.temporary_expires_at &&
        new Date(user.temporary_expires_at).getTime() > Date.now();

      const resultCityId = hasActiveTemporaryLocation ? user.temporary_city_id : user.city_id;
      const city = cities.find((item) => item.id === resultCityId);
      if (!city) {
        return false;
      }

      const canUseStreetAddress = !hasActiveTemporaryLocation && typeof user.lat === "number" && typeof user.lng === "number";
      const targetLat = canUseStreetAddress ? user.lat! : city.lat;
      const targetLng = canUseStreetAddress ? user.lng! : city.lng;
      const distanceKm = calculateDistanceKm(baseLat!, baseLng!, targetLat, targetLng);

      return distanceKm <= maxDistanceKm;
    })
    .map((user) => ({
      id: user.id,
      fullName: user.full_name,
      phoneNumber: user.phone_number
    }));

  const returnPolicyLabelMap = {
    within_week: "החזרה בתוך שבוע",
    within_two_weeks: "החזרה בתוך שבועיים",
    no_return: "ללא החזרה",
    prefer_no_return: "עדיפות ללא החזרה"
  };

  const equipmentNames = equipmentIds.map((id) => equipmentMap.get(id)?.name ?? id).join(", ");
  const message = `דרוש ציוד סכרת באזורך | ציוד: ${equipmentNames} | ${returnPolicyLabelMap[returnPolicy]}`;

  await db.execute(
    `INSERT INTO broadcast_requests (
      id, requester_user_id, message_template, selected_equipment, return_policy, recipients_count, recipient_phone_numbers, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      requesterUserId,
      message,
      equipmentNames,
      returnPolicy,
      recipients.length,
      recipients.map((item) => item.phoneNumber).join(","),
      new Date().toISOString()
    ]
  );

  await persistDb();

  response.json({
    recipientsCount: recipients.length,
    message,
    recipients
  });
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
