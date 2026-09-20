import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authApi } from '../api/index.js';

/* ── Shape ── */
const initialState = {
  user:    null,
  token:   localStorage.getItem('pj_token') || null,
  loading: true,   // true while checking persisted token on mount
  error:   null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':  return { ...state, loading: action.payload };
    case 'LOGIN_OK':     return { ...state, user: action.user, token: action.token, loading: false, error: null };
    case 'LOGOUT':       return { ...initialState, loading: false, token: null };
    case 'ERROR':        return { ...state, error: action.payload, loading: false };
    case 'HYDRATED':     return { ...state, user: action.user, loading: false };
    default:             return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* On mount — try to rehydrate user from stored token */
  useEffect(() => {
    async function hydrate() {
      const token = localStorage.getItem('pj_token');
      if (!token) { dispatch({ type: 'SET_LOADING', payload: false }); return; }
      try {
        const { user } = await authApi.me();
        dispatch({ type: 'HYDRATED', user });
      } catch {
        /* Token expired or invalid — clear it */
        localStorage.removeItem('pj_token');
        dispatch({ type: 'LOGOUT' });
      }
    }
    hydrate();
  }, []);

  const login = useCallback(async ({ phone, email, password }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { token, user } = await authApi.login({ phone, email, password });
      localStorage.setItem('pj_token', token);
      dispatch({ type: 'LOGIN_OK', user, token });
      return { success: true, user };
    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  const register = useCallback(async (data) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { token, user } = await authApi.register(data);
      localStorage.setItem('pj_token', token);
      dispatch({ type: 'LOGIN_OK', user, token });
      return { success: true, user };
    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pj_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
