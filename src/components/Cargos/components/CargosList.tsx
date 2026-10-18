import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Map, Plus, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { CargoCard } from './CargoCard';
import { CargoInfo, CargoStatus } from '../../../Store/cargoStore';
import { useCompanyStore } from '../../../Store/companyStore';
import { cargoFeedKind, resolveCargoProgressStatus } from '../cargoStatusFlow';
import { intlLocale } from '../../../i18n';
import { FeedRoutesMap } from '../../Maps/FeedRoutesMap';
import { ordersToFeedRoutes } from '../../Maps/mockFeedRoutes';
import styles from './CargosList.module.css';

type FilterId = 'all' | 'new' | 'bids' | 'work' | 'done';

const FILTERS: { id: FilterId; key: string }[] = [
  { id: 'all', key: 'filterAll' },
  { id: 'new', key: 'filterNew' },
  { id: 'bids', key: 'filterBids' },
  { id: 'work', key: 'filterWork' },
  { id: 'done', key: 'filterDone' },
];

function matchesFilter(status: CargoStatus, filter: FilterId): boolean {
  if (filter === 'all') return true;
  const kind = cargoFeedKind(status);
  // «В работе»: после торгов и до завершения (включая проблемы)
  if (filter === 'work') return kind === 'work' || kind === 'alert';
  if (filter === 'new') return kind === 'new' || kind === 'waiting';
  return kind === filter;
}

function activeOrdersLabel(count: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (count === 0) return t('activeNone');
  return t('active', { count });
}

interface CargosListProps {
  cargos: CargoInfo[];
  isLoading?: boolean;
  onCreateNew: () => void;
  onCargoClick: (cargo: CargoInfo) => void;
  onRefresh?: () => Promise<void>;
}

function updatedLabel(at: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const mins = Math.floor((Date.now() - at) / 60000);
  if (mins < 1) return t('updatedNow');
  if (mins === 1) return t('updatedMin');
  const time = new Date(at).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' });
  return t('updatedAt', { time });
}

const CargosListInner: React.FC<CargosListProps> = ({
  cargos,
  isLoading = false,
  onCreateNew,
  onCargoClick,
  onRefresh,
}) => {
  const { t } = useTranslation('works');
  const { t: tc } = useTranslation('cargos');
  const companyLabel = useCompanyStore(
    (state) => state.data?.short_name || state.data?.name || ''
  );
  const [filter, setFilter] = useState<FilterId>('all');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const waitingRefresh = useRef(false);

  const visible = useMemo(
    () =>
      cargos.filter((cargo) =>
        matchesFilter(resolveCargoProgressStatus(cargo), filter)
      ),
    [cargos, filter]
  );

  const mapRoutes = useMemo(
    () => (view === 'map' ? ordersToFeedRoutes(visible) : []),
    [view, visible]
  );

  useEffect(() => {
    if (!waitingRefresh.current) return;
    waitingRefresh.current = false;
    setRefreshing(false);
    setUpdatedAt(Date.now());
  }, [cargos]);

  useEffect(() => {
    if (!refreshing) return;
    const timer = window.setTimeout(() => {
      waitingRefresh.current = false;
      setRefreshing(false);
      setUpdatedAt(Date.now());
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [refreshing]);

  const handleRefresh = () => {
    if (!onRefresh || refreshing) return;
    waitingRefresh.current = true;
    setRefreshing(true);
    void onRefresh();
  };

  return (
    <div className={`${styles.feed} ${view === 'map' ? styles.feedFill : ''}`} data-feed-view={view}>
      <header className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h1 className={styles.pageTitle}>{t('feedTitle')}</h1>
          <p className={styles.pageSub}>
            {activeOrdersLabel(cargos.length, t)} · {updatedLabel(updatedAt, t)}
          </p>
        </div>
        <div className={styles.pageHeadActions}>
          <div className={styles.viewToggle} role="tablist" aria-label={t('viewLabel')}>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'list'}
              className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('list')}
            >
              <List size={16} strokeWidth={2} />
              <span className={styles.btnLabel}>{t('viewList')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'map'}
              className={`${styles.viewBtn} ${view === 'map' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('map')}
            >
              <Map size={16} strokeWidth={2} />
              <span className={styles.btnLabel}>{t('viewMap')}</span>
            </button>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={refreshing || !onRefresh}
            aria-label={t('refreshFeed')}
            title={t('refresh')}
          >
            <RefreshCw size={18} strokeWidth={2.25} className={refreshing ? styles.refreshSpin : undefined} />
            <span className={styles.btnLabel}>{t('refresh')}</span>
          </button>
          <button type="button" className={styles.createBtn} onClick={onCreateNew}>
            <Plus size={16} strokeWidth={2.25} />
            <span className={styles.createLabel}>{tc('newCargo')}</span>
            <span className={styles.createLabelShort}>{tc('newShort')}</span>
          </button>
        </div>
      </header>

      {view === 'map' ? (
        <>
          <div className={styles.toolbar}>
            <div className={styles.tabs} role="tablist" aria-label={t('filterLabel')}>
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  className={`${styles.tab} ${filter === item.id ? styles.tabActive : ''}`}
                  onClick={() => setFilter(item.id)}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </div>
          <FeedRoutesMap
            routes={mapRoutes}
            onRouteClick={(routeId) => {
              const cargo = visible.find((item) => item.guid === routeId);
              if (cargo) onCargoClick(cargo);
            }}
          />
        </>
      ) : (
        <>
      <div className={styles.legend} aria-label={t('legend')}>
        <span className={styles.legendTitle}>{t('legend')}</span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotFull}`} />
          {t('payFull')}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotPartial}`} />
          {t('payPartial')}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotNone}`} />
          {t('payNone')}
        </span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label={t('filterLabel')}>
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`${styles.tab} ${filter === item.id ? styles.tabActive : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
        <button type="button" className={styles.filterBtn}>
          <SlidersHorizontal size={15} strokeWidth={2} />
          <span className={styles.btnLabel}>{t('filters')}</span>
        </button>
      </div>

      <div className={styles.list}>
        {isLoading && cargos.length === 0 ? (
          <div className={styles.loading}>{tc('loading')}</div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {cargos.length === 0 ? tc('notFound') : tc('emptyFilter')}
            </p>
            <p className={styles.emptyHint}>
              {cargos.length === 0 ? tc('createFirst') : tc('emptyFilterHint')}
            </p>
          </div>
        ) : (
          visible.map((cargo) => (
            <CargoCard
              key={cargo.guid}
              cargo={cargo}
              mode="list"
              companyName={companyLabel}
              onSelect={onCargoClick}
            />
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
};

export const CargosList = React.memo(CargosListInner);
