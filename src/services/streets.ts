import { StreetSuggestion } from "../types/models";

type GoogleAutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type GoogleAutocompleteResponse = {
  predictions?: GoogleAutocompletePrediction[];
  status: string;
};

type GoogleGeocodeResult = {
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
};

type GoogleGeocodeResponse = {
  results?: GoogleGeocodeResult[];
  status: string;
};

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
const GOOGLE_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

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

async function fetchGoogleAutocomplete(cityName: string, query: string): Promise<StreetSuggestion[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    return [];
  }

  const url =
    `${GOOGLE_AUTOCOMPLETE_URL}?input=${encodeURIComponent(`${query}, ${cityName}`)}` +
    `&components=country:il&types=route&language=he&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google autocomplete failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GoogleAutocompleteResponse;
  const seen = new Set<string>();

  return (payload.predictions ?? [])
    .map((prediction) => {
      const name = prediction.structured_formatting?.main_text ?? "";
      const resultCityName = prediction.structured_formatting?.secondary_text ?? cityName;
      const uniqueKey = `${resultCityName}-${name}`.toLowerCase();

      if (!name || seen.has(uniqueKey)) {
        return null;
      }

      seen.add(uniqueKey);

      return {
        id: prediction.place_id,
        name,
        cityName: resultCityName,
        displayName: prediction.description
      } satisfies StreetSuggestion;
    })
    .filter((result): result is StreetSuggestion => result !== null)
    .slice(0, 8);
}

async function fetchGoogleGeocode(params: {
  cityName: string;
  streetName: string;
  houseNumber?: string;
}): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }

  const housePrefix = params.houseNumber?.trim() ? `${params.houseNumber.trim()} ` : "";
  const address = `${housePrefix}${params.streetName}, ${params.cityName}, ישראל`;
  const url =
    `${GOOGLE_GEOCODE_URL}?address=${encodeURIComponent(address)}` +
    `&components=country:IL&language=he&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google geocode failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;
  const location = payload.results?.[0]?.geometry?.location;

  if (!location) {
    return null;
  }

  return {
    lat: location.lat,
    lng: location.lng
  };
}

export async function searchStreets(cityName: string, query: string): Promise<StreetSuggestion[]> {
  const normalizedQuery = query.trim();

  if (!cityName.trim() || normalizedQuery.length < 2) {
    return [];
  }

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const googleResults = await fetchGoogleAutocomplete(cityName, normalizedQuery);

      if (googleResults.length > 0) {
        return googleResults;
      }
    } catch (error) {
      // Fall back to OSM lookup when Google Maps is unavailable.
    }
  }

  const url =
    `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&countrycodes=il&limit=12` +
    `&q=${encodeURIComponent(`${normalizedQuery}, ${cityName}, ישראל`)}`;

  const results = await fetchNominatim(url);
  const seen = new Set<string>();

  return results
    .map<StreetSuggestion | null>((result) => {
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
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const googleLocation = await fetchGoogleGeocode(params);

      if (googleLocation) {
        return googleLocation;
      }
    } catch (error) {
      // Fall back to OSM lookup when Google Maps is unavailable.
    }
  }

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
