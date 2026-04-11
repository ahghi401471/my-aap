export type SearchMode = "gps" | "city";

export type City = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type StreetSuggestion = {
  id: string;
  name: string;
  cityName: string;
  displayName: string;
  lat?: number;
  lng?: number;
};

export type AddressLocation = {
  cityId: string;
  streetName: string;
  houseNumber: string;
  lat: number;
  lng: number;
};

export type EquipmentItem = {
  id: string;
  name: string;
  category: string;
};

export type TemporaryLocation = {
  cityId: string;
  durationHours: number;
  expiresAt: string;
};

export type User = {
  id: string;
  fullName: string;
  username?: string;
  phoneNumber: string;
  cityId: string;
  address?: AddressLocation;
  equipmentIds: string[];
  temporaryLocation?: TemporaryLocation;
};

export type RequestRecord = {
  id: string;
  equipmentIds: string[];
  searchMode: SearchMode;
  requesterUserId: string;
  cityId?: string;
  lat?: number;
  lng?: number;
  address?: AddressLocation;
};

export type SearchResult = {
  user: User;
  city: City;
  equipment: EquipmentItem;
  distanceKm: number;
  locationSource: "home" | "temporary";
  distanceBasis: "city" | "street";
  addressLabel?: string;
};
