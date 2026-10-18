import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CargoInfo, DriverStatus, waypointCoordinates } from '../../../Store/cargoStore';
import { useOrderLocation } from '../../Maps/useOrderLocation';
import Maps from '../../Maps/Maps';
import mapStyles from '../../Maps/Maps.module.css';

const ACTIVE_INVOICE = new Set<DriverStatus>([
  'Принято',
  'На погрузке',
  'Загружается',
  'Загружено',
  'В пути',
  'Доставлено',
  'Разгружается',
  'Разгружено',
]);

interface CargoMapProps {
  cargo: CargoInfo;
  onBack: () => void;
}

export const CargoMap: React.FC<CargoMapProps> = ({ cargo, onBack }) => {
  const tracking = (cargo.invoices ?? []).some((invoice) => {
    const code = Number((invoice as { status_code?: number }).status_code);
    if (Number.isFinite(code) && code >= 12 && code <= 19) return true;
    return ACTIVE_INVOICE.has(invoice.status);
  });
  const executorPoint = useOrderLocation(cargo.guid, tracking);

  return (
    <div className={mapStyles.mapPage} data-route-map>
      <div className={mapStyles.mapBar}>
        <button
          type="button"
          className={mapStyles.mapBack}
          onClick={onBack}
          aria-label="Назад к заказу"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <h1 className={mapStyles.mapHeading}>Карта маршрута</h1>
      </div>
      <div className={mapStyles.mapWrap}>
        <Maps
          startCoords={{
            lat: Number(cargo.address?.lat) || 0,
            long: Number(cargo.address?.lon) || 0,
          }}
          endCoords={{
            lat: Number(cargo.destiny?.lat) || 0,
            long: Number(cargo.destiny?.lon) || 0,
          }}
          waypoints={waypointCoordinates(cargo.route).map((point) => ({
            lat: point.lat,
            long: point.lon,
          }))}
          cargoInfo={cargo}
          executorPoint={executorPoint}
        />
      </div>
    </div>
  );
};
