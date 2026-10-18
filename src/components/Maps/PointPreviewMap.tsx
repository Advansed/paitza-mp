import React, { useEffect, useRef } from 'react';
import { GoogleMapInstance } from './MapTypes';
import { initializeMap, onMapTap, plotPoint } from './services/googleMapServices';
import styles from './Maps.module.css';

type PointPreviewMapProps = {
  lat: number;
  lon: number;
  title?: string;
  mark?: boolean;
  zoom?: number;
  onPick?: (lat: number, lon: number) => void;
};

function waitForMapSize(element: HTMLElement): Promise<void> {
  if (element.clientWidth > 0 && element.clientHeight > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      resolve();
    };
    const observer = new ResizeObserver(() => {
      if (element.clientWidth > 0 && element.clientHeight > 0) finish();
    });
    observer.observe(element);
    const timer = window.setTimeout(finish, 400);
  });
}

export const PointPreviewMap: React.FC<PointPreviewMapProps> = ({
  lat,
  lon,
  title,
  mark = true,
  zoom = 15,
  onPick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        await waitForMapSize(mapRef.current!);
        if (cancelled || !mapRef.current) return;
        const map = await initializeMap(mapRef.current, { lat, lon, zoom });
        if (cancelled) {
          map.destroy();
          return;
        }
        mapInstance.current = map;
        if (mark) plotPoint(map, lat, lon, title, { fly: false });
        onMapTap(map, (pickLat, pickLon) => {
          plotPoint(map, pickLat, pickLon, 'Выбранная точка', { fly: false });
          onPickRef.current?.(pickLat, pickLon);
        });
        map.resize();
      } catch (error) {
        console.error('Ошибка карты адреса:', error);
      }
    };

    void init();

    const frame = mapRef.current.parentElement;
    const ro =
      frame && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => mapInstance.current?.resize())
        : null;
    if (frame && ro) ro.observe(frame);

    return () => {
      cancelled = true;
      ro?.disconnect();
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
    // Карта создаётся один раз при открытии, чтобы клик не пересоздавал её.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      className={styles.map}
      style={{ width: '100%', height: '100%', minHeight: 280, cursor: 'crosshair' }}
    />
  );
};
