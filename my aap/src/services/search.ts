import { cities } from "../data/cities";
import { equipmentCatalog } from "../data/equipment";
import { mockUsers } from "../data/mockUsers";
import { SearchResult } from "../types/models";
import { calculateDistanceKm } from "./distance";

type SearchOptions = {
  equipmentId: string;
  baseLat: number;
  baseLng: number;
};

export function searchNearbyEquipment(options: SearchOptions): SearchResult[] {
  const equipment = equipmentCatalog.find((item) => item.id === options.equipmentId);

  if (!equipment) {
    return [];
  }

  return mockUsers
    .filter((user) => user.equipmentIds.includes(options.equipmentId))
    .map((user) => {
      const city = cities.find((item) => item.id === user.cityId);
      if (!city) {
        return null;
      }

      const distanceKm = calculateDistanceKm(options.baseLat, options.baseLng, city.lat, city.lng);

      return {
        user,
        city,
        equipment,
        distanceKm
      };
    })
    .filter((item): item is SearchResult => item !== null)
    .sort((left, right) => left.distanceKm - right.distanceKm);
}
