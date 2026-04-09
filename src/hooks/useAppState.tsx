import React, { createContext, useContext, useMemo, useState } from "react";

import { cities } from "../data/cities";
import { equipmentCatalog } from "../data/equipment";
import { mockUsers } from "../data/mockUsers";
import { searchNearbyEquipment } from "../services/search";
import { City, SearchMode, SearchResult, TemporaryLocation, User } from "../types/models";

type AppStateContextValue = {
  currentUser: User;
  selectedCity: City;
  activeTemporaryCity?: City;
  myEquipmentIds: string[];
  searchResults: SearchResult[];
  lastSearchMode: SearchMode;
  updateProfile: (fullName: string, phoneNumber: string, cityId: string) => void;
  updateMyEquipment: (equipmentIds: string[]) => void;
  setTemporaryLocation: (cityId: string, durationHours: number) => void;
  clearTemporaryLocation: () => void;
  runSearch: (params: {
    equipmentId: string;
    searchMode: SearchMode;
    cityId?: string;
    lat?: number;
    lng?: number;
  }) => void;
};

const defaultUser = mockUsers[0];

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [myEquipmentIds, setMyEquipmentIds] = useState<string[]>(defaultUser.equipmentIds);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lastSearchMode, setLastSearchMode] = useState<SearchMode>("city");

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === currentUser.cityId) ?? cities[0],
    [currentUser.cityId]
  );

  const activeTemporaryLocation = useMemo<TemporaryLocation | undefined>(() => {
    const temporaryLocation = currentUser.temporaryLocation;

    if (!temporaryLocation) {
      return undefined;
    }

    if (new Date(temporaryLocation.expiresAt).getTime() <= Date.now()) {
      return undefined;
    }

    return temporaryLocation;
  }, [currentUser.temporaryLocation]);

  const activeTemporaryCity = useMemo(
    () => cities.find((city) => city.id === activeTemporaryLocation?.cityId),
    [activeTemporaryLocation?.cityId]
  );

  function updateProfile(fullName: string, phoneNumber: string, cityId: string) {
    setCurrentUser((previous) => ({
      ...previous,
      fullName,
      phoneNumber,
      cityId
    }));
  }

  function updateMyEquipment(equipmentIds: string[]) {
    setMyEquipmentIds(equipmentIds);
    setCurrentUser((previous) => ({
      ...previous,
      equipmentIds
    }));
  }

  function setTemporaryLocation(cityId: string, durationHours: number) {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    setCurrentUser((previous) => ({
      ...previous,
      temporaryLocation: {
        cityId,
        durationHours,
        expiresAt
      }
    }));
  }

  function clearTemporaryLocation() {
    setCurrentUser((previous) => ({
      ...previous,
      temporaryLocation: undefined
    }));
  }

  function runSearch(params: {
    equipmentId: string;
    searchMode: SearchMode;
    cityId?: string;
    lat?: number;
    lng?: number;
  }) {
    let baseLat = params.lat;
    let baseLng = params.lng;

    if (params.searchMode === "city") {
      const city = cities.find((item) => item.id === params.cityId);
      baseLat = city?.lat;
      baseLng = city?.lng;
    }

    if (typeof baseLat !== "number" || typeof baseLng !== "number") {
      setSearchResults([]);
      setLastSearchMode(params.searchMode);
      return;
    }

    const results = searchNearbyEquipment({
      equipmentId: params.equipmentId,
      baseLat,
      baseLng
    }).filter((result) => result.user.id !== currentUser.id);

    setSearchResults(results);
    setLastSearchMode(params.searchMode);
  }

  return (
    <AppStateContext.Provider
      value={{
        currentUser,
        selectedCity,
        activeTemporaryCity,
        myEquipmentIds,
        searchResults,
        lastSearchMode,
        updateProfile,
        updateMyEquipment,
        setTemporaryLocation,
        clearTemporaryLocation,
        runSearch
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}

export { equipmentCatalog, cities };
