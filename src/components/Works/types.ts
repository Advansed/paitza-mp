/**
 * Типы для модуля Works (работы для водителей)
 */

import { CargoAddress, CargoRoutePoint } from "../../Store/cargoStore";


// Статусы работ с точки зрения водителя
export enum WorkStatus {
    NEW         = "Новый",              // Доступна для предложения             10
    OFFERED     = "Торг",               // Водитель сделал предложение          11    
    TO_LOAD     = "На погрузку",        // Едет на погрузку                     12    
    ON_LOAD     = "На погрузке",        // Прибыл на погрузку                   13 
    LOADING     = "Загружается",        // Загружается                          14 
    LOADED      = "Загружено",          // Загрузился                           15 
    IN_WORK     = "В работе",           // Груз в работе                        16
    TO_UNLOAD   = "Доставлено",         // Прибыл на место выгрузки             17
    UNLOADING   = "Разгружается",        // Груз выгружается                     18
    UNLOADED    = "Разгружено",          // Груз выгружен                        19
    COMPLETED   = "Завершено",         // Работа завершена                     20
    REJECTED    = "Отказано"            // Отказано                             21    
}

// Приоритет работы
export enum WorkPriority {
    LOW = "Низкий",
    NORMAL = "Обычный",
    HIGH = "Высокий",
    URGENT = "Срочный"
}

// Информация о предложении водителя
export interface OfferInfo {

    guid: string;
    recipient: string;
    price: number;
    weight: number;
    volume: number;
    transport: string;
    comment: string;
    status: number;

}


// Статусы предложения
export enum OfferStatus {
    PENDING = "Ожидает",
    ACCEPTED = "Принят",
    REJECTED = "Отклонен"
}

/** Компания заказчика, приходит с заказом */
export interface WorkCompany {
    id: string;
    name: string;
    verified?: boolean;
    rating?: number;
    deals?: number;
}

// Основная информация о работе (адаптированная CargoInfo)
export interface WorkInfo {
    guid: string;
    cargo: string;           // ID исходного груза
    recipient: string;       // ID заказчика
    client: string;          // Имя заказчика
    company?: WorkCompany;
    name: string;
    transport: string;
    description: string;

    // Адреса (переиспользуем из Cargos)
    address: CargoAddress;
    destiny: CargoAddress;
    route?: CargoRoutePoint[];

    // Характеристики груза
    weight: number;
    volume: number;
    price: number;
    advance: number;
    insurance: number;

    pickup_date: string;
    delivery_date: string;

    // Контакты
    phone: string;
    face: string;

    // Статус работы
    status: WorkStatus;
    priority?: WorkPriority;

    // Предложения
    offers?: OfferInfo[];
    currentOffer?: OfferInfo;  // Текущее предложение водителя

    // Метаданные
    publish_date?: string;
    updatedAt?: string;

    signed: boolean;

    /** Тип кузова, если приходит строкой (тент, рефрижератор) */
    body_type?: string;
    loading_type?: string;
    category?: string;
    /** Сколько машин нужно на заказ (мультирейс) */
    vehicles_total?: number;
    /** Сколько машин уже в работе */
    vehicles_busy?: number;
    /** Имена файлов по заказу, если приходят с сервера */
    documents?: string[];
    /** Длина автомобильного маршрута, км */
    route_distance?: number;
}

// Данные для создания предложения
export interface CreateOfferData {
    workId: string;
    transportId: string;
    price: number;
    weight: number;
    comment?: string;
}

// Фильтры для списка работ
export interface WorkFilters {
    status?: WorkStatus[];
    cityFrom?: string;
    cityTo?: string;
    priceMin?: number;
    priceMax?: number;
    weightMin?: number;
    weightMax?: number;
    dateFrom?: string;
    dateTo?: string;
}

// Типы страниц для навигации
export type WorkPageType =
    | { type: 'list' }
    | { type: 'view'; work: WorkInfo }
    | { type: 'offer'; work: WorkInfo }
    | { type: 'archive' }
    | { type: 'map'; work: WorkInfo }
    | { type: 'page1'; work: WorkInfo }
    | { type: 'page2'; work: WorkInfo }
    | { type: 'agreement'; work: WorkInfo; contract?: any };

// Состояние формы предложения
export interface OfferFormState {
    data: CreateOfferData;
    isValid: boolean;
    isSubmitting: boolean;
    isDirty: boolean;
}

// Действия с формой предложения
export interface OfferFormActions {
    setFieldValue: (fieldPath: string, value: any) => void;
    resetForm: () => void;
    submitForm: () => Promise<boolean>;
}

// Хук управления работами
export interface UseWorksReturn {
    // Состояние
    works: WorkInfo[];
    isLoading: boolean;

    // Операции с предложениями
    createOffer: (data: CreateOfferData) => Promise<boolean>;
    updateOffer: (offerId: string, data: Partial<OfferInfo>) => Promise<boolean>;
    cancelOffer: (offerId: string) => Promise<boolean>;
    markCompleted: (workId: string) => Promise<boolean>;

    // Навигация
    currentPage: WorkPageType;
    navigateTo: (page: WorkPageType) => void;
    goBack: () => void;

    // Фильтрация и поиск
    filters: WorkFilters;
    setFilters: (filters: WorkFilters) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Утилиты
    getWork: (guid: string) => WorkInfo | undefined;
    refreshWorks: () => Promise<void>;
}

// Хук формы предложения
export interface UseOfferFormReturn {
    // Состояние формы
    formState: OfferFormState;

    // Действия
    actions: OfferFormActions;

    // Валидация
    validateField: (fieldPath: string) => string | null;
    hasErrors: () => boolean;
    getFieldError: (fieldPath: string) => string | undefined;

    // Инициализация
    initializeForm: (workInfo: WorkInfo) => void;

    getMaxWeight: () => number;
    getRecommendedPrice: () => number;
    getPricePerTon: () => number;
    canSubmit: () => boolean;

    workInfo?: WorkInfo;
}

// Транспорт водителя (для селекта)
export interface DriverTransport {
    guid: string;
    name: string;
    type: string;
    capacity: number;
    year?: number;
    number?: string;
}

// Параметры сортировки работ
export interface WorkSortOptions {
    field: 'publish_date' | 'createdAt' | 'price' | 'weight' | 'distance';
    direction: 'asc' | 'desc';
}

// Группировка работ для отображения
export interface WorkGroup {
    title: string;
    works: WorkInfo[];
    count: number;
}


// В types/index.ts обновить UseWorksReturn:

export interface UseWorksReturn {
    // Существующие поля
    works: WorkInfo[];
    isLoading: boolean;
    currentPage: WorkPageType;
    filters: WorkFilters;
    searchQuery: string;

    // Архив (добавить)
    archiveWorks: WorkInfo[];

    // Существующие методы
    navigateTo: (page: WorkPageType) => void;
    goBack: () => void;
    setFilters: (filters: WorkFilters) => void;
    setSearchQuery: (query: string) => void;
    createOffer: (data: CreateOfferData) => Promise<boolean>;
    markCompleted: (guid: string) => Promise<boolean>;
    cancelOffer: (offerId: string) => Promise<boolean>;
    getWork: (guid: string) => WorkInfo | undefined;
    refreshWorks: () => Promise<void>;
}

