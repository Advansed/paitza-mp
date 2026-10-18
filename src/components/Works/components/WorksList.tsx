import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Map, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { WorkInfo, WorkStatus } from '../types';
import { WorkCard } from './WorkCard';
import { normalizeWorkStatus } from '../statusFlow';
import { intlLocale } from '../../../i18n';
import { FeedRoutesMap } from '../../Maps/FeedRoutesMap';
import { ordersToFeedRoutes } from '../../Maps/mockFeedRoutes';
import styles from './WorksList.module.css';

type FilterId = 'all' | 'new' | 'bids' | 'work' | 'done';

const FILTERS: { id: FilterId; key: string }[] = [
  { id: 'all', key: 'filterAll' },
  { id: 'new', key: 'filterNew' },
  { id: 'bids', key: 'filterBids' },
  { id: 'work', key: 'filterWork' },
  { id: 'done', key: 'filterDone' },
];

function matchesFilter(status: WorkStatus, filter: FilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'new') return status === WorkStatus.NEW;
  if (filter === 'bids') return status === WorkStatus.OFFERED;
  if (filter === 'done') return status === WorkStatus.COMPLETED;
  // «В работе»: после торгов и до завершения (без отказа)
  return (
    status !== WorkStatus.NEW &&
    status !== WorkStatus.OFFERED &&
    status !== WorkStatus.COMPLETED &&
    status !== WorkStatus.REJECTED
  );
}

function workKey(work: WorkInfo): string {
  return work.guid || work.cargo;
}

function activeOrdersLabel(count: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (count === 0) return t('activeNone');
  return t('active', { count });
}

interface WorksListProps {
  works: WorkInfo[];
  isLoading?: boolean;
  onWorkClick: (work: WorkInfo) => void;
  onRefresh?: () => Promise<void>;
  emptyTitle?: string;
  emptyHint?: string;
  variant?: 'feed' | 'simple';
}

function updatedLabel(at: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const mins = Math.floor((Date.now() - at) / 60000);
  if (mins < 1) return t('updatedNow');
  if (mins === 1) return t('updatedMin');
  const time = new Date(at).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' });
  return t('updatedAt', { time });
}

const WorksListInner: React.FC<WorksListProps> = ({
  works,
  isLoading = false,
  onWorkClick,
  onRefresh,
  emptyTitle,
  emptyHint,
  variant = 'simple',
}) => {
  const { t } = useTranslation('works');
  const resolvedEmptyTitle = emptyTitle || t('emptyAllTitle');
  const resolvedEmptyHint = emptyHint || t('emptyAllHint');
  const [filter, setFilter] = useState<FilterId>('all');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const waitingRefresh = useRef(false);

  const visible = useMemo(
    () =>
      variant === 'feed'
        ? works.filter((work) => matchesFilter(normalizeWorkStatus(work.status), filter))
        : works,
    [works, filter, variant]
  );

  const mapRoutes = useMemo(() => ordersToFeedRoutes(visible), [visible]);

  useEffect(() => {
    if (!waitingRefresh.current) return;
    waitingRefresh.current = false;
    setRefreshing(false);
    setUpdatedAt(Date.now());
  }, [works]);

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

  const list = (
    <>
      {isLoading && works.length === 0 ? (
        <div className={styles.loading}>{t('loading')}</div>
      ) : visible.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {works.length === 0 ? resolvedEmptyTitle : t('emptyFilterTitle')}
          </p>
          <p className={styles.emptyHint}>
            {works.length === 0 ? resolvedEmptyHint : t('emptyFilterHint')}
          </p>
        </div>
      ) : (
        visible.map((work) => (
          <WorkCard
            key={workKey(work)}
            work={work}
            mode="list"
            onClick={() => onWorkClick(work)}
          />
        ))
      )}
    </>
  );

  if (variant !== 'feed') {
    return <div className={styles.list}>{list}</div>;
  }

  return (
    <div className={`${styles.feed} ${view === 'map' ? styles.feedFill : ''}`} data-feed-view={view}>
      <header className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h1 className={styles.pageTitle}>{t('feedTitle')}</h1>
          <p className={styles.pageSub}>
            {activeOrdersLabel(works.length, t)} · {updatedLabel(updatedAt, t)}
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
              const work = visible.find(
                (item) => item.guid === routeId || item.cargo === routeId
              );
              if (work) onWorkClick(work);
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

          <div className={styles.list}>{list}</div>
        </>
      )}
    </div>
  );
};

export const WorksList = React.memo(WorksListInner);
