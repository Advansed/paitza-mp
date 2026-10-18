import React from 'react';
import { searchCities } from '../../../utils/googlePlaces';
import type { CityData } from '../types';
import { PhotonSuggest } from './PhotonSuggest';

interface CityFieldProps {
  label: string;
  value: CityData;
  onChange: (value: CityData) => void;
  onFIAS?: (fias: string) => void;
  disabled?: boolean;
  error?: string;
  validate?: boolean;
}

export const CityField: React.FC<CityFieldProps> = ({
  label,
  value,
  onChange,
  onFIAS,
  disabled = false,
  error,
}) => {
  const display = [value?.city, value?.country].filter(Boolean).join(', ');

  return (
    <PhotonSuggest
      label={label}
      value={display}
      disabled={disabled}
      error={error}
      placeholder="Начните вводить город"
      search={searchCities}
      onSelect={(place) => {
        onChange({
          city: place.name,
          fias: '',
          country: place.country || undefined,
          lat: place.lat,
          lon: place.lon,
        });
        onFIAS?.('');
      }}
    />
  );
};
