import { StreetSuggestion } from "../types/models";

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    pedestrian?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function normalizeStreetName(result: NominatimResult) {
  return result.address?.road ?? result.address?.pedestrian ?? "";
}

function normalizeCityName(result: NominatimResult) {
  return result.address?.city ?? result.address?.town ?? result.address?.village ?? result.address?.municipality ?? "";
}

async function fetchNominatim(url: string) {
  const response = await fetch(url, {
    headers: {
      "Accept-Language": "he"
    }
  });

  if (!response.ok) {
    throw new Error(`Street lookup failed with status ${response.status}`);
  }

  return (await response.json()) as NominatimResult[];
}

export async function searchStreets(cityName: string, query: string): Promise<StreetSuggestion[]> {
  const normalizedQuery = query.trim();

  if (!cityName.trim() || normalizedQuery.length < 2) {
    return [];
  }

  const url =
    `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&countrycodes=il&limit=12` +
    `&q=${encodeURIComponent(`${normalizedQuery}, ${cityName}, ישראל`)}`;

  const results = await fetchNominatim(url);
  const seen = new Set<string>();

  return results
    .map((result) => {
      const name = normalizeStreetName(result);
      const resultCityName = normalizeCityName(result) || cityName;

      if (!name) {
        return null;
      }

      const uniqueKey = `${resultCityName}-${name}`.toLowerCase();

      if (seen.has(uniqueKey)) {
        return null;
      }

      seen.add(uniqueKey);

      return {
        id: String(result.place_id),
        name,
        cityName: resultCityName,
        displayName: result.display_name,
        lat: Number(result.lat),
        lng: Number(result.lon)
      } satisfies StreetSuggestion;
    })
    .filter((result): result is StreetSuggestion => result !== null)
    .slice(0, 8);
}

export async function geocodeStreetAddress(params: {
  cityName: string;
  streetName: string;
  houseNumber?: string;
}): Promise<{ lat: number; lng: number } | null> {
  const housePrefix = params.houseNumber?.trim() ? `${params.houseNumber.trim()} ` : "";
  const query = `${housePrefix}${params.streetName}, ${params.cityName}, ישראל`;
  const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&countrycodes=il&limit=1&q=${encodeURIComponent(query)}`;
  const results = await fetchNominatim(url);
  const first = results[0];

  if (!first) {
    return null;
  }

  return {
    lat: Number(first.lat),
    lng: Number(first.lon)
  };
}
