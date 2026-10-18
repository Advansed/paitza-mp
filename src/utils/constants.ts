/**
 * Константы для модуля Cargos
 */

import { CargoStatus, CargoPriority, CargoInfo } from '../Store/cargoStore';

// CSS классы для статусов
export const STATUS_CLASSES: Record<CargoStatus, string> = {
    [CargoStatus.NEW]:            'cr-status-1',
    [CargoStatus.WAITING]:        'cr-status-2',
    [CargoStatus.HAS_ORDERS]:     'cr-status-2',
    [CargoStatus.ACCEPTED]:       'cr-status-3',
    [CargoStatus.WAIT_LOAD]:      'cr-status-3',
    [CargoStatus.LOADING]:        'cr-status-3',
    [CargoStatus.HAS_LOADED]:     'cr-status-3',
    [CargoStatus.IN_TRANSIT]:     'cr-status-3',
    [CargoStatus.HAS_DELIVERED]:  'cr-status-4',
    [CargoStatus.UNLOADING]:      'cr-status-4',
    [CargoStatus.WAIT_COMPLETE]:  'cr-status-4',
    [CargoStatus.COMPLETED]:      'cr-status-5',
    [CargoStatus.PROBLEMS]:       'cr-status-danger',
};

// Цвета статусов
export const STATUS_COLORS: Record<CargoStatus, string> = {
    [CargoStatus.NEW]:            '#1976d2',
    [CargoStatus.WAITING]:        '#f57c00',
    [CargoStatus.HAS_ORDERS]:     '#f57c00',
    [CargoStatus.ACCEPTED]:       '#7b1fa2',
    [CargoStatus.WAIT_LOAD]:      '#7b1fa2',
    [CargoStatus.LOADING]:        '#7b1fa2',
    [CargoStatus.HAS_LOADED]:     '#6a1b9a',
    [CargoStatus.IN_TRANSIT]:     '#5e35b1',
    [CargoStatus.HAS_DELIVERED]:  '#2e7d32',
    [CargoStatus.UNLOADING]:      '#2e7d32',
    [CargoStatus.WAIT_COMPLETE]:  '#00897b',
    [CargoStatus.COMPLETED]:      '#00695c',
    [CargoStatus.PROBLEMS]:       '#c62828',
};

// Описания статусов
export const STATUS_DESCRIPTIONS: Record<CargoStatus, string> = {
    [CargoStatus.NEW]:            'Заказ создан, нужно опубликовать',
    [CargoStatus.WAITING]:        'Ожидаем предложения от водителей',
    [CargoStatus.HAS_ORDERS]:     'Есть предложения, выберите водителя',
    [CargoStatus.ACCEPTED]:       'Водитель принят',
    [CargoStatus.WAIT_LOAD]:      'Ожидается загрузка',
    [CargoStatus.LOADING]:        'Идёт загрузка',
    [CargoStatus.HAS_LOADED]:     'Есть загруженные позиции',
    [CargoStatus.IN_TRANSIT]:     'Груз в пути',
    [CargoStatus.HAS_DELIVERED]:  'Есть доставленные позиции',
    [CargoStatus.UNLOADING]:      'Идёт разгрузка',
    [CargoStatus.WAIT_COMPLETE]:  'Ожидается завершение заказа',
    [CargoStatus.COMPLETED]:      'Заказ завершён',
    [CargoStatus.PROBLEMS]:       'По заказу возникли проблемы',
};

// Статусы, при которых можно редактировать груз
export const EDITABLE_STATUSES = [
    CargoStatus.NEW,
    CargoStatus.WAITING,
    CargoStatus.HAS_ORDERS,
];

// Статусы, при которых можно удалить груз
export const DELETABLE_STATUSES = [
    CargoStatus.NEW,
    CargoStatus.WAITING,
];

// Статусы, при которых можно опубликовать груз
export const PUBLISHABLE_STATUSES = [
    CargoStatus.NEW,
];


// Лимиты для полей
export const FIELD_LIMITS = {
    name:                       { min: 3, max: 100 },
    description:                { max: 1000 },
    city:                       { min: 2, max: 50 },
    address:                    { max: 200 },
    weight:                     { min: 0.1, max: 50 },
    volume:                     { min: 0.1, max: 100 },
    price:                      { min: 1000, max: 10000000 },
    face:                       { min: 5, max: 100 },
    phone:                      { min: 10, max: 15 }
};

// Сообщения валидации
export const VALIDATION_MESSAGES = {
    required:                   'Поле обязательно для заполнения',
    minLength:                  'Слишком короткое значение',
    maxLength:                  'Слишком длинное значение',
    min:                        'Значение слишком маленькое',
    max:                        'Значение слишком большое',
    email:                      'Неверный формат email',
    phone:                      'Неверный формат телефона',
    
    // Специфичные сообщения
    nameRequired:               'Название груза обязательно',
    cityRequired:               'Город обязателен',
    priceRequired:              'Цена обязательна',
    weightRequired:             'Вес обязателен',
    phoneRequired:              'Телефон обязателен',
    contactRequired:            'Контактное лицо обязательно',
    dateRequired:               'Дата обязательна',
    
    // Кросс-полевые
    sameCities:                 'Города отправления и назначения не могут совпадать',
    dateOrder:                  'Дата выгрузки должна быть позже даты загрузки'
};

// Паттерны валидации
export const VALIDATION_PATTERNS = {
    phone: /^[\+]?[0-9\s\-\(\)]{10,}$/,
    cityName: /^[а-яё\s\-]+$/i,
    personName: /^[а-яё\s\-\.]+$/i
};

// Популярные города для автодополнения
export const POPULAR_CITIES = [
    "Москва",
    "Санкт-Петербург", 
    "Новосибирск",
    "Екатеринбург",
    "Казань",
    "Нижний Новгород",
    "Челябинск",
    "Самара",
    "Омск",
    "Ростов-на-Дону"
];

// WebSocket события
export const SOCKET_EVENTS = {
    SAVE_CARGO:         'save_cargo',
    DELETE_CARGO:       'delete_cargo', 
    PUBLISH_CARGO:      'publish',
    CARGO_UPDATED:      'cargo_updated',
    NEW_OFFER:          'new_offer',
    CONNECT:            'connect',
    DISCONNECT:         'disconnect'
};

// Таймауты
export const TIMEOUTS = {
    AUTO_SAVE: 3000,
    SEARCH_DEBOUNCE: 300,
    API_REQUEST: 30000
};

// Форматы
export const FORMATS = {
    DATE_DISPLAY: 'DD.MM.YYYY',
    DATE_INPUT: 'YYYY-MM-DD',
    CURRENCY: 'ru-RU'
};

// Настройки по умолчанию
export const DEFAULT_SETTINGS = {
    pageSize: 20,
    autoSave: false,
    validateOnChange: true,
    showWarnings: true
};
