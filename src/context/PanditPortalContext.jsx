/**
 * PanditPortalContext
 *
 * Provides:
 *   provider        — the Provider document for the logged-in pandit
 *   user            — User document
 *   completion      — { percent, missing[] }
 *   providerServices— array of ProviderService docs
 *   serviceAreas    — array of ProviderServiceArea docs
 *   loading         — initial load in progress
 *   error           — load error message
 *   refresh()       — re-fetch everything from /api/pandit-portal/me
 *
 * Access guard: redirects to /pandit-portal/login if:
 *   - not authenticated
 *   - userType is not PROVIDER (and not ADMIN)
 *
 * Usage:
 *   const { provider, completion, refresh } = usePanditPortal();
 */
import React, {
  createContext, useContext, useEffect, useReducer, useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { panditPortalApi } from '../api/panditPortal.js';

const PanditPortalContext = createContext(null);

const initial = {
  provider:         null,
  user:             null,
  completion:       { percent: 0, missing: [] },
  providerServices: [],
  serviceAreas:     [],
  loading:          true,
  error:            null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        provider:         action.payload.provider,
        user:             action.payload.user,
        completion:       action.payload.completion,
        providerServices: action.payload.providerServices,
        serviceAreas:     action.payload.serviceAreas,
        loading: false, error: null,
      };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'ERROR':       return { ...state, loading: false, error: action.payload };
    case 'UPDATE_PROVIDER':
      return { ...state, provider: action.payload };
    default: return state;
  }
}

export function PanditPortalProvider({ children }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initial);

  const refresh = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await panditPortalApi.me();
      dispatch({ type: 'LOADED', payload: data });
    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.message });
    }
  }, []);

  useEffect(() => {
    /* Wait for AuthContext to finish hydrating */
    if (authLoading) return;
    /* If user is authenticated as PROVIDER or ADMIN, load portal data */
    if (authUser && ['PROVIDER', 'ADMIN'].includes(authUser.userType)) {
      refresh();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [authUser, authLoading, refresh]);

  const value = {
    ...state,
    refresh,
    isProvider: authUser?.userType === 'PROVIDER' || authUser?.userType === 'ADMIN',
    authUser,
  };

  return (
    <PanditPortalContext.Provider value={value}>
      {children}
    </PanditPortalContext.Provider>
  );
}

export function usePanditPortal() {
  const ctx = useContext(PanditPortalContext);
  if (!ctx) throw new Error('usePanditPortal must be used inside <PanditPortalProvider>');
  return ctx;
}

export default PanditPortalContext;
