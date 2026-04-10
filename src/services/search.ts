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

  const results = mockUsers
    .filter((user) => user.equipmentIds.includes(options.equipmentId))
    .map<SearchResult | null>((user) => {
      const hasActiveTemporaryLocation =
        user.temporaryLocation &&
        new Date(user.temporaryLocation.expiresAt).getTime() > Date.now();

      const targetCityId = hasActiveTemporaryLocation ? user.temporaryLocation?.cityId : user.cityId;
      const city = cities.find((item) => item.id === targetCityId);

      if (!city) {
        return null;
      }

      const canUseStreetAddress = !hasActiveTemporaryLocation && user.address && user.address.cityId === user.cityId;
      const targetLat = canUseStreetAddress ? user.address!.lat : city.lat;
      const targetLng = canUseStreetAddress ? user.address!.lng : city.lng;
      const distanceKm = calculateDistanceKm(options.baseLat, options.baseLng, targetLat, targetLng);

      const baseResult: SearchResult = {
        user,
        city,
        equipment,
        distanceKm,
        locationSource: hasActiveTemporaryLocation ? "temporary" : "home",
        distanceBasis: canUseStreetAddress ? "street" : "city"
      };

      if (canUseStreetAddress) {
        baseResult.addressLabel = `${user.address!.streetName}${user.address!.houseNumber ? ` ${user.address!.houseNumber}` : ""}`;
      }

      return baseResult;
    })
    .filter((item): item is SearchResult => item !== null)
    .sort((left, right) => left.distanceKm - right.distanceKm);

  return results;
}
