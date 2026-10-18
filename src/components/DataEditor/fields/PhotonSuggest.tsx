import React, { useEffect, useRef, useState } from 'react';
import type { GeoPlace } from '../../../utils/googlePlaces';
import fieldStyles from './CityField.module.css';
import styles from './PhotonSuggest.module.css';

type PhotonSuggestProps = {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  search: (query: string, signal: AbortSignal) => Promise<GeoPlace[]>;
  onSelect: (place: GeoPlace) => void;
  onInputChange?: (query: string) => void;
};

export const PhotonSuggest: React.FC<PhotonSuggestProps> = ({
  label,
  value,
  placeholder,
  disabled = false,
  error,
  search,
  onSelect,
  onInputChange,
}) => {
  const [query, setQuery] = useState(value || '');
  const [dirty, setDirty] = useState(false);
  const [items, setItems] = useState<GeoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dirty) return;
    setQuery(value || '');
    setItems([]);
    setOpen(false);
    setLoading(false);
  }, [value, dirty]);

  useEffect(() => {
    if (disabled || !dirty) return;
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void search(q, controller.signal)
        .then((places) => {
          setItems(places);
          setActive(0);
          setOpen(true);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string })?.name !== 'AbortError') setItems([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, disabled, search, dirty]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (place: GeoPlace) => {
    setDirty(false);
    setQuery(place.label);
    setItems([]);
    setOpen(false);
    onSelect(place);
  };

  return (
    <div className={fieldStyles.field}>
      <label className={fieldStyles.label}>{label}</label>
      <div className={styles.wrap} ref={wrapRef}>
        <input
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          className={`${fieldStyles.input} ${error ? fieldStyles.inputError : ''}`}
          autoComplete="off"
          onFocus={() => items.length > 0 && setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            setDirty(true);
            setQuery(next);
            onInputChange?.(next);
          }}
          onKeyDown={(event) => {
            if (!open || items.length === 0) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((i) => Math.min(items.length - 1, i + 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              pick(items[active]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {open && (
          <ul className={styles.list} role="listbox">
            {items.map((item, index) => (
              <li key={`${item.label}-${item.lat}-${item.lon}`}>
                <button
                  type="button"
                  className={`${styles.item} ${index === active ? styles.itemActive : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(item)}
                >
                  {item.label}
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <li className={styles.empty}>{loading ? 'Поиск…' : 'Ничего не найдено'}</li>
            )}
          </ul>
        )}
      </div>
      {error && <span className={fieldStyles.errorMessage}>{error}</span>}
    </div>
  );
};
