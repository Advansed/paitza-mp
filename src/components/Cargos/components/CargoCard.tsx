import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { IonIcon, IonText } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import {
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Users,
} from 'lucide-react';
import { formatters, statusUtils } from '../../../utils/utils';
import { CargoInfo, CargoStatus } from '../../../Store/cargoStore';
import { cargoFeedKind, cargoFeedLabel, resolveCargoProgressStatus } from '../cargoStatusFlow';
import {
  PAYMENT_LABEL,
  fleetHint,
  formatQty,
  getPaymentLevel,
  offersLabel,
  publishedDateTime,
  resolveBodyType,
  resolvePublishedAt,
  routeDistanceKm,
  shortDate,
  type PaymentLevel,
} from '../../Works/feedFormat';
import styles from './CargoCard.module.css';
import feedStyles from '../../Works/components/WorkCard.module.css';

function getCargoCompanyName(cargo: CargoInfo, companyName?: string | null): string {
    return cargo.company?.name || companyName || cargo.client || '';
}

interface CargoCardProps {
    cargo: CargoInfo;
    mode?: 'view' | 'list';
    selected?: boolean;
    onSelect?: (cargo: CargoInfo) => void;
    companyName?: string | null;
}

const SURFACE_BY_STATUS: Record<CargoStatus, string> = {
    [CargoStatus.NEW]: styles.surfaceNew,
    [CargoStatus.WAITING]: styles.surfaceWaiting,
    [CargoStatus.HAS_ORDERS]: styles.surfaceHasOrders,
    [CargoStatus.ACCEPTED]: styles.surfaceAccepted,
    [CargoStatus.WAIT_LOAD]: styles.surfaceWaitLoad,
    [CargoStatus.LOADING]: styles.surfaceLoading,
    [CargoStatus.HAS_LOADED]: styles.surfaceHasLoaded,
    [CargoStatus.IN_TRANSIT]: styles.surfaceInTransit,
    [CargoStatus.HAS_DELIVERED]: styles.surfaceHasDelivered,
    [CargoStatus.UNLOADING]: styles.surfaceUnloading,
    [CargoStatus.WAIT_COMPLETE]: styles.surfaceWaitComplete,
    [CargoStatus.COMPLETED]: styles.surfaceCompleted,
    [CargoStatus.PROBLEMS]: styles.surfaceProblems,
};

const LIGHT_CLASS: Record<PaymentLevel, string> = {
    full: feedStyles.light_full,
    partial: feedStyles.light_partial,
    none: feedStyles.light_none,
};

const PAY_CLASS: Record<PaymentLevel, string> = {
    full: feedStyles.pay_full,
    partial: feedStyles.pay_partial,
    none: feedStyles.pay_none,
};

const BADGE_CLASS: Record<ReturnType<typeof cargoFeedKind>, string> = {
    new: feedStyles.badgeNew,
    waiting: feedStyles.badgeNew,
    bids: feedStyles.badgeBids,
    work: feedStyles.badgeWork,
    done: feedStyles.badgeDone,
    alert: feedStyles.badgeAlert,
};

function cargoFleet(cargo: CargoInfo): string | null {
    const invoices = cargo.invoices ?? [];
    const total = Number(cargo.vehicles_total) || (invoices.length > 1 ? invoices.length : 0);
    if (total <= 1) return null;
    const busy =
        cargo.vehicles_busy != null
            ? Number(cargo.vehicles_busy)
            : invoices.filter((invoice) => invoice.status && invoice.status !== 'Заказано').length;
    return fleetHint({ vehicles_total: total, vehicles_busy: busy });
}

const CargoCardInner: React.FC<CargoCardProps> = ({
    cargo,
    mode = 'list',
    selected,
    onSelect,
    companyName: companyLabel,
}) => {
    const { t } = useTranslation('cargos');
    const status = resolveCargoProgressStatus(cargo);

    const handleClick = () => {
        onSelect?.(cargo);
    };

    const publishedAt = resolvePublishedAt(cargo);

    // Теги под статусом (используются и в view, и в list)
    const tags: Array<{ text: string; className: string }> = [];

    // Гарантированная оплата (если есть предоплата)
    if (cargo.advance > 0) {
        const isFullAdvance = cargo.advance >= cargo.price;
        tags.push({
            text: 'Гарантированная оплата',
            className: isFullAdvance
                ? `${styles.tag} ${styles.tagGreen}`
                : `${styles.tag} ${styles.tagOrange}`
        });
    }

    // Застраховано
    if (cargo.insurance > 0) {
        tags.push({
            text: 'Застраховано',
            className: `${styles.tag} ${styles.tagGreen}`
        });
    }

    // Несколько водителей (если больше одного предложения)
    if (cargo.invoices && cargo.invoices.length > 1) {
        tags.push({
            text: 'Несколько водителей',
            className: `${styles.tag} ${styles.tagPurple}`
        });
    }

    if (status === CargoStatus.PROBLEMS) {
        tags.push({
            text: 'Проблемы',
            className: `${styles.tag} ${styles.tagBargain}`
        });
    }

    const CardInner = (
        <>
            {/* Верхняя строка: статус, ID, цена */}
            <div className={styles.topRow}>
                <div className={styles.topLeft}>
                    <div className={getCircle(cargo)}></div>
                    <div className={'ml-05 ' + statusUtils.getClassName(status)}>
                        {status}
                    </div>
                    <IonText className="ml-1 fs-07 cl-gray">
                        {'ID: ' + formatters.shortId(cargo.guid)}
                    </IonText>
                </div>
                <div className={styles.topRight}>
                    <IonText className="fs-09 cl-prim">
                        <b>{formatters.currency(cargo.price)}</b>
                    </IonText>
                    {mode === 'view' && (
                        <div className="fs-08 cl-black">
                            <b>{formatters.weight(cargo.weight, cargo.weight1)}</b>
                        </div>
                    )}
                </div>
            </div>

            {publishedAt && (
                <div className={styles.publishedRow} title={publishedDateTime(publishedAt)}>
                    <span className={styles.publishedLabel}>{t('publishedLabel', { defaultValue: 'Опубликовано' })}</span>
                    <span className={styles.publishedValue}>{publishedDateTime(publishedAt)}</span>
                </div>
            )}

            {/* Вторая строка: теги */}
            {tags.length > 0 && (
                <div className={styles.tagsRow}>
                    {tags.map((tag, index) => (
                        <span key={index} className={tag.className}>
                            {tag.text}
                        </span>
                    ))}
                </div>
            )}

            {/* Название груза */}
            <div className="fs-09 mt-05 cl-black">
                <b>{cargo.name}</b>
            </div>

            {/* Блок маршрута в две строки */}
            <div className={styles.routeSection + ' mt-05'}>
                {/* Откуда + дата загрузки */}
                <div className={styles.routeRow}>
                    <div className={styles.routeLeft}>
                        <IonIcon icon={locationOutline} className={`${styles.routeIcon} ${styles.routeIconGreen}`} />
                        <div className={styles.routeTextGroup}>
                            <span className={styles.routeLabel}>Откуда:</span>
                            <span className={styles.routeCity}>
                                {cargo.address?.city.city || 'Не указано'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.routeRight}>
                        <div>
                            <span className={styles.routeDateLabel}>Дата загрузки:</span>
                        </div>
                        
                        <div>
                            <span className={styles.routeDateValue}>
                                {formatters.date(cargo.pickup_date || '')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Куда + дата выгрузки */}
                <div className={styles.routeRow}>
                    <div className={styles.routeLeft}>
                        <IonIcon icon={locationOutline} className={`${styles.routeIcon} ${styles.routeIconRed}`} />
                        <div className={styles.routeTextGroup}>
                            <span className={styles.routeLabel}>Куда:</span>
                            <span className={styles.routeCity}>
                                {cargo.destiny?.city.city || 'Не указано'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.routeRight}>
                        <div>
                            <span className={styles.routeDateLabel}>Дата выгрузки:</span>
                        </div>
                        <div>
                            <span className={styles.routeDateValue}>
                                {formatters.date(cargo.delivery_date || '')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Детали груза */}
            <div className={styles.cargoDetails + ' mt-05'}>
                <div className={styles.cargoDetailsTitle}>Детали груза:</div>
                <div className={styles.cargoDetailsList}>
                    <div className={styles.cargoDetailItem}>
                        Вес (т): <span className={styles.cargoDetailValue}>{cargo.weight}</span>
                    </div>
                    <div className={styles.cargoDetailItem}>
                        Объем (м³): <span className={styles.cargoDetailValue}>{cargo.volume}</span>
                    </div>
                </div>
                {cargo.description && (
                    <div className={styles.cargoDescription}>
                        {cargo.description}
                    </div>
                )}
            </div>
        </>
    );

    const surfaceClass = `${styles.cardSurface} ${SURFACE_BY_STATUS[status] ?? styles.surfaceNew}`;

    if (mode === 'view') {
        return (
            <div className={`cr-card cargo-card-view ${surfaceClass}`}>
                {CardInner}
            </div>
        );
    }

    const kind = cargoFeedKind(status);
    const fromCity = cargo.address?.city?.city || 'Не указано';
    const toCity = cargo.destiny?.city?.city || 'Не указано';
    const distance = routeDistanceKm(cargo);
    const offers = cargo.invoices?.length ?? 0;
    const payment = getPaymentLevel(cargo);
    const bodyType = resolveBodyType(cargo);
    const companyName = getCargoCompanyName(cargo, companyLabel);
    const publishedLabel = publishedAt ? publishedDateTime(publishedAt) : '';
    const pickup = shortDate(cargo.pickup_date);
    const delivery = shortDate(cargo.delivery_date);
    const fleet = cargoFleet(cargo);

    return (
        <button
            type="button"
            className={`${feedStyles.feedCard} ${selected ? feedStyles.feedCardSelected : ''}`}
            onClick={handleClick}
        >
            <div className={`${feedStyles.light} ${LIGHT_CLASS[payment]}`} aria-hidden>
                <span className={feedStyles.lamp} />
                <span className={feedStyles.lamp} />
                <span className={feedStyles.lamp} />
            </div>

            <div className={feedStyles.feedBody}>
                <div className={feedStyles.feedTop}>
                    <span className={`${feedStyles.feedBadge} ${BADGE_CLASS[kind]}`}>
                        {cargoFeedLabel(status)}
                    </span>
                    <span className={feedStyles.feedId}>ЗК-{formatters.shortId(cargo.guid)}</span>
                    <div className={feedStyles.feedPriceCol}>
                        <span className={feedStyles.feedPrice}>{formatters.currency(cargo.price)}</span>
                        <span className={`${feedStyles.payBadge} ${PAY_CLASS[payment]}`}>
                            <span className={feedStyles.payDot} />
                            {PAYMENT_LABEL[payment]}
                        </span>
                    </div>
                </div>

                <h3 className={feedStyles.feedTitle}>{cargo.name || 'Без названия'}</h3>

                {companyName && (
                    <div className={feedStyles.feedCompany}>
                        <Building2 size={15} strokeWidth={1.75} aria-hidden />
                        <span className={feedStyles.feedCompanyName}>{companyName}</span>
                        {(Boolean(cargo.company) || Boolean(companyLabel)) && (
                            <BadgeCheck size={15} strokeWidth={2} className={feedStyles.verified} aria-label="Проверено" />
                        )}
                    </div>
                )}

                <div className={feedStyles.feedRoute}>
                    <MapPin size={15} strokeWidth={1.75} aria-hidden />
                    <span>
                        {fromCity} → {toCity}
                    </span>
                    {distance != null && <span className={feedStyles.feedKm}>· {distance} км</span>}
                </div>

                {(publishedLabel || pickup || delivery) && (
                    <div className={feedStyles.feedDates}>
                        {publishedLabel && (
                            <span>
                                <Clock size={14} strokeWidth={1.75} aria-hidden />
                                {t('published', { date: publishedLabel })}
                            </span>
                        )}
                        {pickup && (
                            <span>
                                <Calendar size={14} strokeWidth={1.75} aria-hidden />
                                {t('departure', { date: pickup })}
                            </span>
                        )}
                        {delivery && (
                            <span>
                                <Calendar size={14} strokeWidth={1.75} aria-hidden />
                                {t('delivery', { date: delivery })}
                            </span>
                        )}
                    </div>
                )}

                {fleet && (
                    <div className={feedStyles.fleet}>
                        <Truck size={14} strokeWidth={1.75} aria-hidden />
                        {fleet}
                    </div>
                )}

                <div className={feedStyles.feedMeta}>
                    {bodyType && (
                        <span>
                            <Truck size={14} strokeWidth={1.75} aria-hidden />
                            {bodyType}
                        </span>
                    )}
                    <span>
                        {formatQty(cargo.weight)} т · {formatQty(cargo.volume)} м³
                    </span>
                    {offers > 0 && (
                        <span className={feedStyles.feedOffers}>
                            <Users size={14} strokeWidth={1.75} aria-hidden />
                            {offersLabel(offers)}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

export const CargoCard = memo(CargoCardInner);

function getCircle( cargo: CargoInfo) {
   if(cargo.advance === cargo.price) return 'circle-1'
   if(cargo.advance !== 0 ) return 'circle-2'
   return 'circle-3'
}
