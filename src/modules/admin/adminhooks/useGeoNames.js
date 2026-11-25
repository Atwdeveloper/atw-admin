"use client";

import { useEffect, useState } from "react";
import { getStatesAPI, getCitiesAPI } from "../../../api/adminV1/geographyAPI";
import { asList } from "../utils/workerUtils";

// id -> name maps for the given state ids (and their cities), for showing
// addresses that only carry stateId/cityId. Lookups are cached per tab.
let statesPromise = null;
const citiesPromises = new Map();

const loadStates = () => {
  if (!statesPromise) {
    statesPromise = getStatesAPI()
      .then(asList)
      .catch((e) => {
        statesPromise = null;
        throw e;
      });
  }
  return statesPromise;
};

export const loadCities = (stateId) => {
  if (!citiesPromises.has(stateId)) {
    citiesPromises.set(
      stateId,
      getCitiesAPI(stateId)
        .then(asList)
        .catch((e) => {
          citiesPromises.delete(stateId);
          throw e;
        }),
    );
  }
  return citiesPromises.get(stateId);
};

export const useGeoNames = (stateIds = []) => {
  const [geo, setGeo] = useState({ states: {}, cities: {} });
  const key = [...new Set(stateIds.filter(Boolean))].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const ids = key.split(",");
    Promise.all([loadStates().catch(() => []), ...ids.map((id) => loadCities(id).catch(() => []))]).then(
      ([states, ...cityLists]) => {
        if (cancelled) return;
        setGeo({
          states: Object.fromEntries(states.map((s) => [s.id, s.name])),
          cities: Object.fromEntries(cityLists.flat().map((c) => [c.id, c.name])),
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  return geo;
};

export const useStates = () => {
  const [states, setStates] = useState([]);
  useEffect(() => {
    let cancelled = false;
    loadStates()
      .then((s) => !cancelled && setStates(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return states;
};
