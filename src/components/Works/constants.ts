/**
 * Константы для модуля Works
 */

import { WorkStatus, WorkPriority, OfferStatus, CreateOfferData } from './types';

// CSS классы для статусов работ
export const WORK_STATUS_CLASSES: Record<WorkStatus, string> = {
    [WorkStatus.NEW]:       "cr-status-1",
    [WorkStatus.OFFERED]:   "cr-status-1", 
    [WorkStatus.TO_LOAD]:   "cr-status-2",
    [WorkStatus.ON_LOAD]:   "cr-status-2",
    [WorkStatus.IN_WORK]:   "cr-status-3",
    [WorkStatus.TO_UNLOAD]: "cr-status-3",
    [WorkStatus.ON_UNLOAD]: "cr-status-4",
    [WorkStatus.COMPLETED]: "cr-status-4",
    [WorkStatus.REJECTED]:  "cr-status-5"
};

// Цвета статусов работ
export const WORK_STATUS_COLORS: Record<WorkStatus, string> = {

    [WorkStatus.NEW]:       "#1976d2",
    [WorkStatus.OFFERED]:   "#1976d2",
    [WorkStatus.TO_LOAD]:   "#f57c00",
    [WorkStatus.ON_LOAD]:   "#f57c00",
    [WorkStatus.IN_WORK]:   "#7b1fa2", 
    [WorkStatus.TO_UNLOAD]: "#7b1fa2", 
    [WorkStatus.ON_UNLOAD]: "#2e7d32",
    [WorkStatus.COMPLETED]: "#2e7d32",
    [WorkStatus.REJECTED]:  "#e41414ff"

};

// Описания статусов работ
export const WORK_STATUS_DESCRIPTIONS: Record<WorkStatus, string> = {

    [WorkStatus.NEW]:       'Доступна для предложения',
    [WorkStatus.OFFERED]:   'Ваше предложение рассматривается', 
    [WorkStatus.TO_LOAD]:   "Нужно поехать на погрузку",
    [WorkStatus.ON_LOAD]:   "Груз загружается",
    [WorkStatus.IN_WORK]:   "Работа выполняется",
    [WorkStatus.TO_UNLOAD]: "Подъехал к месту разгрузки",
    [WorkStatus.ON_UNLOAD]: "Груз разгружается",
    [WorkStatus.COMPLETED]: "Работа заверщена",
    [WorkStatus.REJECTED]:  "Предложение отказано"
};

// CSS классы для статусов предложений
export const OFFER_STATUS_CLASSES: Record<OfferStatus, string> = {
    [OfferStatus.PENDING]: "cr-status-2",
    [OfferStatus.ACCEPTED]: "cr-status-3",
    [OfferStatus.REJECTED]: "cr-status-1"
};

// Цвета статусов предложений
export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
    [OfferStatus.PENDING]: "#f57c00",
    [OfferStatus.ACCEPTED]: "#2e7d32",
    [OfferStatus.REJECTED]: "#d32f2f"
};

// Статусы, при которых можно создать предложение
export const OFFERABLE_STATUSES = [WorkStatus.NEW];

// Статусы, при которых можно отменить предложение
export const CANCELABLE_STATUSES = [WorkStatus.OFFERED];

// Статусы, при которых можно отметить как выполненную
export const COMPLETABLE_STATUSES = [WorkStatus.IN_WORK];

// Пустое предложение для создания
export const EMPTY_OFFER: CreateOfferData = {
    workId: "",
    transportId: "",
    price: 0,
    weight: 0,
    comment: ""
};

// Лимиты для полей предложения
export const OFFER_FIELD_LIMITS = {
    price: { min: 1000, max: 10000000 },
    weight: { min: 0.1, max: 50 },
    comment: { max: 500 }
};

// Сообщения валидации для предложений
export const OFFER_VALIDATION_MESSAGES = {
    required: 'Поле обязательно для заполнения',
    
    // Специфичные сообщения
    transportRequired: 'Выберите транспорт',
    priceRequired: 'Укажите цену',
    priceMin: 'Цена не может быть меньше 1000 ₽',
    priceMax: 'Цена не может превышать 10 млн ₽',
    weightRequired: 'Укажите вес',
    weightMin: 'Вес не может быть меньше 0.1 тонны',
    weightMax: 'Вес не может превышать доступный',
    commentMax: 'Комментарий не может превышать 500 символов'
};

// WebSocket события для работ
export const WORK_SOCKET_EVENTS = {
    GET_WORKS: 'get_works',
    SET_OFFER: 'set_offer',
    CANCEL_OFFER: 'cancel_offer',
    DELIVERED: 'delivered',
    WORK_UPDATED: 'work_updated',
    OFFER_RESPONSE: 'offer_response'
};

// Типы транспорта (для фильтрации)
export const TRANSPORT_TYPES = [
    "Фура",
    "Газель",
    "Камаз", 
    "Манипулятор",
    "Рефрижератор",
    "Тент",
    "Бортовой"
];

// Популярные маршруты для автодополнения
export const POPULAR_ROUTES = [
    { from: "Москва", to: "Санкт-Петербург" },
    { from: "Москва", to: "Новосибирск" },
    { from: "Москва", to: "Екатеринбург" },
    { from: "Санкт-Петербург", to: "Москва" },
    { from: "Новосибирск", to: "Москва" }
];

// Настройки по умолчанию
export const WORK_DEFAULT_SETTINGS = {
    pageSize: 20,
    autoRefresh: 30000, // 30 секунд
    showOnlyAvailable: false,
    sortBy: 'publish_date' as const,
    sortDirection: 'desc' as const
};

// Таймауты
export const WORK_TIMEOUTS = {
    OFFER_SUBMIT: 10000,
    SEARCH_DEBOUNCE: 300,
    AUTO_REFRESH: 30000
};

// Форматы отображения
export const WORK_FORMATS = {
    DATE_DISPLAY: 'DD.MM.YYYY',
    TIME_DISPLAY: 'HH:mm',
    CURRENCY: 'ru-RU',
    WEIGHT_UNIT: 'т',
    VOLUME_UNIT: 'м³'
};

// Группы работ для отображения
export const WORK_GROUPS = {
    AVAILABLE: {
        title: 'Доступные заказы',
        statuses: [WorkStatus.NEW],
        emptyMessage: 'Нет доступных заказов'
    },
    OFFERED: {
        title: 'Мои предложения',
        statuses: [WorkStatus.OFFERED],
        emptyMessage: 'Нет активных предложений'
    },
    ACTIVE: {
        title: 'В работе',
        statuses: [WorkStatus.IN_WORK],
        emptyMessage: 'Нет работ в процессе'
    },
    COMPLETED: {
        title: 'Выполненные',
        statuses: [WorkStatus.COMPLETED],
        emptyMessage: 'Нет завершенных работ'
    }
};

// Иконки для статусов
export const WORK_STATUS_ICONS = {
    [WorkStatus.NEW]: 'add-circle-outline',
    [WorkStatus.OFFERED]: 'time-outline',
    [WorkStatus.IN_WORK]: 'car-outline',
    [WorkStatus.COMPLETED]: 'checkmark-circle-outline'
};

// Фильтры по умолчанию
export const DEFAULT_WORK_FILTERS = {
    showCompleted: false,
    maxDistance: 1000, // км
    minPrice: 0,
    maxPrice: 1000000
};