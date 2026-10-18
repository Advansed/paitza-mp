import i18n from '../../i18n';
import { CargoInfo, CargoStatus } from '../../Store/cargoStore';
import { buildProgressSlots, type ProgressSlot } from '../../utils/progressSlots';

/**
 * Основной жизненный цикл заявки заказчика.
 * «Проблемы» — внештатный статус, в степпер не входит.
 */
export const CARGO_STATUS_FLOW: CargoStatus[] = [
  CargoStatus.NEW,
  CargoStatus.WAITING,
  CargoStatus.HAS_ORDERS,
  CargoStatus.ACCEPTED,
  CargoStatus.WAIT_LOAD,
  CargoStatus.LOADING,
  CargoStatus.HAS_LOADED,
  CargoStatus.IN_TRANSIT,
  CargoStatus.HAS_DELIVERED,
  CargoStatus.UNLOADING,
  CargoStatus.WAIT_COMPLETE,
  CargoStatus.COMPLETED,
];

/** Короткие подписи для степпера */
export const CARGO_STATUS_SHORT: Record<CargoStatus, string> = {
  [CargoStatus.NEW]: 'Новый',
  [CargoStatus.WAITING]: 'Ожидание',
  [CargoStatus.HAS_ORDERS]: 'Заявки',
  [CargoStatus.ACCEPTED]: 'Принято',
  [CargoStatus.WAIT_LOAD]: 'Ждёт загрузку',
  [CargoStatus.LOADING]: 'Загрузка',
  [CargoStatus.HAS_LOADED]: 'Загружено',
  [CargoStatus.IN_TRANSIT]: 'В пути',
  [CargoStatus.HAS_DELIVERED]: 'Доставлено',
  [CargoStatus.UNLOADING]: 'Разгрузка',
  [CargoStatus.WAIT_COMPLETE]: 'К завершению',
  [CargoStatus.COMPLETED]: 'Готово',
  [CargoStatus.PROBLEMS]: 'Проблемы',
};

const CARGO_STATUS_I18N: Record<CargoStatus, string> = {
  [CargoStatus.NEW]: 'statusNew',
  [CargoStatus.WAITING]: 'statusWaiting',
  [CargoStatus.HAS_ORDERS]: 'statusOrders',
  [CargoStatus.ACCEPTED]: 'statusAccepted',
  [CargoStatus.WAIT_LOAD]: 'statusWaitLoad',
  [CargoStatus.LOADING]: 'statusLoading',
  [CargoStatus.HAS_LOADED]: 'statusLoaded',
  [CargoStatus.IN_TRANSIT]: 'statusTransit',
  [CargoStatus.HAS_DELIVERED]: 'statusDelivered',
  [CargoStatus.UNLOADING]: 'statusUnloading',
  [CargoStatus.WAIT_COMPLETE]: 'statusWaitComplete',
  [CargoStatus.COMPLETED]: 'statusCompleted',
  [CargoStatus.PROBLEMS]: 'statusProblems',
};

export function cargoStatusLabel(status: string | CargoStatus): string {
  const normalized = normalizeCargoStatus(status);
  return i18n.t(CARGO_STATUS_I18N[normalized], {
    ns: 'cargos',
    defaultValue: CARGO_STATUS_SHORT[normalized],
  });
}

/** Что делать заказчику на этом статусе */
export const CARGO_CURRENT_ACTION: Record<CargoStatus, string> = {
  [CargoStatus.NEW]: 'Опубликуйте заказ или настройте доп. услуги',
  [CargoStatus.WAITING]: 'Ожидайте предложений от водителей',
  [CargoStatus.HAS_ORDERS]: 'Просмотрите заявки и выберите водителя',
  [CargoStatus.ACCEPTED]: 'Водитель принят — ожидайте выезда на погрузку',
  [CargoStatus.WAIT_LOAD]: 'Водитель на погрузке — можно начать загрузку',
  [CargoStatus.LOADING]: 'Идёт загрузка',
  [CargoStatus.HAS_LOADED]: 'Разрешите выезд в рейс',
  [CargoStatus.IN_TRANSIT]: 'Груз в пути — следите за доставкой',
  [CargoStatus.HAS_DELIVERED]: 'Груз доставлен — начните разгрузку',
  [CargoStatus.UNLOADING]: 'Идёт разгрузка',
  [CargoStatus.WAIT_COMPLETE]: 'Подтвердите завершение заказа',
  [CargoStatus.COMPLETED]: 'Заказ успешно завершён',
  [CargoStatus.PROBLEMS]: 'По заказу возникли проблемы — разберите ситуацию',
};

/**
 * Синонимы сервера / статусов водителя → статус заявки.
 * Нужны, пока бэкенд может присылать старые формулировки.
 */
const STATUS_ALIASES: Record<string, CargoStatus> = {
  // коды сервера (те же, что у исполнителя)
  '10': CargoStatus.NEW,
  '11': CargoStatus.HAS_ORDERS,
  '12': CargoStatus.ACCEPTED,
  '13': CargoStatus.WAIT_LOAD,
  '14': CargoStatus.LOADING,
  '15': CargoStatus.HAS_LOADED,
  '16': CargoStatus.IN_TRANSIT,
  '17': CargoStatus.HAS_DELIVERED,
  '18': CargoStatus.UNLOADING,
  '19': CargoStatus.WAIT_COMPLETE,
  '20': CargoStatus.COMPLETED,
  '21': CargoStatus.PROBLEMS,
  // старые CargoStatus
  Торг: CargoStatus.HAS_ORDERS,
  'В работе': CargoStatus.IN_TRANSIT,
  Доставлено: CargoStatus.HAS_DELIVERED,
  Выполнено: CargoStatus.COMPLETED,
  Ожидание: CargoStatus.WAITING,
  'На погрузку': CargoStatus.ACCEPTED,
  Отказано: CargoStatus.PROBLEMS,
  // DriverStatus / рейс
  Заказано: CargoStatus.HAS_ORDERS,
  Принято: CargoStatus.ACCEPTED,
  'На погрузке': CargoStatus.WAIT_LOAD,
  Загружается: CargoStatus.LOADING,
  Загружено: CargoStatus.HAS_LOADED,
  'В пути': CargoStatus.IN_TRANSIT,
  'В Пути': CargoStatus.IN_TRANSIT,
  Прибыл: CargoStatus.HAS_DELIVERED,
  Разгружается: CargoStatus.UNLOADING,
  Разгружено: CargoStatus.WAIT_COMPLETE,
  Завершено: CargoStatus.COMPLETED,
  Завершён: CargoStatus.COMPLETED,
  Завершен: CargoStatus.COMPLETED,
  Проблемы: CargoStatus.PROBLEMS,
};

export function normalizeCargoStatus(
  status: string | number | CargoStatus | undefined | null
): CargoStatus {
  if (status === undefined || status === null || status === '') {
    return CargoStatus.NEW;
  }
  const raw = String(status);
  if (Object.values(CargoStatus).includes(raw as CargoStatus)) {
    return raw as CargoStatus;
  }
  const folded = raw.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
  return STATUS_ALIASES[raw] ?? STATUS_ALIASES[folded] ?? CargoStatus.NEW;
}

export function getCargoStatusFlowIndex(status: string | CargoStatus): number {
  const normalized = normalizeCargoStatus(status);
  if (normalized === CargoStatus.PROBLEMS) return -1;
  const idx = CARGO_STATUS_FLOW.indexOf(normalized);
  return idx >= 0 ? idx : 0;
}

export type CargoProgressSlot = ProgressSlot<CargoStatus>;

/** До 7 точек: соседние этапы вокруг текущего и финиш, «…» если дальше ещё есть шаги. */
export function getCargoProgressSlots(status: string | CargoStatus): CargoProgressSlot[] {
  return buildProgressSlots(CARGO_STATUS_FLOW, getCargoStatusFlowIndex(status));
}

/** Самый «продвинутый» статус: cargo.status или статусы заявок */
export function resolveCargoProgressStatus(cargo: {
  status?: string | number | CargoStatus | null;
  invoices?: CargoInfo['invoices'];
}): CargoStatus {
  const candidates: Array<string | number | CargoStatus | undefined | null> = [cargo.status];
  for (const invoice of cargo.invoices ?? []) {
    if (invoice.status) candidates.push(invoice.status);
  }

  let best = normalizeCargoStatus(candidates[0] ?? CargoStatus.NEW);
  if (best === CargoStatus.PROBLEMS) return best;

  let bestIdx = getCargoStatusFlowIndex(best);

  for (const status of candidates) {
    const normalized = normalizeCargoStatus(status);
    if (normalized === CargoStatus.PROBLEMS) return CargoStatus.PROBLEMS;
    const idx = getCargoStatusFlowIndex(normalized);
    if (idx > bestIdx) {
      best = normalized;
      bestIdx = idx;
    }
  }

  return best;
}

export function getCargoActionHint(status: string | CargoStatus): string {
  const normalized = normalizeCargoStatus(status);
  return CARGO_CURRENT_ACTION[normalized] || 'Открыть действия по заказу';
}

/** Заявка уже на этапе исполнения (после выбора водителя) */
export function isCargoInExecution(status: string | CargoStatus): boolean {
  const normalized = normalizeCargoStatus(status);
  if (normalized === CargoStatus.PROBLEMS) return true;
  return getCargoStatusFlowIndex(normalized) >= CARGO_STATUS_FLOW.indexOf(CargoStatus.ACCEPTED);
}

export function isCargoCompleted(status: string | CargoStatus): boolean {
  return normalizeCargoStatus(status) === CargoStatus.COMPLETED;
}

export function isCargoProblems(status: string | CargoStatus): boolean {
  return normalizeCargoStatus(status) === CargoStatus.PROBLEMS;
}

export type CargoFeedKind = 'new' | 'waiting' | 'bids' | 'work' | 'done' | 'alert';

export function cargoFeedKind(status: string | CargoStatus): CargoFeedKind {
  const normalized = normalizeCargoStatus(status);
  if (normalized === CargoStatus.NEW) return 'new';
  if (normalized === CargoStatus.WAITING) return 'waiting';
  if (normalized === CargoStatus.HAS_ORDERS) return 'bids';
  if (normalized === CargoStatus.COMPLETED) return 'done';
  if (normalized === CargoStatus.PROBLEMS) return 'alert';
  return 'work';
}

export function cargoFeedLabel(status: string | CargoStatus): string {
  return cargoStatusLabel(status);
}
