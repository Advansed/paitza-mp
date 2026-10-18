import React, { useEffect, useRef } from 'react';
import styles from './Maps.module.css';
import { GoogleMapInstance } from './MapTypes';
import { FeedRoute } from './mockFeedRoutes';
import { initializeMap, plotFeedRoutes } from './services/googleMapServices';

type FeedRoutesMapProps = {
  routes: FeedRoute[];
  onRouteClick?: (routeId: string) => void;
};

export const FeedRoutesMap: React.FC<FeedRoutesMapProps> = ({ routes, onRouteClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);
  const routesRef = useRef(routes);
  routesRef.current = routes;
  const onRouteClickRef = useRef(onRouteClick);
  onRouteClickRef.current = onRouteClick;
  const routesKey = routes.map((item) => item.id).join('|');

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        const map = await initializeMap(mapRef.current!);
        if (cancelled) {
          map.destroy();
          return;
        }
        mapInstance.current = map;
        map.resize();
        await plotFeedRoutes(map, routesRef.current, (routeId) =>
          onRouteClickRef.current?.(routeId)
        );
        map.resize();
      } catch (error) {
        console.error('Ошибка карты ленты:', error);
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
  }, [routesKey]);

  return (
    <div className={styles.feedMap}>
      <div className={styles.feedMapFrame}>
        <div ref={mapRef} className={styles.map} style={{ height: '100%' }} />
      </div>
    </div>
  );
};
