import { cities } from "../data/cities";
import { equipmentCatalog } from "../data/equipment";
import { BroadcastRequestPayload, SearchResult, TemporaryLocation, User } from "../types/models";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://my-aap-ss8w.onrender.com";

type UserPayload = {
  fullName: string;
  username: string;
  password?: string;
  phoneNumber: string;
  sharePhoneNumber: boolean;
  receiveBroadcasts: boolean;
  cityId: string;
  address?: User["address"];
  equipmentIds: string[];
  temporaryLocation?: TemporaryLocation;
};

type SearchPayload = {
  requesterUserId?: string;
  equipmentIds: string[];
  searchMode: "gps" | "city";
  cityId?: string;
  streetName?: string;
  houseNumber?: string;
  lat?: number;
  lng?: number;
};

type SearchApiRow = {
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  sharePhoneNumber?: boolean;
  city: string;
  cityId: string;
  streetName?: string | null;
  houseNumber?: string | null;
  equipment: string;
  distanceKm: number;
  lat?: number;
  lng?: number;
  locationSource?: "home" | "temporary";
  distanceBasis?: "city" | "street";
};

export type AdminUserRow = {
  id: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  cityId: string;
  sharePhoneNumber: boolean;
  receiveBroadcasts: boolean;
};

async function apiFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function registerUser(payload: UserPayload) {
  return apiFetch<{ id: string }>("/api/users/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.fullName,
      username: payload.username,
      password: payload.password,
      phoneNumber: payload.phoneNumber,
      sharePhoneNumber: payload.sharePhoneNumber,
      receiveBroadcasts: payload.receiveBroadcasts,
      cityId: payload.cityId,
      streetName: payload.address?.streetName,
      houseNumber: payload.address?.houseNumber,
      lat: payload.address?.lat,
      lng: payload.address?.lng,
      equipmentIds: payload.equipmentIds,
      temporaryLocation: payload.temporaryLocation
    })
  });
}

export async function updateUser(userId: string, payload: UserPayload) {
  await apiFetch<{ ok: true }>(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({
      fullName: payload.fullName,
      username: payload.username,
      password: payload.password,
      phoneNumber: payload.phoneNumber,
      sharePhoneNumber: payload.sharePhoneNumber,
      receiveBroadcasts: payload.receiveBroadcasts,
      cityId: payload.cityId,
      streetName: payload.address?.streetName,
      houseNumber: payload.address?.houseNumber,
      lat: payload.address?.lat,
      lng: payload.address?.lng,
      equipmentIds: payload.equipmentIds,
      temporaryLocation: payload.temporaryLocation
    })
  });
}

export async function loginUser(username: string, password: string) {
  return apiFetch<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function deleteUser(userId: string) {
  await apiFetch<{ ok: true }>(`/api/users/${userId}`, {
    method: "DELETE"
  });
}

export async function searchEquipment(payload: SearchPayload) {
  const rows = await apiFetch<SearchApiRow[]>("/api/requests/search", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return rows
    .map<SearchResult | null>((row) => {
      const city = cities.find((item) => item.id === row.cityId || item.name === row.city);
      const equipment = equipmentCatalog.find((item) => item.name === row.equipment);

      if (!city || !equipment) {
        return null;
      }

      const user: User = {
        id: row.userId,
        fullName: row.fullName,
        phoneNumber: row.phoneNumber ?? "",
        sharePhoneNumber: Boolean(row.phoneNumber),
        cityId: city.id,
        equipmentIds: equipmentCatalog.filter((item) => item.name === row.equipment).map((item) => item.id),
        address:
          row.streetName && typeof row.lat === "number" && typeof row.lng === "number"
            ? {
                cityId: city.id,
                streetName: row.streetName,
                houseNumber: row.houseNumber ?? "",
                lat: row.lat,
                lng: row.lng
              }
            : undefined
      };

      return {
        user,
        city,
        equipment,
        distanceKm: row.distanceKm,
        locationSource: row.locationSource ?? "home",
        distanceBasis: row.distanceBasis ?? (row.streetName ? "street" : "city"),
        addressLabel: row.streetName ? `${row.streetName}${row.houseNumber ? ` ${row.houseNumber}` : ""}` : undefined
      };
    })
    .filter((item): item is SearchResult => item !== null)
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

export async function broadcastEquipmentRequest(payload: BroadcastRequestPayload) {
  return apiFetch<{ recipientsCount: number; message: string; recipients: Array<{ id: string; fullName: string; phoneNumber: string }> }>(
    "/api/requests/broadcast",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function listAdminUsers() {
  return apiFetch<AdminUserRow[]>("/api/admin/users");
}

export async function createAdminUser(payload: {
  fullName: string;
  username: string;
  password: string;
  phoneNumber: string;
  cityId: string;
  equipmentIds: string[];
}) {
  return apiFetch<{ id: string }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function deleteAdminUser(userId: string) {
  await apiFetch<{ ok: true }>(`/api/admin/users/${userId}`, {
    method: "DELETE"
  });
}

export { API_BASE_URL };
