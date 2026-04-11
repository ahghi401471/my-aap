import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { cities } from "../data/cities";
import { equipmentCatalog } from "../data/equipment";
import { mockUsers } from "../data/mockUsers";
import { registerUser, searchEquipment, updateUser } from "../services/api";
import { searchNearbyEquipment } from "../services/search";
import { AddressLocation, City, SearchMode, SearchResult, TemporaryLocation, User } from "../types/models";

type AppStateContextValue = {
  isHydrated: boolean;
  hasCompletedRegistration: boolean;
  currentUser: User;
  selectedCity: City;
  activeTemporaryCity?: City;
  myEquipmentIds: string[];
  searchResults: SearchResult[];
  lastSearchMode: SearchMode;
  lastSearchSummary: string;
  updateProfile: (params: {
    fullName: string;
    phoneNumber: string;
    cityId: string;
    address?: AddressLocation;
  }) => Promise<void>;
  updateMyEquipment: (equipmentIds: string[]) => Promise<void>;
  registerCurrentUser: (params: {
    fullName: string;
    phoneNumber: string;
    cityId: string;
    address?: AddressLocation;
    equipmentIds: string[];
  }) => Promise<void>;
  setTemporaryLocation: (cityId: string, durationHours: number) => Promise<void>;
  clearTemporaryLocation: () => Promise<void>;
  runSearch: (params: {
    equipmentIds: string[];
    searchMode: SearchMode;
    cityId?: string;
    lat?: number;
    lng?: number;
    searchSummary?: string;
    streetName?: string;
    houseNumber?: string;
  }) => Promise<void>;
};

const defaultUser = mockUsers[0];
const STORAGE_KEY = "equipment-nearby-app-state";
const DEFAULT_SEARCH_SUMMARY = "לפי המיקום שבחרת";

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [myEquipmentIds, setMyEquipmentIds] = useState<string[]>(defaultUser.equipmentIds);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lastSearchMode, setLastSearchMode] = useState<SearchMode>("city");
  const [lastSearchSummary, setLastSearchSummary] = useState(DEFAULT_SEARCH_SUMMARY);
  const [hasCompletedRegistration, setHasCompletedRegistration] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

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

  useEffect(() => {
    async function hydrateState() {
      try {
        const rawState = await AsyncStorage.getItem(STORAGE_KEY);

        if (!rawState) {
          setIsHydrated(true);
          return;
        }

        const parsedState = JSON.parse(rawState) as {
          currentUser: User;
          myEquipmentIds: string[];
          hasCompletedRegistration: boolean;
        };

        setCurrentUser(parsedState.currentUser);
        setMyEquipmentIds(parsedState.myEquipmentIds);
        setHasCompletedRegistration(parsedState.hasCompletedRegistration);
      } catch (error) {
        // Ignore corrupted local state and continue with defaults.
      } finally {
        setIsHydrated(true);
      }
    }

    hydrateState();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentUser,
        myEquipmentIds,
        hasCompletedRegistration
      })
    ).catch(() => {
      // Ignore persistence failures in MVP mode.
    });
  }, [currentUser, hasCompletedRegistration, isHydrated, myEquipmentIds]);

  async function syncUser(nextUser: User, nextEquipmentIds: string[], nextHasCompletedRegistration = hasCompletedRegistration) {
    setCurrentUser(nextUser);
    setMyEquipmentIds(nextEquipmentIds);
    setHasCompletedRegistration(nextHasCompletedRegistration);

    if (!nextHasCompletedRegistration) {
      return;
    }

    try {
      await updateUser(nextUser.id, {
        fullName: nextUser.fullName,
        phoneNumber: nextUser.phoneNumber,
        cityId: nextUser.cityId,
        address: nextUser.address,
        equipmentIds: nextEquipmentIds,
        temporaryLocation: nextUser.temporaryLocation
      });
    } catch (error) {
      // Keep local state even if remote sync is temporarily unavailable.
    }
  }

  async function updateProfile(params: {
    fullName: string;
    phoneNumber: string;
    cityId: string;
    address?: AddressLocation;
  }) {
    const nextUser: User = {
      ...currentUser,
      fullName: params.fullName,
      phoneNumber: params.phoneNumber,
      cityId: params.cityId,
      address: params.address
    };

    await syncUser(nextUser, myEquipmentIds);
  }

  async function updateMyEquipment(equipmentIds: string[]) {
    const nextUser: User = {
      ...currentUser,
      equipmentIds
    };

    await syncUser(nextUser, equipmentIds);
  }

  async function registerCurrentUser(params: {
    fullName: string;
    phoneNumber: string;
    cityId: string;
    address?: AddressLocation;
    equipmentIds: string[];
  }) {
    const registration = await registerUser({
      fullName: params.fullName,
      phoneNumber: params.phoneNumber,
      cityId: params.cityId,
      address: params.address,
      equipmentIds: params.equipmentIds,
      temporaryLocation: currentUser.temporaryLocation
    });

    const nextUser: User = {
      ...currentUser,
      id: registration.id,
      fullName: params.fullName,
      phoneNumber: params.phoneNumber,
      cityId: params.cityId,
      address: params.address,
      equipmentIds: params.equipmentIds
    };

    setCurrentUser(nextUser);
    setMyEquipmentIds(params.equipmentIds);
    setHasCompletedRegistration(true);
  }

  async function setTemporaryLocation(cityId: string, durationHours: number) {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
    const nextUser: User = {
      ...currentUser,
      temporaryLocation: {
        cityId,
        durationHours,
        expiresAt
      }
    };

    await syncUser(nextUser, myEquipmentIds);
  }

  async function clearTemporaryLocation() {
    const nextUser: User = {
      ...currentUser,
      temporaryLocation: undefined
    };

    await syncUser(nextUser, myEquipmentIds);
  }

  async function runSearch(params: {
    equipmentIds: string[];
    searchMode: SearchMode;
    cityId?: string;
    lat?: number;
    lng?: number;
    searchSummary?: string;
    streetName?: string;
    houseNumber?: string;
  }) {
    let baseLat = params.lat;
    let baseLng = params.lng;

    if (params.searchMode === "city" && (typeof baseLat !== "number" || typeof baseLng !== "number")) {
      const city = cities.find((item) => item.id === params.cityId);
      baseLat = city?.lat;
      baseLng = city?.lng;
    }

    if (typeof baseLat !== "number" || typeof baseLng !== "number") {
      setSearchResults([]);
      setLastSearchMode(params.searchMode);
      setLastSearchSummary(params.searchSummary ?? DEFAULT_SEARCH_SUMMARY);
      return;
    }

    try {
      const results = await searchEquipment({
        requesterUserId: hasCompletedRegistration ? currentUser.id : undefined,
        equipmentIds: params.equipmentIds,
        searchMode: params.searchMode,
        cityId: params.cityId,
        streetName: params.streetName,
        houseNumber: params.houseNumber,
        lat: baseLat,
        lng: baseLng
      });

      setSearchResults(results);
    } catch (error) {
      const fallbackResults = searchNearbyEquipment({
        equipmentIds: params.equipmentIds,
        baseLat,
        baseLng
      }).filter((result) => result.user.id !== currentUser.id);

      setSearchResults(fallbackResults);
    }

    setLastSearchMode(params.searchMode);
    setLastSearchSummary(params.searchSummary ?? DEFAULT_SEARCH_SUMMARY);
  }

  return (
    <AppStateContext.Provider
      value={{
        isHydrated,
        hasCompletedRegistration,
        currentUser,
        selectedCity,
        activeTemporaryCity,
        myEquipmentIds,
        searchResults,
        lastSearchMode,
        lastSearchSummary,
        updateProfile,
        updateMyEquipment,
        registerCurrentUser,
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
