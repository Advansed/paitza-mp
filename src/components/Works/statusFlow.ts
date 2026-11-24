import i18n from '../../i18n';
import { WorkStatus } from './types';
import { buildProgressSlots, type ProgressSlot } from '../../utils/progressSlots';

/** Основной жизненный цикл заказа (без «Отказано») */
export const WORK_STATUS_FLOW: WorkStatus[] = [
  WorkStatus.NEW,
  WorkStatus.OFFERED,
  WorkStatus.TO_LOAD,
  WorkStatus.ON_LOAD,
  WorkStatus.LOADING,
  WorkStatus.LOADED,
  WorkStatus.IN_WORK,
  WorkStatus.TO_UNLOAD,
  WorkStatus.UNLOADING,
  WorkStatus.UNLOADED,
  WorkStatus.COMPLETED,
];

/** Короткое название для степпера */
export const WORK_STATUS_SHORT: Record<WorkStatus, string> = {
  [WorkStatus.NEW]: 'Новый',
  [WorkStatus.OFFERED]: 'Торг',
  [WorkStatus.TO_LOAD]: 'На погрузку',
  [WorkStatus.ON_LOAD]: 'На погрузке',
  [WorkStatus.LOADING]: 'Загрузка',
  [WorkStatus.LOADED]: 'Загружено',
  [WorkStatus.IN_WORK]: 'В рейсе',
  [WorkStatus.TO_UNLOAD]: 'Доставлено',
  [WorkStatus.UNLOADING]: 'Разгрузка',
  [WorkStatus.UNLOADED]: 'Разгружено',
  [WorkStatus.COMPLETED]: 'Готово',
  [WorkStatus.REJECTED]: 'Отказ',
};

const WORK_STATUS_I18N: Record<WorkStatus, string> = {
  [WorkStatus.NEW]: 'statusNew',
  [WorkStatus.OFFERED]: 'statusOffered',
  [WorkStatus.TO_LOAD]: 'statusToLoad',
  [WorkStatus.ON_LOAD]: 'statusOnLoad',
  [WorkStatus.LOADING]: 'statusLoading',
  [WorkStatus.LOADED]: 'statusLoaded',
  [WorkStatus.IN_WORK]: 'statusInWork',
  [WorkStatus.TO_UNLOAD]: 'statusToUnload',
  [WorkStatus.UNLOADING]: 'statusUnloading',
  [WorkStatus.UNLOADED]: 'statusUnloaded',
  [WorkStatus.COMPLETED]: 'statusCompleted',
  [WorkStatus.REJECTED]: 'statusRejected',
};

const BASIC_WORK_FLOW: WorkStatus[] = [
  WorkStatus.NEW,
  WorkStatus.OFFERED,
  WorkStatus.IN_WORK,
  WorkStatus.COMPLETED,
];

function basicWorkKey(status: WorkStatus): string {
  if (status === WorkStatus.NEW) return 'statusBasicPublished';
  if (status === WorkStatus.OFFERED) return 'statusBasicBids';
  if (status === WorkStatus.COMPLETED) return 'statusBasicDone';
  if (status === WorkStatus.REJECTED) return 'statusBasicReject';
  return 'statusBasicTrip';
}

const BASIC_WORK_LABEL: Record<string, string> = {
  statusBasicPublished: 'Опубликован',
  statusBasicBids: 'Есть отклик',
  statusBasicTrip: 'В рейсе',
  statusBasicDone: 'Завершён',
  statusBasicReject: 'Отказ',
};

export function workStatusLabel(status: WorkStatus | string, plan?: string): string {
  const normalized = normalizeWorkStatus(status);
  if (plan === 'basic') {
    const key = basicWorkKey(normalized);
    return i18n.t(key, { ns: 'works', defaultValue: BASIC_WORK_LABEL[key] });
  }
  return i18n.t(WORK_STATUS_I18N[normalized], {
    ns: 'works',
    defaultValue: WORK_STATUS_SHORT[normalized],
  });
}

/** Что делать исполнителю на этом статусе (fallback RU) */
export const WORK_CURRENT_ACTION: Record<WorkStatus, string> = {
  [WorkStatus.NEW]: 'Сделайте предложение по цене и транспорту',
  [WorkStatus.OFFERED]: 'Ожидайте ответа заказчика или отмените предложение',
  [WorkStatus.TO_LOAD]: 'Подпишите договор и выезжайте на погрузку',
  [WorkStatus.ON_LOAD]: 'Отправьте или замените фото кузова и ожидайте начала погрузки',
  [WorkStatus.LOADING]: 'Зафиксируйте погрузку: фото груза и пломбы',
  [WorkStatus.LOADED]: 'При необходимости замените фото груза и пломбы и ожидайте выезд',
  [WorkStatus.IN_WORK]: 'Доставьте груз и отметьте прибытие на разгрузку',
  [WorkStatus.TO_UNLOAD]: 'Ожидайте начала разгрузки',
  [WorkStatus.UNLOADING]: 'Подтвердите разгрузку фотографиями кузова',
  [WorkStatus.UNLOADED]: 'Ожидайте закрытия заказа заказчиком',
  [WorkStatus.COMPLETED]: 'Заказ успешно завершён',
  [WorkStatus.REJECTED]: 'Предложение отклонено — заказ больше недоступен',
};

const WORK_ACTION_I18N: Record<WorkStatus, string> = {
  [WorkStatus.NEW]: 'actionHintNew',
  [WorkStatus.OFFERED]: 'actionHintOffered',
  [WorkStatus.TO_LOAD]: 'actionHintToLoad',
  [WorkStatus.ON_LOAD]: 'actionHintOnLoad',
  [WorkStatus.LOADING]: 'actionHintLoading',
  [WorkStatus.LOADED]: 'actionHintLoaded',
  [WorkStatus.IN_WORK]: 'actionHintInWork',
  [WorkStatus.TO_UNLOAD]: 'actionHintToUnload',
  [WorkStatus.UNLOADING]: 'actionHintUnloading',
  [WorkStatus.UNLOADED]: 'actionHintUnloaded',
  [WorkStatus.COMPLETED]: 'actionHintCompleted',
  [WorkStatus.REJECTED]: 'actionHintRejected',
};

export function getWorkActionHint(status: WorkStatus | string, plan?: string): string {
  const normalized = normalizeWorkStatus(status);
  if (plan === 'basic') {
    const key = basicWorkKey(normalized);
    const hint =
      key === 'statusBasicPublished'
        ? 'Сделайте предложение по цене и транспорту'
        : key === 'statusBasicBids'
          ? 'Ожидайте, пока заказчик начнёт рейс'
          : key === 'statusBasicDone'
            ? 'Заказ завершён'
            : key === 'statusBasicReject'
              ? 'Предложение отклонено'
              : 'Рейс идёт. Его завершает заказчик';
    return i18n.t(`action${key.slice(6)}`, { ns: 'works', defaultValue: hint });
  }
  return i18n.t(WORK_ACTION_I18N[normalized], {
    ns: 'works',
    defaultValue: WORK_CURRENT_ACTION[normalized] || i18n.t('orderActionHint', {
      ns: 'works',
      defaultValue: 'Открыть действия по заказу',
    }),
  });
}

const WORK_STATUS_ALIASES: Record<string, WorkStatus> = {
  '10': WorkStatus.NEW,
  '11': WorkStatus.OFFERED,
  '12': WorkStatus.TO_LOAD,
  '13': WorkStatus.ON_LOAD,
  '14': WorkStatus.LOADING,
  '15': WorkStatus.LOADED,
  '16': WorkStatus.IN_WORK,
  '17': WorkStatus.TO_UNLOAD,
  '18': WorkStatus.UNLOADING,
  '19': WorkStatus.UNLOADED,
  '20': WorkStatus.COMPLETED,
  '21': WorkStatus.REJECTED,
  Принято: WorkStatus.TO_LOAD,
  Принят: WorkStatus.TO_LOAD,
  'В пути': WorkStatus.IN_WORK,
  'В Пути': WorkStatus.IN_WORK,
  Прибыл: WorkStatus.TO_UNLOAD,
  Выгружается: WorkStatus.UNLOADING,
  Выгружено: WorkStatus.UNLOADED,
  Завершено: WorkStatus.COMPLETED,
  Завершён: WorkStatus.COMPLETED,
  Завершен: WorkStatus.COMPLETED,
  Отказано: WorkStatus.REJECTED,
};

function foldYo(value: string): string {
  return value.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
}

export function normalizeWorkStatus(status: string | number | WorkStatus | undefined | null): WorkStatus {
  if (status === undefined || status === null || status === '') {
    return WorkStatus.NEW;
  }
  const raw = String(status);
  if (Object.values(WorkStatus).includes(raw as WorkStatus)) {
    return raw as WorkStatus;
  }
  return WORK_STATUS_ALIASES[raw] ?? WORK_STATUS_ALIASES[foldYo(raw)] ?? WorkStatus.NEW;
}

/** Сопоставление заказа: guid и cargo могут путаться / отличаться типом (string|number) */
export function workIdsMatch(
  work: { guid?: string; cargo?: string },
  ref: { guid?: string; cargo?: string } | string
): boolean {
  const refGuid = typeof ref === 'string' ? ref : ref.guid;
  const refCargo = typeof ref === 'string' ? undefined : ref.cargo;
  const ids = [work.guid, work.cargo].filter(Boolean).map(String);
  const refs = [refGuid, refCargo].filter(Boolean).map(String);
  return refs.some((r) => ids.includes(r));
}

export function findWorkByRef<T extends { guid?: string; cargo?: string }>(
  works: T[],
  ref: { guid?: string; cargo?: string } | string
): T | undefined {
  return works.find((w) => workIdsMatch(w, ref));
}

export function getStatusFlowIndex(status: WorkStatus | string): number {
  const normalized = normalizeWorkStatus(status);
  if (normalized === WorkStatus.REJECTED) return -1;
  const idx = WORK_STATUS_FLOW.indexOf(normalized);
  return idx >= 0 ? idx : 0;
}

export type OrderProgressSlot = ProgressSlot<WorkStatus>;

/** До 7 точек: соседние этапы вокруг текущего и финиш, «…» если дальше ещё есть шаги. */
export function getOrderProgressSlots(status: WorkStatus | string): OrderProgressSlot[] {
  return buildProgressSlots(WORK_STATUS_FLOW, getStatusFlowIndex(status));
}

export function getBasicOrderProgressSlots(status: WorkStatus | string): OrderProgressSlot[] {
  const normalized = normalizeWorkStatus(status);
  if (normalized === WorkStatus.REJECTED) return [];
  let index = 2;
  if (normalized === WorkStatus.NEW) index = 0;
  else if (normalized === WorkStatus.OFFERED) index = 1;
  else if (normalized === WorkStatus.COMPLETED) index = 3;
  return buildProgressSlots(BASIC_WORK_FLOW, index);
}

/** Лента: новые, отклики, рейсы и завершённые */
export const FEED_WORK_STATUSES: WorkStatus[] = [
  WorkStatus.NEW,
  WorkStatus.OFFERED,
  WorkStatus.TO_LOAD,
  WorkStatus.ON_LOAD,
  WorkStatus.LOADING,
  WorkStatus.LOADED,
  WorkStatus.IN_WORK,
  WorkStatus.TO_UNLOAD,
  WorkStatus.UNLOADING,
  WorkStatus.UNLOADED,
  WorkStatus.COMPLETED,
];

/** Активные перевозки после подписи (TO_LOAD+signed и дальше по рейсу) */
export const MY_WORK_STATUSES: WorkStatus[] = [
  WorkStatus.TO_LOAD,
  WorkStatus.ON_LOAD,
  WorkStatus.LOADING,
  WorkStatus.LOADED,
  WorkStatus.IN_WORK,
  WorkStatus.TO_UNLOAD,
  WorkStatus.UNLOADING,
  WorkStatus.UNLOADED,
];

export type WorksListMode = 'feed' | 'mine' | 'all';

export function filterWorksByMode<T extends { status: WorkStatus; signed?: boolean }>(
  works: T[],
  mode: WorksListMode
): T[] {
  if (mode === 'feed') {
    return works.filter((w) => {
      const status = normalizeWorkStatus(w.status);
      return FEED_WORK_STATUSES.includes(status);
    });
  }
  if (mode === 'mine') {
    return works.filter((w) => {
      const status = normalizeWorkStatus(w.status);
      if (!MY_WORK_STATUSES.includes(status)) return false;
      if (status === WorkStatus.TO_LOAD) return Boolean(w.signed);
      return true;
    });
  }
  return works;
}
