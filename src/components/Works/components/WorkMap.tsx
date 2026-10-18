import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { waypointCoordinates } from '../../../Store/cargoStore';
import { useOrderLocation } from '../../Maps/useOrderLocation';
import Maps from '../../Maps/Maps';
import mapStyles from '../../Maps/Maps.module.css';
import { normalizeWorkStatus } from '../statusFlow';
import { WorkInfo, WorkStatus } from '../types';

const ACTIVE_WORK = new Set<WorkStatus>([
  WorkStatus.TO_LOAD,
  WorkStatus.ON_LOAD,
  WorkStatus.LOADING,
  WorkStatus.LOADED,
  WorkStatus.IN_WORK,
  WorkStatus.TO_UNLOAD,
  WorkStatus.UNLOADING,
  WorkStatus.UNLOADED,
]);

interface WorkMapProps {
    work: WorkInfo;
    onBack: () => void;
}

export const WorkMap: React.FC<WorkMapProps> = ({ work, onBack }) => {
    const tracking = ACTIVE_WORK.has(normalizeWorkStatus(work.status));
    const executorPoint = useOrderLocation(work.cargo, tracking);

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
                        lat: Number(work.address?.lat) || 0,
                        long: Number(work.address?.lon) || 0,
                    }}
                    endCoords={{
                        lat: Number(work.destiny?.lat) || 0,
                        long: Number(work.destiny?.lon) || 0,
                    }}
                    waypoints={waypointCoordinates(work.route).map((point) => ({
                        lat: point.lat,
                        long: point.lon,
                    }))}
                    workInfo={work}
                    executorPoint={executorPoint}
                />
            </div>
        </div>
    );
};
