/**
 * LocationSelector — three reusable pieces:
 *
 *   <LocationBadge />          — shows current location in header, click to open picker
 *   <LocationPermissionDialog />— prompts for GPS permission with explanation
 *   <LocationSearch />         — debounced search + autocomplete results
 *   <LocationSelectorModal />  — full modal combining all three states
 *
 * All pieces read/write from LocationContext.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../context/LocationContext.jsx';
import { geoApi } from '../api/geo.js';

/* ─────────────────────────────────────────────
   LOCATION BADGE (used in Navbar + Home header)
───────────────────────────────────────────── */
export function LocationBadge({ className = '' }) {
  const { displayName, detectionState, openSelector } = useLocation();

  const isDetecting = detectionState === 'detecting' || detectionState === 'resolving';

  return (
    <button
      className={`location-badge ${className}`}
      onClick={openSelector}
      aria-label="Change location"
    >
      <span className="location-badge__pin">📍</span>
      <span className="location-badge__text">
        {isDetecting
          ? 'Detecting…'
          : displayName || 'Select location'}
      </span>
      <span className="location-badge__caret">▾</span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   LOCATION SEARCH — debounced text search
───────────────────────────────────────────── */
export function LocationSearch({ onSelect, autoFocus = false }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { results: r } = await geoApi.search(val, 8);
        setResults(r || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  const handleSelect = useCallback((result) => {
    setQuery(result.formattedAddress || '');
    setResults([]);
    onSelect?.(result);
  }, [onSelect]);

  return (
    <div className="location-search">
      <div className="location-search__input-wrap">
        <span className="location-search__icon">🔍</span>
        <input
          ref={inputRef}
          className="location-search__input"
          type="text"
          placeholder="Search city or area…"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoComplete="off"
          aria-label="Search location"
        />
        {loading && <span className="location-search__spinner">⟳</span>}
        {query && (
          <button
            className="location-search__clear"
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >✕</button>
        )}
      </div>

      {focused && results.length > 0 && (
        <ul className="location-search__results" role="listbox">
          {results.map((r, i) => (
            <li
              key={i}
              role="option"
              className="location-search__result-item"
              onMouseDown={() => handleSelect(r)}
            >
              <span className="location-search__result-pin">📍</span>
              <span>
                <strong>
                  {r.area?.name || r.city?.name}
                </strong>
                <small>
                  {[r.city?.name, r.state?.name].filter(Boolean).join(', ')}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}

      {focused && query && !loading && results.length === 0 && (
        <div className="location-search__empty">No locations found for "{query}"</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOCATION PERMISSION DIALOG
───────────────────────────────────────────── */
function LocationPermissionDialog({ onRequestGPS, onSkip }) {
  return (
    <div className="location-permission">
      <div className="location-permission__icon">🗺️</div>
      <h3 className="location-permission__title">Allow location access?</h3>
      <p className="location-permission__body">
        Your location helps us find Pandits who serve your area and show relevant
        services, availability, and pricing.
      </p>
      <div className="location-permission__actions">
        <button className="btn btn--primary" onClick={onRequestGPS}>
          Use my location
        </button>
        <button className="btn btn--ghost" onClick={onSkip}>
          Enter manually
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DETECTED LOCATION CONFIRM
───────────────────────────────────────────── */
function DetectedLocationConfirm({ location, onConfirm, onChangeLocation }) {
  return (
    <div className="location-confirm">
      <div className="location-confirm__check">✅</div>
      <p className="location-confirm__label">We detected your location as:</p>
      <div className="location-confirm__address">
        <strong>{location.area?.name || location.city?.name}</strong>
        <span>{[location.city?.name, location.state?.name].filter(Boolean).join(', ')}</span>
      </div>
      <div className="location-confirm__actions">
        <button className="btn btn--primary" onClick={onConfirm}>
          Yes, this is correct
        </button>
        <button className="btn btn--ghost" onClick={onChangeLocation}>
          Change location
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOCATION SELECTOR MODAL (orchestrator)
───────────────────────────────────────────── */
export function LocationSelectorModal() {
  const {
    selectorOpen,
    closeSelector,
    permissionState,
    detectionState,
    detectedLocation,
    selectedLocation,
    error,
    requestBrowserLocation,
    confirmDetected,
    selectLocation,
  } = useLocation();

  const [view, setView] = useState('initial'); // initial | permission | detecting | confirm | search | denied | error

  /* Determine which view to show based on context state */
  useEffect(() => {
    if (!selectorOpen) return;
    if (permissionState === 'unavailable') { setView('search'); return; }
    if (permissionState === 'denied')      { setView('denied'); return; }
    if (detectionState === 'detecting' || detectionState === 'resolving') { setView('detecting'); return; }
    if (detectionState === 'done' && detectedLocation && !selectedLocation) { setView('confirm'); return; }
    if (detectionState === 'error') { setView('error'); return; }
    if (permissionState === 'unknown') { setView('initial'); return; }
    setView('search');
  }, [selectorOpen, permissionState, detectionState, detectedLocation, selectedLocation]);

  if (!selectorOpen) return null;

  const handleGPS = () => {
    setView('detecting');
    requestBrowserLocation();
  };

  const handleConfirm = () => {
    confirmDetected();
  };

  const handleManualSelect = (result) => {
    selectLocation(result);
  };

  return (
    <div className="location-modal-overlay" onClick={closeSelector} role="dialog" aria-modal="true">
      <div className="location-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal__header">
          <span className="location-modal__title">Set your location</span>
          <button className="location-modal__close" onClick={closeSelector} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="location-modal__body">
          {view === 'initial' && (
            <LocationPermissionDialog
              onRequestGPS={handleGPS}
              onSkip={() => setView('search')}
            />
          )}

          {view === 'detecting' && (
            <div className="location-detecting">
              <div className="location-detecting__spinner" aria-label="Detecting location" />
              <p>
                {detectionState === 'resolving'
                  ? 'Resolving your area…'
                  : 'Accessing GPS…'}
              </p>
            </div>
          )}

          {view === 'confirm' && detectedLocation && (
            <DetectedLocationConfirm
              location={detectedLocation}
              onConfirm={handleConfirm}
              onChangeLocation={() => setView('search')}
            />
          )}

          {view === 'search' && (
            <>
              <p className="location-modal__hint">Search for your city or area:</p>
              <LocationSearch onSelect={handleManualSelect} autoFocus />
              {selectedLocation && (
                <div className="location-modal__current">
                  <span>Current: </span>
                  <strong>
                    {[selectedLocation.area?.name, selectedLocation.city?.name]
                      .filter(Boolean).join(', ')}
                  </strong>
                </div>
              )}
              {permissionState !== 'denied' && permissionState !== 'unavailable' && (
                <button className="location-modal__gps-btn" onClick={handleGPS}>
                  📍 Use my current location
                </button>
              )}
            </>
          )}

          {view === 'denied' && (
            <div className="location-denied">
              <div className="location-denied__icon">🔒</div>
              <p>Location access is turned off in your browser.</p>
              <p className="location-denied__hint">
                To enable: open browser settings → Site permissions → Allow location for this site.
              </p>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setView('search')}>
                Enter location manually
              </button>
            </div>
          )}

          {view === 'error' && (
            <div className="location-error">
              <div className="location-error__icon">⚠️</div>
              <p>{error || "We couldn't determine your location."}</p>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setView('search')}>
                Search location manually
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationSelectorModal;
