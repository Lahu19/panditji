/**
 * LocationContext — platform-level geo location state.
 *
 * Manages:
 *   detectedLocation  — from browser GPS + reverse-geocode
 *   selectedLocation  — what the user actually chose to use
 *   permissionState   — 'unknown' | 'requesting' | 'granted' | 'denied' | 'unavailable'
 *   detectionState    — 'idle' | 'detecting' | 'resolving' | 'done' | 'error'
 *
 * Rule: selectedLocation is ALWAYS what the rest of the app uses.
 * Browser GPS only sets detectedLocation; user must confirm to make it selected.
 * Manual picks go directly to selectedLocation.
 *
 * Persists selectedLocation to localStorage under 'pj_location'.
 */
import React, {
  createContext, useContext, useReducer, useCallback, useEffect,
} from 'react';
import { geoApi } from '../api/geo.js';

/* ── Constants ── */
const STORAGE_KEY = 'pj_location';

/* ── Initial state ── */
const initialState = {
  detectedLocation:  null,   // from GPS
  selectedLocation:  null,   // what the app uses
  permissionState:   'unknown',   // unknown | requesting | granted | denied | unavailable
  detectionState:    'idle',      // idle | detecting | resolving | done | error
  error:             null,
  selectorOpen:      false,
};

/* ── Reducer ── */
function reducer(state, action) {
  switch (action.type) {
    case 'SET_PERMISSION':
      return { ...state, permissionState: action.payload };
    case 'SET_DETECTION':
      return { ...state, detectionState: action.payload, error: null };
    case 'DETECTED':
      return {
        ...state,
        detectedLocation: action.location,
        detectionState:   'done',
        permissionState:  'granted',
        error:            null,
      };
    case 'SELECT':
      return {
        ...state,
        selectedLocation: action.location,
        selectorOpen:     false,
      };
    case 'ERROR':
      return { ...state, detectionState: 'error', error: action.payload };
    case 'OPEN_SELECTOR':
      return { ...state, selectorOpen: true };
    case 'CLOSE_SELECTOR':
      return { ...state, selectorOpen: false };
    case 'CLEAR':
      return { ...state, selectedLocation: null, detectedLocation: null };
    default:
      return state;
  }
}

/* ── Context ── */
const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* ── Rehydrate persisted location on mount ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        dispatch({ type: 'SELECT', location: { ...saved, source: 'USER_SELECTED' } });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* ── Persist selectedLocation whenever it changes ── */
  useEffect(() => {
    if (state.selectedLocation) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.selectedLocation));
      } catch { /* storage full — ignore */ }
    }
  }, [state.selectedLocation]);

  /* ── requestBrowserLocation — ask for GPS and reverse-geocode ── */
  const requestBrowserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      dispatch({ type: 'SET_PERMISSION', payload: 'unavailable' });
      return;
    }

    dispatch({ type: 'SET_DETECTION', payload: 'detecting' });
    dispatch({ type: 'SET_PERMISSION', payload: 'requesting' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        dispatch({ type: 'SET_PERMISSION', payload: 'granted' });
        dispatch({ type: 'SET_DETECTION', payload: 'resolving' });

        const { latitude, longitude, accuracy } = position.coords;

        try {
          const { location } = await geoApi.resolve(latitude, longitude);
          dispatch({
            type: 'DETECTED',
            location: { ...location, accuracy, source: 'BROWSER_GPS' },
          });
        } catch {
          /* Reverse geocode failed — still store raw coords */
          dispatch({
            type: 'ERROR',
            payload: "We couldn't determine your exact area. Please search your location manually.",
          });
        }
      },
      (err) => {
        if (err.code === 1) {
          dispatch({ type: 'SET_PERMISSION', payload: 'denied' });
          dispatch({
            type: 'ERROR',
            payload: 'Location access is turned off. Please enter your location manually.',
          });
        } else if (err.code === 2) {
          dispatch({
            type: 'ERROR',
            payload: "We couldn't determine your location. Please search manually.",
          });
        } else {
          dispatch({
            type: 'ERROR',
            payload: 'Location request timed out. Please search manually.',
          });
        }
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  /* ── confirmDetected — use the GPS-detected location ── */
  const confirmDetected = useCallback(() => {
    if (state.detectedLocation) {
      dispatch({ type: 'SELECT', location: { ...state.detectedLocation, source: 'USER_SELECTED' } });
    }
  }, [state.detectedLocation]);

  /* ── selectLocation — manually select from search results ── */
  const selectLocation = useCallback((location) => {
    dispatch({ type: 'SELECT', location: { ...location, source: 'USER_SELECTED' } });
  }, []);

  /* ── openSelector / closeSelector ── */
  const openSelector  = useCallback(() => dispatch({ type: 'OPEN_SELECTOR' }), []);
  const closeSelector = useCallback(() => dispatch({ type: 'CLOSE_SELECTOR' }), []);

  /* ── clearLocation ── */
  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'CLEAR' });
  }, []);

  /**
   * getLocationForRequest — build location object to embed in a service request.
   * Uses selectedLocation; caller may override with a booking-specific location.
   */
  const getLocationForRequest = useCallback((overrideLocation = null) => {
    const loc = overrideLocation || state.selectedLocation;
    if (!loc) return null;
    return {
      cityId:    loc.city?.id    || null,
      areaId:    loc.area?.id    || null,
      stateId:   loc.state?.id   || null,
      countryId: loc.country?.id || null,
      coordinates: loc.coordinates || null,
      formattedAddress: loc.formattedAddress || '',
      source: loc.source || 'USER_SELECTED',
    };
  }, [state.selectedLocation]);

  const value = {
    ...state,
    requestBrowserLocation,
    confirmDetected,
    selectLocation,
    openSelector,
    closeSelector,
    clearLocation,
    getLocationForRequest,
    /** Shorthand for displaying in UI */
    displayName: state.selectedLocation
      ? [state.selectedLocation.area?.name, state.selectedLocation.city?.name]
          .filter(Boolean).join(', ')
      : null,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside <LocationProvider>');
  return ctx;
}

export default LocationContext;
