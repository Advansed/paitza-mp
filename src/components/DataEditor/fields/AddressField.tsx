import React, { useCallback, useEffect, useState } from 'react';
import { Map, X } from 'lucide-react';
import { reverseGeocode, searchAddresses } from '../../../utils/googlePlaces';
import { MAPS_CONFIG } from '../../Maps/services/MapConfig';
import { hasMapCoordinates } from '../../Maps/services/coordinatHelpers';
import { PointPreviewMap } from '../../Maps/PointPreviewMap';
import { PhotonSuggest } from './PhotonSuggest';
import styles from './AddressField.module.css';

interface AddressFieldProps {
  label: string;
  value: { address: string; fias: string; lat: string; lon: string };
  onChange: (value: { address: string; fias: string; lat: string; lon: string }) => void;
  cityFias?: string;
  cityName?: string;
  country?: string;
  cityLat?: number;
  cityLon?: number;
  disabled?: boolean;
  error?: string;
  validate?: string;
}

export const AddressField: React.FC<AddressFieldProps> = ({
  label,
  value,
  onChange,
  cityName,
  cityLat,
  cityLon,
  disabled = false,
  error,
}) => {
  const [mapOpen, setMapOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickedLabel, setPickedLabel] = useState('');
  const search = useCallback(
    (query: string, signal: AbortSignal) =>
      searchAddresses(query, { city: cityName, lat: cityLat, lon: cityLon }, signal),
    [cityName, cityLat, cityLon]
  );

  const cityLatStr = cityLat != null && Number.isFinite(cityLat) ? String(cityLat) : '';
  const cityLonStr = cityLon != null && Number.isFinite(cityLon) ? String(cityLon) : '';
  const lat = Number(value?.lat) || cityLat || 0;
  const lon = Number(value?.lon) || cityLon || 0;
  const hasPoint = hasMapCoordinates({ lat, long: lon });
  const mapLat = hasPoint ? lat : MAPS_CONFIG.defaultCenter.lat;
  const mapLon = hasPoint ? lon : MAPS_CONFIG.defaultCenter.lng;
  const mapTitle = pickedLabel || value?.address?.trim() || cityName || 'Адрес';

  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMapOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mapOpen]);

  const handlePick = async (pickLat: number, pickLon: number) => {
    setPicking(true);
    try {
      const place = await reverseGeocode(pickLat, pickLon);
      const address =
        place?.label ||
        `${pickLat.toFixed(6)}, ${pickLon.toFixed(6)}`;
      setPickedLabel(address);
      onChange({
        address,
        fias: '',
        lat: String(pickLat),
        lon: String(pickLon),
      });
    } finally {
      setPicking(false);
    }
  };

  return (
    <div>
      <PhotonSuggest
        label={label}
        value={value?.address || ''}
        disabled={disabled}
        error={error}
        placeholder={cityName ? `Улица и дом в ${cityName}` : 'Улица и дом'}
        search={search}
        onInputChange={(query) =>
          onChange({
            address: query,
            fias: value?.fias || '',
            lat: value?.lat || cityLatStr,
            lon: value?.lon || cityLonStr,
          })
        }
        onSelect={(place) =>
          onChange({
            address: place.label,
            fias: '',
            lat: String(place.lat),
            lon: String(place.lon),
          })
        }
      />
      <button
        type="button"
        className={styles.mapBtn}
        onClick={() => {
          setPickedLabel('');
          setMapOpen(true);
        }}
      >
        <Map size={16} strokeWidth={1.75} />
        Указать на карте
      </button>

      {mapOpen && (
        <div
          className={styles.mapOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Указать адрес на карте"
        >
          <div className={styles.mapDialog} onClick={(event) => event.stopPropagation()}>
            <div className={styles.mapBar}>
              <div className={styles.mapHeadingWrap}>
                <h3 className={styles.mapHeading}>{mapTitle}</h3>
                <p className={styles.mapHint}>
                  {picking ? 'Определяем адрес…' : 'Нажмите на карту, чтобы указать точку'}
                </p>
              </div>
              <button
                type="button"
                className={styles.mapClose}
                onClick={() => setMapOpen(false)}
                aria-label="Закрыть"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className={styles.mapFrame}>
              <PointPreviewMap
                lat={mapLat}
                lon={mapLon}
                zoom={hasPoint ? 15 : MAPS_CONFIG.overviewZoom}
                mark={hasPoint}
                title={mapTitle}
                onPick={handlePick}
              />
            </div>
            <div className={styles.mapActions}>
              <button type="button" className={styles.mapDone} onClick={() => setMapOpen(false)}>
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
