import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import {
  Banknote,
  Check,
  ChevronRight,
  FileText,
  LifeBuoy,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  Send,
  Star,
  Truck,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLoginStore } from '../../Store/loginStore';
import { intlLocale } from '../../i18n';
import { useTransportData } from '../../Store/transportStore';
import { useCompanyData } from '../../Store/companyStore';
import { useAccountData } from '../../Store/accountStore';
import { isExecutorRole } from '../../Store/roles';
import { PanelFrame } from '../../layout/PanelFrame';
import styles from './HomePage.module.css';

type ActivityItem = {
  id: string;
  title: string;
  time: string;
  icon: LucideIcon;
};

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 'delivered', title: 'actDelivered', time: 'time2h', icon: PackageCheck },
  { id: 'payout', title: 'actPayout', time: 'time3h', icon: Banknote },
  { id: 'message', title: 'actMessage', time: 'time5h', icon: MessageCircle },
  { id: 'offer', title: 'actOffer', time: 'timeYesterday', icon: Send },
];

export const HomePage: React.FC = () => {
  const { t } = useTranslation('home');
  const history = useHistory();
  const name = useLoginStore((s) => s.name);
  const userType = useLoginStore((s) => s.user_type);
  const ratings = useLoginStore((s) => s.ratings);
  const accountData = useAccountData();
  const transport = useTransportData();
  const company = useCompanyData();

  const isCarrier = isExecutorRole(userType);
  const displayName = name?.trim() || 'Пользователь';

  const checklist = useMemo(() => {
    const items = [
      {
        id: 'verified',
        label: t('checkBalance'),
        done: Boolean(company?.is_verified),
        icon: Wallet,
        path: '/finance',
      },
      {
        id: 'sts',
        label: t('checkSts'),
        done: Boolean(transport?.sts || transport?.image),
        icon: FileText,
        path: '/vehicles',
        roles: [2, 3],
      },
      {
        id: 'transport',
        label: t('checkTransport'),
        done: Boolean(transport?.name || transport?.license_plate || transport?.number),
        icon: Truck,
        path: '/vehicles',
        roles: [2, 3],
      },
      {
        id: 'address',
        label: isCarrier ? t('checkAddressCarrier') : t('checkAddressCustomer'),
        done: isCarrier
          ? Boolean(transport?.name)
          : Boolean(company?.name || company?.tax_number),
        icon: MapPin,
        path: '/profile',
      },
    ];
    return items.filter((i) => !i.roles || i.roles.includes(userType));
  }, [transport, company, isCarrier, userType, t]);

  const doneCount = checklist.filter((i) => i.done).length;
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;
  const needsFill = progress < 100;

  const activeOrders = ratings?.orders ?? 0;
  const earnings = Number(accountData?.monthIncome ?? 0);
  const pendingPayout = isCarrier
    ? Number(accountData?.upcomingIncome ?? 0)
    : Number(accountData?.remainingToPay ?? 0);
  const rate = ratings?.rate ?? 0;
  const tripCount = ratings?.invoices ?? ratings?.orders ?? 0;
  const reviewHint = tripCount ? t('reviews', { count: tripCount }) : t('noTrips');

  return (
    <PanelFrame title={t('welcome', { name: displayName })} bare>
      <div className={styles.page}>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <span className={styles.statLabel}>
                {isCarrier ? t('activeTrips') : t('activeOrders')}
              </span>
              <span className={styles.trendBadge}>{t('weekTrend')}</span>
            </div>
            <div className={styles.statValue}>{activeOrders}</div>
            <div className={styles.spark} aria-hidden />
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <span className={styles.statLabel}>
                {isCarrier ? t('monthEarnings') : t('monthPaid')}
              </span>
            </div>
            <div className={styles.statValue}>
              {earnings.toLocaleString(intlLocale())} ₽
            </div>
            <div className={styles.statSub}>
              {isCarrier
                ? t('pendingPayout', { amount: `${pendingPayout.toLocaleString(intlLocale())} ₽` })
                : t('remainingDue', { amount: `${pendingPayout.toLocaleString(intlLocale())} ₽` })}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <span className={styles.statLabel}>
                {isCarrier ? t('carrierRating') : t('customerRating')}
              </span>
            </div>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{rate ? rate.toFixed(1) : '—'}</span>
              <span className={styles.stars} aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(rate) ? '#f5a524' : 'none'}
                    color="#f5a524"
                    strokeWidth={1.5}
                  />
                ))}
              </span>
            </div>
            <div className={styles.statSub}>{reviewHint}</div>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>{t('recent')}</h2>
                <p className={styles.cardSub}>{t('recentSub')}</p>
              </div>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => history.push('/feed')}
              >
                {t('all', { ns: 'common' })}
              </button>
            </div>
            <ul className={styles.activityList}>
              {DEMO_ACTIVITY.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className={styles.activityItem}>
                    <span className={styles.activityIcon}>
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className={styles.activityTitle}>{t(item.title)}</span>
                    <span className={styles.activityTime}>{t(item.time)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className={styles.sideCol}>
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>{t('profileStatus')}</h2>
                {needsFill && (
                  <span className={styles.warnBadge}>{t('needsFill')}</span>
                )}
              </div>

              <div className={styles.progressBlock}>
                <div className={styles.progressLabel}>
                  <span>{t('profileReady')}</span>
                  <span>{progress}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <p className={styles.progressHint}>
                  {t('profileSteps', { done: doneCount, total: checklist.length })}
                </p>
              </div>

              <ul className={styles.checkList}>
                {checklist.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`${styles.checkItem} ${item.done ? styles.done : ''}`}
                        onClick={() => history.push(item.path)}
                      >
                        <span className={styles.checkIcon}>
                          <Icon size={18} strokeWidth={1.75} />
                        </span>
                        <span className={styles.checkLabel}>{item.label}</span>
                        {item.done ? (
                          <span className={styles.doneBadge}>
                            <Check size={12} strokeWidth={2.5} />
                            {t('ready', { ns: 'common' })}
                          </span>
                        ) : (
                          <ChevronRight size={18} className={styles.chevron} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>{t('quick')}</h2>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => history.push('/feed')}
                >
                  <Search size={18} strokeWidth={1.75} />
                  {isCarrier ? t('findCargo') : t('createOrder')}
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() => history.push('/finance')}
                >
                  <Wallet size={18} strokeWidth={1.75} />
                  {t('finance', { ns: 'nav' })}
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() => history.push('/documents')}
                >
                  <FileText size={18} strokeWidth={1.75} />
                  {t('myDocs')}
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() => history.push('/support')}
                >
                  <LifeBuoy size={18} strokeWidth={1.75} />
                  {t('support')}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
};

export default HomePage;
