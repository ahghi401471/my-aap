export type SearchMode = "gps" | "city";

export type City = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type EquipmentItem = {
  id: string;
  name: string;
  category: string;
};

export type User = {
  id: string;
  fullName: string;
  cityId: string;
  equipmentIds: string[];
};

export type RequestRecord = {
  id: string;
  equipmentId: string;
  searchMode: SearchMode;
  requesterUserId: string;
  cityId?: string;
  lat?: number;
  lng?: number;
};

export type SearchResult = {
  user: User;
  city: City;
  equipment: EquipmentItem;
  distanceKm: number;
};
