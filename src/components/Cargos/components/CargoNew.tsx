import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  Cpu,
  FileText,
  GlassWater,
  Lock,
  MapPin,
  Navigation,
  Package,
  Plus,
  Trash2,
  Phone,
  Shield,
  ShieldCheck,
  ShieldOff,
  Snowflake,
  Truck,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import {
  buildCargoRoute,
  CargoInfo,
  CargoRoutePoint,
  EMPTY_CARGO,
  hasRouteCoords,
  normalizeCargoRoute,
} from '../../../Store/cargoStore';
import { useLoginStore, useToken } from '../../../Store/loginStore';
import { api } from '../../../Store/api';
import {
  resolveTransportTypeId,
  toTransportTypeId,
  transportTypeLabel,
  useTransportTypes,
} from '../../../Store/transportStore';
import { useSocket } from '../../../Store/useSocket';
import { CityField } from '../../DataEditor/fields/СityField';
import { AddressField } from '../../DataEditor/fields/AddressField';
import Maps from '../../Maps/Maps';
import { fetchDrivingDistanceKm } from '../../Maps/services/googleMapServices';
import { geocodeAddress } from '../../../utils/googlePlaces';
import { getPaymentLevel, type PaymentLevel } from '../../Works/feedFormat';
import { companyGetters, useCompanyStore } from '../../../Store/companyStore';
import { moneySign } from '../../../utils/utils';
import { OrganizationRequiredModal } from '../../OrganizationRequiredModal';
import styles from './CargoNew.module.css';

function coordString(lat?: number | null, lon?: number | null): { lat: string; lon: string } {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo) || (la === 0 && lo === 0)) {
    return { lat: '', lon: '' };
  }
  return { lat: String(la), lon: String(lo) };
}

function resolvePointCoords(point?: {
  lat?: number;
  lon?: number;
  city?: { lat?: number; lon?: number };
} | null): { lat: number; lon: number } | null {
  const lat = Number(point?.lat || point?.city?.lat);
  const lon = Number(point?.lon || point?.city?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

interface CargoNewProps {
  cargo: CargoInfo;
  onBack: () => void;
  onUpdate: (guid: string, data: CargoInfo) => Promise<boolean>;
  onCreate: (data: CargoInfo) => Promise<boolean>;
}

type InsuranceKind = 'none' | 'simple' | 'fragile' | 'tech';

const FALLBACK_BODY_TYPES: Array<{ name: string; descKey: string; Icon: typeof Truck }> = [
  { name: 'Тент', descKey: 'bodyDescTent', Icon: Truck },
  { name: 'Рефрижератор', descKey: 'bodyDescReefer', Icon: Snowflake },
  { name: 'Фургон', descKey: 'bodyDescVan', Icon: Box },
  { name: 'Бортовой', descKey: 'bodyDescFlatbed', Icon: Package },
];

const ESCROW_OPTIONS: Array<{
  id: PaymentLevel;
  shortKey: string;
  descKey: string;
  light: 'green' | 'yellow' | 'red';
}> = [
  { id: 'full', shortKey: 'escrowFull', descKey: 'escrowFullDesc', light: 'green' },
  { id: 'partial', shortKey: 'escrowPartial', descKey: 'escrowPartialDesc', light: 'yellow' },
  { id: 'none', shortKey: 'escrowNone', descKey: 'escrowNoneDesc', light: 'red' },
];

const INSURANCE_OPTIONS: Array<{
  id: InsuranceKind;
  labelKey: string;
  descKey: string;
  rate: number;
  Icon: typeof Box;
}> = [
  { id: 'none', labelKey: 'insNone', descKey: 'insNoneDesc', rate: 0, Icon: ShieldOff },
  { id: 'simple', labelKey: 'insSimple', descKey: 'insSimpleDesc', rate: 1, Icon: Box },
  { id: 'fragile', labelKey: 'insFragile', descKey: 'insFragileDesc', rate: 2, Icon: GlassWater },
  { id: 'tech', labelKey: 'insTech', descKey: 'insTechDesc', rate: 3, Icon: Cpu },
];

const formatDateForInput = (dateString: string): string => {
  if (!dateString || dateString.length < 10) return '';
  return dateString.slice(0, 10);
};

const formatNumber = (value: number | string): string => {
  if (!value && value !== 0) return '';
  const numStr = String(value).replace(/\s/g, '');
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const unformatNumber = (value: string): number => {
  return Number(value.replace(/\s/g, '')) || 0;
};

const numberToDecimalDraft = (n: number | undefined): string => {
  if (n === undefined || n === null || Number.isNaN(n) || n === 0) return '';
  return String(n).replace('.', ',');
};

const normalizeDecimalInput = (raw: string): string => {
  let v = raw.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const firstComma = v.indexOf(',');
  if (firstComma !== -1) {
    v = v.slice(0, firstComma + 1) + v.slice(firstComma + 1).replace(/,/g, '');
  }
  return v;
};

const parseDecimalDraft = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/\s/g, '');
  if (normalized === '' || normalized === '.' || normalized === '-') return 0;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
};

const resolveInsuranceKind = (cargo: CargoInfo): InsuranceKind => {
  const cost = Number(cargo.cost) || 0;
  const premium = Number(cargo.insurance) || 0;
  if (!premium) return 'none';
  if (!cost) return 'simple';
  const rate = Math.round((premium / cost) * 100);
  if (rate >= 3) return 'tech';
  if (rate >= 2) return 'fragile';
  return 'simple';
};

export const CargoNew: React.FC<CargoNewProps> = ({
  cargo: initialCargo,
  onBack,
  onUpdate,
  onCreate,
}) => {
  const { t, i18n } = useTranslation('cargos');
  const userName = useLoginStore((state) => state.name);
  const userPhone = useLoginStore((state) => state.phone);
  const history = useHistory();
  const companyData = useCompanyStore((state) => state.data);
  const basic = companyData?.plan !== 'pro';
  const companyCurrency = (companyData?.currency || 'RUB').toUpperCase();
  const moneyMark = moneySign(companyCurrency);
  const numberLocale = i18n.language?.startsWith('zh')
    ? 'zh-CN'
    : i18n.language?.startsWith('en')
      ? 'en-US'
      : 'ru-RU';
  const companyLoading = useCompanyStore((state) => state.isLoading);
  const organizationRequired = useMemo(
    () => !companyLoading && companyGetters.getCompletionPercentage() < 80,
    [companyData, companyLoading]
  );
  const token = useToken();
  const { emit } = useSocket();
  const transportTypes = useTransportTypes();

  useEffect(() => {
    if (transportTypes.length || !token) return;
    emit('get_transport_types', { token });
  }, [transportTypes.length, token, emit]);

  const [info, setInfo] = useState<CargoInfo>(initialCargo || { ...EMPTY_CARGO });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightDraft, setWeightDraft] = useState(() =>
    numberToDecimalDraft(initialCargo?.weight)
  );
  const [volumeDraft, setVolumeDraft] = useState(() =>
    numberToDecimalDraft(initialCargo?.volume)
  );
  const [escrow, setEscrow] = useState<PaymentLevel>(() =>
    getPaymentLevel(initialCargo || EMPTY_CARGO)
  );
  const [escrowHeld, setEscrowHeld] = useState(() => Number(initialCargo?.advance) || 0);
  const [insuranceKind, setInsuranceKind] = useState<InsuranceKind>(() =>
    resolveInsuranceKind(initialCargo || EMPTY_CARGO)
  );
  const [transportTypeId, setTransportTypeId] = useState(() =>
    resolveTransportTypeId(
      initialCargo?.transport_type,
      [],
      initialCargo?.body_type
    )
  );
  const [capacityT, setCapacityT] = useState('');
  const [docs, setDocs] = useState<File[]>([]);
  const [endpointIds, setEndpointIds] = useState<{ pickup?: string; delivery?: string }>({});

  const isEdit = Boolean(initialCargo?.guid);
  const cargoGuid = initialCargo?.guid;

  const bodyTypes = useMemo(
    () =>
      transportTypes.map((type) => {
        const ruName = (type.ru || type.name || '').toLowerCase();
        const fallback = FALLBACK_BODY_TYPES.find(
          (item) => item.name.toLowerCase() === ruName
        );
        return {
          id: type.id,
          name: transportTypeLabel(type, i18n.language),
          /** Русский канон для body_type / 1С */
          nameRu: type.ru || type.name,
          desc:
            type.description ||
            (fallback ? t(fallback.descKey) : t('bodyTypeFallback')),
          Icon: fallback?.Icon || Truck,
        };
      }),
    [transportTypes, t, i18n.language]
  );

  useEffect(() => {
    if (!bodyTypes.length) return;
    setTransportTypeId((prev) => {
      if (prev && bodyTypes.some((type) => type.id === prev)) return prev;
      const fromCargo = resolveTransportTypeId(
        cargoGuid ? initialCargo?.transport_type : undefined,
        transportTypes,
        cargoGuid ? initialCargo?.body_type : undefined
      );
      return fromCargo || bodyTypes[0].id;
    });
  }, [bodyTypes, transportTypes, cargoGuid, initialCargo]);

  useEffect(() => {
    if (cargoGuid) {
      const normalized = normalizeCargoRoute(initialCargo);
      setEndpointIds({
        pickup: normalized.route.find((point) => point.point_type === 'pickup')?.id,
        delivery: normalized.route.find((point) => point.point_type === 'delivery')?.id,
      });
      setInfo({
        ...normalized,
        route: normalized.route.filter((point) => point.point_type === 'waypoint'),
      });
      setWeightDraft(numberToDecimalDraft(initialCargo.weight));
      setVolumeDraft(numberToDecimalDraft(initialCargo.volume));
      setEscrow(getPaymentLevel(initialCargo));
      setEscrowHeld(Number(initialCargo.advance) || 0);
      setInsuranceKind(resolveInsuranceKind(initialCargo));
      setTransportTypeId(
        resolveTransportTypeId(
          initialCargo.transport_type,
          transportTypes,
          initialCargo.body_type
        )
      );
      setCapacityT('');
      setDocs([]);
    } else {
      setInfo({
        ...EMPTY_CARGO,
        face: userName || '',
        phone: userPhone || '',
      });
      setWeightDraft('');
      setVolumeDraft('');
      setEscrow('full');
      setEscrowHeld(0);
      setInsuranceKind('none');
      setTransportTypeId(bodyTypes[0]?.id || '');
      setEndpointIds({});
      setCapacityT('');
      setDocs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on cargo switch
  }, [cargoGuid]);

  useEffect(() => {
    if (!cargoGuid) return;
    let cancelled = false;
    const run = async () => {
      const normalized = normalizeCargoRoute(initialCargo);
      const filled: CargoRoutePoint[] = [];
      for (const point of normalized.route) {
        if (hasRouteCoords(point.lat, point.lon)) {
          filled.push(point);
          continue;
        }
        const query = [point.address, point.city].filter(Boolean).join(', ');
        const place = query ? await geocodeAddress(query) : null;
        if (cancelled) return;
        filled.push(
          place
            ? { ...point, lat: place.lat, lon: place.lon, address: point.address || place.label }
            : point
        );
      }
      if (cancelled) return;
      const next = normalizeCargoRoute({ ...normalized, route: filled });
      setInfo((prev) => {
        if ((prev.guid || '') !== cargoGuid) return prev;
        const keep = <T extends { lat?: number; lon?: number }>(current: T, incoming: T) =>
          hasRouteCoords(current?.lat, current?.lon) ? current : incoming;
        const incomingVia = next.route.filter((point) => point.point_type === 'waypoint');
        return {
          ...prev,
          address: keep(prev.address, next.address),
          destiny: keep(prev.destiny, next.destiny),
          route: (prev.route || []).map((point, index) => {
            if (hasRouteCoords(point.lat, point.lon)) return point;
            const match = incomingVia[index];
            return match && hasRouteCoords(match.lat, match.lon)
              ? { ...point, lat: match.lat, lon: match.lon, address: point.address || match.address }
              : point;
          }),
        };
      });
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geocode saved points once per order
  }, [cargoGuid]);

  useEffect(() => {
    if (cargoGuid) return;
    if (!userName && !userPhone) return;
    setInfo((prev) => ({
      ...prev,
      face: prev.face || userName || '',
      phone: prev.phone || userPhone || '',
    }));
  }, [userName, userPhone, cargoGuid]);

  const cargoCost = Number(info.cost) || 0;
  const haulPrice = Number(info.price) || 0;
  const insuranceRate =
    INSURANCE_OPTIONS.find((item) => item.id === insuranceKind)?.rate ?? 0;
  const fmtMoney = (value: number) =>
    new Intl.NumberFormat(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  const fmtRate = (value: number) =>
    new Intl.NumberFormat(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  const fmtDate = (value: string | undefined) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(numberLocale);
  };
  const insurancePremium =
    insuranceKind === 'none' || insuranceRate <= 0
      ? 0
      : Math.round((cargoCost * insuranceRate) / 100);
  const totalWithInsurance = haulPrice + insurancePremium;
  const escrowPercent =
    haulPrice > 0 && escrowHeld > 0
      ? Math.round((Math.min(escrowHeld, haulPrice) / haulPrice) * 100)
      : 0;

  useEffect(() => {
    if (escrow === 'full') setEscrowHeld(haulPrice);
    if (escrow === 'none') setEscrowHeld(0);
  }, [escrow, haulPrice]);

  const routeStops = [
    {
      kind: 'pickup' as const,
      city: info.address?.city?.city || '',
      address: info.address?.address || '',
      lat: Number(info.address?.lat) || Number(info.address?.city?.lat) || 0,
      lon: Number(info.address?.lon) || Number(info.address?.city?.lon) || 0,
    },
    ...(info.route || [])
      .filter((point) => point.point_type === 'waypoint')
      .map((point) => ({
        kind: 'waypoint' as const,
        city: point.city || '',
        address: point.address || '',
        lat: Number(point.lat) || 0,
        lon: Number(point.lon) || 0,
      })),
    {
      kind: 'delivery' as const,
      city: info.destiny?.city?.city || '',
      address: info.destiny?.address || '',
      lat: Number(info.destiny?.lat) || Number(info.destiny?.city?.lat) || 0,
      lon: Number(info.destiny?.lon) || Number(info.destiny?.city?.lon) || 0,
    },
  ];
  const routeSignature = routeStops
    .map((stop) => `${stop.kind}\u001f${stop.city}\u001f${stop.address}\u001f${stop.lat}\u001f${stop.lon}`)
    .join('\u001e');

  useEffect(() => {
    const stops = routeStops;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const resolved: Array<{ kind: string; lat: number; lon: number } | null> = [];
        for (const stop of stops) {
          if (cancelled) return;
          const query = [stop.address, stop.city].filter((part) => part.trim()).join(', ');
          let coords = resolvePointCoords(stop);
          // Геокод по городу или улице (≥3) — иначе при edit город без адреса не резолвится
          const canGeocode = stop.city.trim().length > 0 || stop.address.trim().length >= 3;
          if (canGeocode && query) {
            const place = await geocodeAddress(query);
            if (cancelled) return;
            if (place) coords = { lat: place.lat, lon: place.lon };
          }
          resolved.push(coords ? { kind: stop.kind, lat: coords.lat, lon: coords.lon } : null);
        }
        if (cancelled) return;
        const chain = resolved.filter((point): point is { kind: string; lat: number; lon: number } => Boolean(point));
        if (chain.length < 2) {
          // Не затираем сохранённый route_distance (иначе калькулятор в edit молчит)
          return;
        }
        const [from, ...rest] = chain;
        const to = rest[rest.length - 1];
        const via = rest.slice(0, -1);
        const km = await fetchDrivingDistanceKm(from, to, via);
        if (cancelled) return;
        const next = km;
        setInfo((prev) => {
          // При null от Directions сохраняем прежние км
          const effectiveDistance = next == null ? prev.route_distance : next;
          const sameDistance =
            effectiveDistance == null
              ? prev.route_distance == null
              : prev.route_distance === effectiveDistance;
          const applyCoord = (currentLat?: number, currentLon?: number, nextPoint?: { lat: number; lon: number } | null) => {
            if (!nextPoint) return { lat: currentLat || 0, lon: currentLon || 0, changed: false };
            const changed =
              Math.abs((Number(currentLat) || 0) - nextPoint.lat) > 0.0001 ||
              Math.abs((Number(currentLon) || 0) - nextPoint.lon) > 0.0001;
            return changed
              ? { lat: nextPoint.lat, lon: nextPoint.lon, changed: true }
              : { lat: Number(currentLat) || 0, lon: Number(currentLon) || 0, changed: false };
          };
          const pickup = applyCoord(prev.address?.lat, prev.address?.lon, resolved[0]);
          const delivery = applyCoord(prev.destiny?.lat, prev.destiny?.lon, resolved[resolved.length - 1]);
          let viaIndex = 0;
          let viaChanged = false;
          const route = (prev.route || []).map((point) => {
            if (point.point_type !== 'waypoint') return point;
            const found = resolved[1 + viaIndex];
            viaIndex += 1;
            const coords = applyCoord(point.lat, point.lon, found);
            if (!coords.changed) return point;
            viaChanged = true;
            return { ...point, lat: coords.lat, lon: coords.lon };
          });
          if (sameDistance && !pickup.changed && !delivery.changed && !viaChanged) return prev;
          return {
            ...prev,
            route_distance: effectiveDistance == null ? undefined : effectiveDistance,
            address: prev.address ? { ...prev.address, lat: pickup.lat, lon: pickup.lon } : prev.address,
            destiny: prev.destiny ? { ...prev.destiny, lat: delivery.lat, lon: delivery.lon } : prev.destiny,
            route,
          };
        });
      })();
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [routeSignature]);

  const activeBody =
    bodyTypes.find((item) => item.id === transportTypeId) || bodyTypes[0];

  const selectedTransportType = transportTypes.find((type) => type.id === transportTypeId);
  const routeKm = Number(info.route_distance) > 0 ? Number(info.route_distance) : null;
  const formula = Number(selectedTransportType?.formula);
  const hasTariffs =
    Number.isFinite(Number(selectedTransportType?.min_tarif)) &&
    Number.isFinite(Number(selectedTransportType?.max_tarif));
  const hintNum = (n: number | null | undefined) => {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return '—';
    return String(v).replace('.', ',');
  };
  const priceHint =
    formula === 1 && hasTariffs && !(Number(info.weight) > 0 && routeKm)
      ? t('hintNeedWeightRoute')
      : formula === 2 && hasTariffs && !routeKm
        ? t('hintNeedRoute')
        : null;

  const formulaLabel =
    formula === 1 ? t('formulaWeight') : formula === 2 ? t('formulaKm') : '—';

  const [serverQuote, setServerQuote] = useState<{
    min: number;
    target: number;
    max: number;
    currency: string;
    rate?: number;
    rateDate?: string;
    urbanApplied?: boolean;
    urbanCoef?: number;
  } | null>(null);

  useEffect(() => {
    if (!token || !transportTypeId || !routeKm) {
      setServerQuote(null);
      return;
    }
    if (formula === 1 && !(Number(info.weight) > 0)) {
      setServerQuote(null);
      return;
    }
    let cancelled = false;
    // /api2/ уже проксируется в /api/ на бэке — без лишнего префикса api/
    api('pricing/calculate', {
      token,
      transportTypeId,
      distanceKm: routeKm,
      weight: info.weight,
    })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        if (
          res?.success &&
          data &&
          Number.isFinite(Number(data.min)) &&
          Number.isFinite(Number(data.target)) &&
          Number.isFinite(Number(data.max))
        ) {
          setServerQuote(data);
        } else {
          setServerQuote(null);
        }
      })
      .catch(() => {
        if (!cancelled) setServerQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, transportTypeId, routeKm, info.weight, formula]);

  const buildCargo = (): CargoInfo => {
    const advance = basic
      ? 0
      : escrow === 'full'
        ? haulPrice
        : escrow === 'partial'
          ? Number(escrowHeld) || 0
          : 0;
    const selectedType = transportTypes.find((type) => type.id === transportTypeId);

    const route = buildCargoRoute(
      info.address || EMPTY_CARGO.address,
      info.destiny || EMPTY_CARGO.destiny,
      info.route || [],
      endpointIds
    );

    return {
      ...info,
      guid: info.guid || initialCargo.guid,
      name: info.name?.trim() || EMPTY_CARGO.name,
      description: info.description?.trim() || EMPTY_CARGO.description,
      price: haulPrice,
      cost: cargoCost,
      advance,
      insurance: basic ? 0 : insurancePremium,
      currency: companyCurrency,
      transport_type: transportTypeId ? toTransportTypeId(transportTypeId) : undefined,
      body_type:
        selectedType?.ru ||
        selectedType?.name ||
        activeBody?.nameRu ||
        info.body_type ||
        '',
      vehicles_total: 1,
      vehicles_busy: info.vehicles_busy || 0,
      route,
    };
  };

  const waypoints = (info.route || []).filter((point) => point.point_type === 'waypoint');

  const patchWaypoint = (index: number, next: CargoRoutePoint) => {
    setInfo((prev) => {
      const list = (prev.route || []).filter((point) => point.point_type === 'waypoint');
      const current = list[index];
      const coordsChanged =
        Number(current?.lat) !== Number(next.lat) || Number(current?.lon) !== Number(next.lon);
      return {
        ...prev,
        ...(coordsChanged ? { route_distance: undefined } : {}),
        route: list.map((point, itemIndex) =>
          itemIndex === index
            ? { ...next, point_type: 'waypoint', sequence_num: itemIndex + 2 }
            : point
        ),
      };
    });
  };

  const addWaypoint = () => {
    setInfo((prev) => ({
      ...prev,
      route: [
        ...(prev.route || []).filter((point) => point.point_type === 'waypoint'),
        {
          city: '',
          address: '',
          lat: 0,
          lon: 0,
          point_type: 'waypoint',
          sequence_num: (prev.route?.length || 0) + 2,
        },
      ],
    }));
  };

  const removeWaypoint = (index: number) => {
    setInfo((prev) => ({
      ...prev,
      route_distance: undefined,
      route: (prev.route || [])
        .filter((point) => point.point_type === 'waypoint')
        .filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleNext = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const cargo = buildCargo();
    if (!cargo.name?.trim()) return;

    setIsSubmitting(true);
    try {
      const ok =
        isEdit && cargo.guid
          ? await onUpdate(cargo.guid, cargo)
          : await onCreate(cargo);
      if (ok) onBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <OrganizationRequiredModal
        isOpen={organizationRequired}
        onClose={onBack}
        onGoProfile={() => history.push('/profile')}
      />
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        {t('formBack')}
      </button>

      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>{t('formEyebrow')}</p>
        <h1 className={styles.title}>
          {isEdit ? t('formTitleEdit') : t('formTitleNew')}
        </h1>
        <p className={styles.subtitle}>
          {isEdit ? t('formSubtitleEdit') : t('formSubtitleNew')}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleNext}>
        <Section icon={Package} title={t('sectionCargo')}>
          <div className={styles.grid2}>
            <Field label={t('fieldCargoName')} className={styles.span2}>
              <input
                type="text"
                className={styles.input}
                placeholder={t('phCargoName')}
                value={info.name || ''}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                required
              />
            </Field>

            <Field label={t('fieldWeight')}>
              <input
                type="text"
                inputMode="decimal"
                className={styles.input}
                placeholder="0"
                value={weightDraft}
                onChange={(e) => {
                  const v = normalizeDecimalInput(e.target.value);
                  setWeightDraft(v);
                  setInfo({ ...info, weight: parseDecimalDraft(v) });
                }}
                required
              />
            </Field>

            <Field label={t('fieldVolume')}>
              <input
                type="text"
                inputMode="decimal"
                className={styles.input}
                placeholder="0"
                value={volumeDraft}
                onChange={(e) => {
                  const v = normalizeDecimalInput(e.target.value);
                  setVolumeDraft(v);
                  setInfo({ ...info, volume: parseDecimalDraft(v) });
                }}
                required
              />
            </Field>

            <Field label={t('fieldCargoCost', { sign: moneyMark })} className={styles.span2}>
              <input
                type="text"
                inputMode="numeric"
                className={styles.input}
                placeholder="0"
                value={formatNumber(info.cost || '')}
                onChange={(e) => {
                  setInfo({ ...info, cost: unformatNumber(e.target.value) });
                }}
                required
              />
            </Field>

            <Field label={t('fieldCargoDesc')} className={styles.span2}>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder={t('phCargoDesc')}
                value={info.description || ''}
                onChange={(e) => setInfo({ ...info, description: e.target.value })}
              />
            </Field>
          </div>
        </Section>

        <Section icon={Truck} title={t('sectionTransport')}>
          {bodyTypes.length === 0 ? (
            <p className={styles.bodyHint}>{t('loadingTransportTypes')}</p>
          ) : (
            <>
              <div className={styles.bodyGrid}>
                {bodyTypes.map((type) => {
                  const selected = transportTypeId === type.id;
                  const Icon = type.Icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      className={`${styles.bodyCard} ${selected ? styles.bodyCardActive : ''}`}
                      onClick={() => setTransportTypeId(type.id)}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                      <span>{type.name}</span>
                    </button>
                  );
                })}
              </div>

              {activeBody && <p className={styles.bodyHint}>{activeBody.desc}</p>}
            </>
          )}

          <Field label={t('fieldCapacity')} className={styles.mt3}>
            <input
              type="text"
              inputMode="decimal"
              className={styles.input}
              placeholder="0"
              value={capacityT}
              onChange={(e) => setCapacityT(normalizeDecimalInput(e.target.value))}
            />
          </Field>
        </Section>

        <Section icon={MapPin} title={t('sectionPickup')}>
          <div className={styles.grid2}>
            <div className={styles.dadata}>
              <CityField
                label={t('fieldPickupCity')}
                value={info.address?.city || EMPTY_CARGO.address.city}
                onChange={(cityData) => {
                  setInfo((prev) => ({
                    ...prev,
                    route_distance: undefined,
                    address: {
                      ...(prev.address || EMPTY_CARGO.address),
                      city: cityData,
                      address: '',
                      fias: '',
                      lat: cityData.lat ?? 0,
                      lon: cityData.lon ?? 0,
                    },
                  }));
                }}
              />
            </div>

            <Field label={t('fieldPickupDate')}>
              <input
                type="date"
                className={styles.input}
                value={formatDateForInput(info.pickup_date || '')}
                onChange={(e) => setInfo({ ...info, pickup_date: e.target.value })}
                required
              />
            </Field>

            <div className={`${styles.dadata} ${styles.span2}`}>
              <AddressField
                key={`from-${info.address?.city?.city || ''}-${info.address?.city?.lat || 0}-${info.address?.city?.lon || 0}`}
                label={t('fieldPickupAddress')}
                value={{
                  address: info.address?.address || '',
                  fias: info.address?.fias || '',
                  ...coordString(
                    info.address?.lat || info.address?.city?.lat,
                    info.address?.lon || info.address?.city?.lon
                  ),
                }}
                onChange={(addressData) =>
                  setInfo((prev) => {
                    const lat = Number(addressData.lat);
                    const lon = Number(addressData.lon);
                    const nextLat =
                      Number.isFinite(lat) && !(lat === 0 && Number.isFinite(lon) && lon === 0)
                        ? lat
                        : prev.address?.lat || prev.address?.city?.lat || 0;
                    const nextLon =
                      Number.isFinite(lon) && !(Number.isFinite(lat) && lat === 0 && lon === 0)
                        ? lon
                        : prev.address?.lon || prev.address?.city?.lon || 0;
                    const coordsChanged =
                      nextLat !== (prev.address?.lat || 0) || nextLon !== (prev.address?.lon || 0);
                    return {
                      ...prev,
                      ...(coordsChanged ? { route_distance: undefined } : {}),
                      address: {
                        ...(prev.address || EMPTY_CARGO.address),
                        address: addressData.address,
                        fias: addressData.fias || prev.address?.fias || '',
                        lat: nextLat,
                        lon: nextLon,
                      },
                    };
                  })
                }
                cityFias={info.address?.city?.fias}
                cityName={info.address?.city?.city}
                country={info.address?.city?.country}
                cityLat={info.address?.city?.lat ?? info.address?.lat}
                cityLon={info.address?.city?.lon ?? info.address?.lon}
              />
            </div>
          </div>
        </Section>

        <Section icon={MapPin} title={t('sectionWaypoints')}>
          <div className={styles.waypointList}>
            {waypoints.map((point, index) => (
              <div key={point.id || `waypoint-${index}`} className={styles.waypointCard}>
                <div className={styles.waypointHead}>
                  <span>{t('waypointN', { n: index + 1 })}</span>
                  <button
                    type="button"
                    className={styles.waypointRemove}
                    onClick={() => removeWaypoint(index)}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                    {t('remove')}
                  </button>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.dadata}>
                    <CityField
                      label={t('fieldCity')}
                      value={{ city: point.city || '', fias: '', lat: point.lat, lon: point.lon }}
                      onChange={(cityData) =>
                        patchWaypoint(index, {
                          ...point,
                          city: cityData.city,
                          address: '',
                          lat: cityData.lat ?? 0,
                          lon: cityData.lon ?? 0,
                        })
                      }
                    />
                  </div>
                  <div className={`${styles.dadata} ${styles.span2}`}>
                    <AddressField
                      key={`via-${point.id || index}-${point.city}`}
                      label={t('fieldExactAddress')}
                      value={{
                        address: point.address || '',
                        fias: '',
                        ...coordString(point.lat, point.lon),
                      }}
                      onChange={(addressData) => {
                        const lat = Number(addressData.lat);
                        const lon = Number(addressData.lon);
                        const nextLat =
                          Number.isFinite(lat) && !(lat === 0 && Number.isFinite(lon) && lon === 0)
                            ? lat
                            : point.lat || 0;
                        const nextLon =
                          Number.isFinite(lon) && !(Number.isFinite(lat) && lat === 0 && lon === 0)
                            ? lon
                            : point.lon || 0;
                        patchWaypoint(index, {
                          ...point,
                          address: addressData.address,
                          lat: nextLat,
                          lon: nextLon,
                        });
                      }}
                      cityName={point.city}
                      cityLat={point.lat}
                      cityLon={point.lon}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className={styles.addPoint} onClick={addWaypoint}>
              <Plus size={16} strokeWidth={2} />
              {t('addWaypoint')}
            </button>
          </div>
        </Section>

        <Section icon={Navigation} title={t('sectionDelivery')}>
          <div className={styles.grid2}>
            <div className={styles.dadata}>
              <CityField
                label={t('fieldDeliveryCity')}
                value={info.destiny?.city || EMPTY_CARGO.destiny.city}
                onChange={(cityData) => {
                  setInfo((prev) => ({
                    ...prev,
                    route_distance: undefined,
                    destiny: {
                      ...(prev.destiny || EMPTY_CARGO.destiny),
                      city: cityData,
                      address: '',
                      fias: '',
                      lat: cityData.lat ?? 0,
                      lon: cityData.lon ?? 0,
                    },
                  }));
                }}
              />
            </div>

            <Field label={t('fieldDeliveryDate')}>
              <input
                type="date"
                className={styles.input}
                value={formatDateForInput(info.delivery_date || '')}
                onChange={(e) => setInfo({ ...info, delivery_date: e.target.value })}
                required
              />
            </Field>

            <div className={`${styles.dadata} ${styles.span2}`}>
              <AddressField
                key={`to-${info.destiny?.city?.city || ''}-${info.destiny?.city?.lat || 0}-${info.destiny?.city?.lon || 0}`}
                label={t('fieldDeliveryAddress')}
                value={{
                  address: info.destiny?.address || '',
                  fias: info.destiny?.fias || '',
                  ...coordString(
                    info.destiny?.lat || info.destiny?.city?.lat,
                    info.destiny?.lon || info.destiny?.city?.lon
                  ),
                }}
                onChange={(addressData) =>
                  setInfo((prev) => {
                    const lat = Number(addressData.lat);
                    const lon = Number(addressData.lon);
                    const nextLat =
                      Number.isFinite(lat) && !(lat === 0 && Number.isFinite(lon) && lon === 0)
                        ? lat
                        : prev.destiny?.lat || prev.destiny?.city?.lat || 0;
                    const nextLon =
                      Number.isFinite(lon) && !(Number.isFinite(lat) && lat === 0 && lon === 0)
                        ? lon
                        : prev.destiny?.lon || prev.destiny?.city?.lon || 0;
                    const coordsChanged =
                      nextLat !== (prev.destiny?.lat || 0) || nextLon !== (prev.destiny?.lon || 0);
                    return {
                      ...prev,
                      ...(coordsChanged ? { route_distance: undefined } : {}),
                      destiny: {
                        ...(prev.destiny || EMPTY_CARGO.destiny),
                        address: addressData.address,
                        fias: addressData.fias || prev.destiny?.fias || '',
                        lat: nextLat,
                        lon: nextLon,
                      },
                    };
                  })
                }
                cityFias={info.destiny?.city?.fias}
                cityName={info.destiny?.city?.city}
                country={info.destiny?.city?.country}
                cityLat={info.destiny?.city?.lat ?? info.destiny?.lat}
                cityLon={info.destiny?.city?.lon ?? info.destiny?.lon}
              />
            </div>
          </div>
        </Section>

        {resolvePointCoords(info.address) && resolvePointCoords(info.destiny) ? (
          <Section icon={MapPin} title={t('sectionRoute')}>
            <div className={styles.routeMap}>
              <Maps
                height="320px"
                startCoords={{
                  lat: Number(info.address?.lat) || Number(info.address?.city?.lat) || 0,
                  long: Number(info.address?.lon) || Number(info.address?.city?.lon) || 0,
                }}
                endCoords={{
                  lat: Number(info.destiny?.lat) || Number(info.destiny?.city?.lat) || 0,
                  long: Number(info.destiny?.lon) || Number(info.destiny?.city?.lon) || 0,
                }}
                waypoints={(info.route || [])
                  .filter((point) => point.point_type === 'waypoint')
                  .filter((point) => resolvePointCoords(point))
                  .map((point) => ({ lat: point.lat, long: point.lon }))}
              />
            </div>
          </Section>
        ) : null}

        <Section icon={Phone} title={t('sectionContact')}>
          <div className={styles.grid2}>
            <Field label={t('fieldContactName')}>
              <input
                type="text"
                className={styles.input}
                placeholder={t('phContactName')}
                value={info.face || ''}
                onChange={(e) => setInfo({ ...info, face: e.target.value })}
                required
              />
            </Field>
            <Field label={t('fieldPhone')}>
              <input
                type="tel"
                inputMode="tel"
                className={styles.input}
                placeholder="+7 900 000-00-00"
                value={info.phone || ''}
                onChange={(e) => {
                  const phoneValue = e.target.value.replace(/\D/g, '');
                  setInfo({ ...info, phone: phoneValue });
                }}
                required
              />
            </Field>
          </div>
          <div className={styles.lockNote}>
            <Lock size={16} strokeWidth={2} />
            <p>
              <strong>{t('phoneHiddenTitle')}</strong> {t('phoneHiddenText')}
            </p>
          </div>
        </Section>

        <Section icon={FileText} title={t('sectionDocs')}>
          <label className={styles.upload}>
            <Upload size={20} strokeWidth={1.75} />
            <span className={styles.uploadTitle}>{t('uploadDocsTitle')}</span>
            <span className={styles.uploadHint}>{t('uploadDocsHint')}</span>
            <input
              type="file"
              multiple
              className={styles.srOnly}
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) setDocs((prev) => [...prev, ...Array.from(files)]);
                e.target.value = '';
              }}
            />
          </label>

          {docs.length > 0 && (
            <ul className={styles.docList}>
              {docs.map((file, index) => (
                <li key={`${file.name}-${index}`} className={styles.docItem}>
                  <FileText size={16} strokeWidth={1.75} />
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className={styles.docRemove}
                    aria-label={t('removeFile', { name: file.name })}
                    onClick={() => setDocs((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.lockNote}>
            <Lock size={16} strokeWidth={2} />
            <p>
              <strong>{t('docsHiddenTitle')}</strong> {t('docsHiddenText')}
            </p>
          </div>
        </Section>

        {!basic && <Section icon={Shield} title={t('sectionEscrow')}>
          <div className={styles.choiceGrid}>
            {ESCROW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.choiceCard} ${escrow === option.id ? styles.choiceActive : ''}`}
                onClick={() => setEscrow(option.id)}
              >
                <span className={styles.choiceHead}>
                  <span className={`${styles.choiceDot} ${styles[`dot_${option.light}`]}`} />
                  <span className={styles.choiceTitle}>{t(option.shortKey)}</span>
                </span>
                <span className={styles.choiceDesc}>{t(option.descKey)}</span>
              </button>
            ))}
          </div>

          {escrow === 'partial' && (
            <div className={styles.partialBox}>
              <div className={styles.grid2}>
                <Field label={t('fieldEscrowAmount', { sign: moneyMark })}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.input}
                    placeholder="0"
                    value={formatNumber(escrowHeld || '')}
                    onChange={(e) => setEscrowHeld(unformatNumber(e.target.value))}
                    required
                  />
                </Field>
                <Field label={t('fieldEscrowRest')}>
                  <div className={styles.readonly}>
                    {formatNumber(Math.max(haulPrice - escrowHeld, 0)) || '0'} {moneyMark}
                  </div>
                </Field>
              </div>
              <p className={styles.helpText}>
                {haulPrice > 0
                  ? t('escrowPartialHint', {
                      percent: escrowPercent,
                      price: formatNumber(haulPrice),
                      sign: moneyMark,
                    })
                  : t('escrowPartialHintEmpty')}
              </p>
            </div>
          )}
        </Section>}

        {!basic && <Section icon={ShieldCheck} title={t('sectionInsurance')}>
          <div className={styles.choiceGrid}>
            {INSURANCE_OPTIONS.map((option) => {
              const Icon = option.Icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.choiceCard} ${
                    insuranceKind === option.id ? styles.choiceActive : ''
                  }`}
                  onClick={() => setInsuranceKind(option.id)}
                >
                  <span className={styles.choiceHead}>
                    <Icon size={16} strokeWidth={1.75} className={styles.choiceIcon} />
                    <span className={styles.choiceTitle}>{t(option.labelKey)}</span>
                    <span className={styles.choiceRate}>
                      {option.rate > 0 ? `${option.rate}%` : `0 ${moneyMark}`}
                    </span>
                  </span>
                  <span className={styles.choiceDesc}>{t(option.descKey)}</span>
                </button>
              );
            })}
          </div>
          {insuranceKind === 'none' ? (
            <p className={styles.helpText}>{t('insNoneNote')}</p>
          ) : cargoCost > 0 ? (
            <p className={styles.helpText}>
              {t('insPremiumNote', {
                premium: formatNumber(insurancePremium),
                sign: moneyMark,
                rate: insuranceRate,
                cost: formatNumber(cargoCost),
              })}
            </p>
          ) : null}
        </Section>}

        <Section icon={Wallet} title={t('sectionPrice')}>
          <div className={styles.quoteLayout}>
            <dl className={styles.calcMetrics}>
              <div>
                <dt>{t('metricDistance')}</dt>
                <dd>
                  {routeKm != null ? t('kmUnit', { n: hintNum(routeKm) }) : '—'}
                </dd>
              </div>
              {formula === 1 ? (
                <div>
                  <dt>{t('metricWeight')}</dt>
                  <dd>
                    {Number(info.weight) > 0 ? t('tonUnit', { n: hintNum(info.weight) }) : '—'}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>{t('metricBody')}</dt>
                <dd>
                  {selectedTransportType
                    ? transportTypeLabel(selectedTransportType, i18n.language)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>{t('metricFormula')}</dt>
                <dd>{formulaLabel}</dd>
              </div>
            </dl>
            <div className={styles.quoteRange}>
              {serverQuote ? (
                <>
                  <div className={styles.quoteBound}>
                    <span className={styles.quoteBoundLabel}>{t('quoteMin')}</span>
                    <span className={styles.quoteBoundValue}>
                      {fmtMoney(serverQuote.min)} {moneySign(serverQuote.currency)}
                    </span>
                  </div>
                  <div className={styles.quoteBound}>
                    <span className={styles.quoteBoundLabel}>{t('quoteMax')}</span>
                    <span className={styles.quoteBoundValue}>
                      {fmtMoney(serverQuote.max)} {moneySign(serverQuote.currency)}
                    </span>
                  </div>
                  {Number.isFinite(Number(serverQuote.rate)) ? (
                    <p className={styles.helpText}>
                      {t('cbrRate', { rate: fmtRate(Number(serverQuote.rate)) })}
                      {fmtDate(serverQuote.rateDate)
                        ? t('cbrRateOn', { date: fmtDate(serverQuote.rateDate) })
                        : ''}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className={styles.helpText} style={{ marginTop: 0 }}>
                  {priceHint || t('quotePending')}
                </p>
              )}
            </div>
          </div>
          {priceHint && serverQuote ? <p className={styles.helpText}>{priceHint}</p> : null}
          <div className={styles.grid2}>
            <Field label={t('fieldHaulPrice', { sign: moneyMark })}>
              <input
                type="text"
                inputMode="numeric"
                className={styles.input}
                placeholder="0"
                value={formatNumber(info.price || '')}
                onChange={(e) => setInfo({ ...info, price: unformatNumber(e.target.value) })}
                required
              />
            </Field>
            <Field label={t('fieldTotalInsurance')}>
              <div className={styles.readonly}>{formatNumber(totalWithInsurance) || '0'} {moneyMark}</div>
            </Field>
          </div>
        </Section>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting || !info.name?.trim()}
          >
            {isEdit ? t('submitSave') : t('submitCreate')}
          </button>
          <button type="button" className={styles.cancel} onClick={onBack}>
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Package;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>
          <Icon size={16} strokeWidth={1.75} />
        </span>
        {title}
      </h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`${styles.field} ${className || ''}`}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}
