import React, { useEffect, useRef, useState } from 'react';
import styles from './Maps.module.css';
import { MapProps, GoogleMapInstance } from './MapTypes';
import { createRoute, initializeMap, setExecutorMarker } from './services/googleMapServices';
import { hasMapCoordinates } from './services/coordinatHelpers';

const Maps: React.FC<MapProps> = ({
  startCoords,
  endCoords,
  waypoints = [],
  cargoInfo,
  workInfo,
  executorPoint = null,
  height = '100%',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);
  const infoRef = useRef(cargoInfo || workInfo);
  infoRef.current = cargoInfo || workInfo;
  const viaRef = useRef(waypoints);
  viaRef.current = waypoints;
  const [mapReady, setMapReady] = useState(false);
  const coordsReady = hasMapCoordinates(startCoords) && hasMapCoordinates(endCoords);
  const startLat = startCoords.lat;
  const startLng = startCoords.long;
  const endLat = endCoords.lat;
  const endLng = endCoords.long;
  const viaKey = waypoints.map((point) => `${point.lat},${point.long}`).join('|');
  const executorLat = executorPoint?.lat;
  const executorLng = executorPoint?.long;

  useEffect(() => {
    if (!coordsReady || !mapRef.current) return;
    let cancelled = false;

    const initMap = async () => {
      try {
        const map = await initializeMap(mapRef.current!, {
          lat: startLat,
          lon: startLng,
          zoom: 8,
        });
        if (cancelled) {
          map.destroy();
          return;
        }
        mapInstance.current = map;
        map.resize();
        await createRoute(
          map,
          { lat: startLat, long: startLng },
          { lat: endLat, long: endLng },
          infoRef.current,
          viaRef.current
        );
        map.resize();
        if (!cancelled) setMapReady(true);
      } catch (error) {
        console.error('Ошибка инициализации карты:', error);
      }
    };

    void initMap();

    const frame = mapRef.current.parentElement;
    const ro =
      frame && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => mapInstance.current?.resize())
        : null;
    if (frame && ro) ro.observe(frame);

    return () => {
      cancelled = true;
      setMapReady(false);
      ro?.disconnect();
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [coordsReady, startLat, startLng, endLat, endLng, viaKey]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map) return;
    const point =
      executorLat == null || executorLng == null
        ? null
        : { lat: executorLat, long: executorLng };
    if (!point || !hasMapCoordinates(point)) {
      setExecutorMarker(map, null);
      return;
    }
    setExecutorMarker(map, { lat: point.lat, lng: point.long });
  }, [mapReady, executorLat, executorLng]);

  if (!coordsReady) {
    return (
      <div className={styles.mapContainer}>
        <p className={styles.mapEmpty}>Координаты маршрута ещё не заданы</p>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.map} style={{ height }} />
    </div>
  );
};

export default Maps;
