import { WorkInfo, WorkStatus, OfferStatus, CreateOfferData } from './types';
import { 
    OFFER_FIELD_LIMITS, 
    OFFER_VALIDATION_MESSAGES, 
    WORK_STATUS_CLASSES,
    WORK_STATUS_COLORS,
    WORK_STATUS_DESCRIPTIONS,
    OFFER_STATUS_CLASSES,
    OFFER_STATUS_COLORS,
    OFFERABLE_STATUSES,
    CANCELABLE_STATUSES,
    COMPLETABLE_STATUSES,
    EMPTY_OFFER
} from './constants';

// Переиспользуем базовые форматтеры из Cargos
import { formatters as cargoFormatters } from '../../utils/utils';

export function getWorkCustomerName(work: WorkInfo): string {
    return work.company?.name || work.client || work.face || '';
}

// ======================
// УТИЛИТЫ ВАЛИДАЦИИ
// ======================

// Валидация отдельного поля предложения
export const validateOfferField = (fieldPath: string, value: any, workInfo?: WorkInfo): string | null => {
    const limits = OFFER_FIELD_LIMITS;

    switch (fieldPath) {
        case 'transportId':
            return !value ? OFFER_VALIDATION_MESSAGES.transportRequired : null;

        case 'price':
            if (!value || value <= 0) return OFFER_VALIDATION_MESSAGES.priceRequired;
            if (value < limits.price.min) return OFFER_VALIDATION_MESSAGES.priceMin;
            if (value > limits.price.max) return OFFER_VALIDATION_MESSAGES.priceMax;
            return null;

        case 'weight':
            if (!value || value <= 0) return OFFER_VALIDATION_MESSAGES.weightRequired;
            if (value < limits.weight.min) return OFFER_VALIDATION_MESSAGES.weightMin;
            if (workInfo && value > workInfo.weight) return OFFER_VALIDATION_MESSAGES.weightMax;
            return null;

        case 'comment':
            if (value && value.length > limits.comment.max) return OFFER_VALIDATION_MESSAGES.commentMax;
            return null;

        default:
            return null;
    }
};


// ======================
// УТИЛИТЫ ФОРМАТИРОВАНИЯ  
// ======================

export const workFormatters = {
    // Переиспользуем форматтеры из Cargos
    ...cargoFormatters,

    // Специфичные для работ форматтеры
    workRoute: (fromCity: string, toCity: string): string => {
        if (!fromCity || !toCity) return '';
        return `${fromCity} → ${toCity}`;
    },

    // Расстояние (заглушка, в реальности нужен расчет)
    distance: (fromCity: string, toCity: string): string => {
        // В реальном приложении здесь был бы расчет расстояния
        const mockDistance = Math.floor(Math.random() * 1000) + 100;
        return `~${mockDistance} км`;
    },

    // Цена за тонну
    pricePerTon: (totalPrice: number, weight: number): string => {
        if (weight <= 0) return '';
        const pricePerTon = totalPrice / weight;
        return cargoFormatters.currency(pricePerTon) + '/т';
    },

    // Статус предложения
    offerStatus: (status: OfferStatus): string => {
        const statusMap = {
            [OfferStatus.PENDING]: 'Ожидает ответа',
            [OfferStatus.ACCEPTED]: 'Принято',
            [OfferStatus.REJECTED]: 'Отклонено'
        };
        return statusMap[status] || status;
    },

    // Время создания предложения
    offerTime: (createdAt: string): string => {
        try {
            const date = new Date(createdAt);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            
            if (diffHours < 1) return 'только что';
            if (diffHours < 24) return `${diffHours} ч. назад`;
            
            return cargoFormatters.date(createdAt);
        } catch {
            return createdAt;
        }
    }
};

// ======================
// УТИЛИТЫ СТАТУСОВ РАБОТ
// ======================

export const workStatusUtils = {
    // CSS класс статуса
    getClassName: (status: WorkStatus): string => {
        return WORK_STATUS_CLASSES[status] || 'cr-status-1';
    },

    // Цвет статуса
    getColor: (status: WorkStatus): string => {
        return WORK_STATUS_COLORS[status] || '#1976d2';
    },

    // Описание статуса
    getDescription: (status: WorkStatus): string => {
        return WORK_STATUS_DESCRIPTIONS[status] || '';
    },

    // Можно ли создать предложение
    canOffer: (status: WorkStatus): boolean => {
        return OFFERABLE_STATUSES.includes(status);
    },

    // Можно ли отменить предложение
    canCancel: (status: WorkStatus): boolean => {
        return CANCELABLE_STATUSES.includes(status);
    },

    // Можно ли отметить как выполненную
    canComplete: (status: WorkStatus): boolean => {
        return COMPLETABLE_STATUSES.includes(status);
    },

    // Следующий статус
    getNextStatus: (currentStatus: WorkStatus): WorkStatus | null => {
        switch (currentStatus) {
            case WorkStatus.NEW:
                return WorkStatus.OFFERED;
            case WorkStatus.OFFERED:
                return WorkStatus.IN_WORK;
            case WorkStatus.IN_WORK:
                return WorkStatus.COMPLETED;
            default:
                return null;
        }
    }
};

// ======================
// УТИЛИТЫ СТАТУСОВ ПРЕДЛОЖЕНИЙ
// ======================

export const offerStatusUtils = {
    // CSS класс статуса предложения
    getClassName: (status: OfferStatus): string => {
        return OFFER_STATUS_CLASSES[status] || 'cr-status-1';
    },

    // Цвет статуса предложения
    getColor: (status: OfferStatus): string => {
        return OFFER_STATUS_COLORS[status] || '#1976d2';
    }
};

// ======================
// УТИЛИТЫ РАБОТЫ С ДАННЫМИ
// ======================

export const workDataUtils = {
    // Создание пустого предложения
    createEmptyOffer: (workId: string): CreateOfferData => ({
        ...EMPTY_OFFER,
        workId
    }),

    // Генерация ID предложения
    generateOfferId: (): string => {
        return 'offer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Парсинг числа
    parseNumber: (value: string | number): number => {
        if (typeof value === 'number') return value;
        const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    },

    // Фильтрация работ по статусу
    filterByStatus: (works: WorkInfo[], statuses: WorkStatus[]): WorkInfo[] => {
        return works.filter(work => statuses.includes(work.status));
    },

    // Поиск работ
    searchWorks: (works: WorkInfo[], query: string): WorkInfo[] => {
        if (!query.trim()) return works;
        
        const lowerQuery = query.toLowerCase();
        return works.filter(work => 
            work.name.toLowerCase().includes(lowerQuery) ||
            work.address?.city.city.toLowerCase().includes(lowerQuery) ||
            work.destiny?.city.city.toLowerCase().includes(lowerQuery) ||
            (work.client || '').toLowerCase().includes(lowerQuery) ||
            (work.company?.name || '').toLowerCase().includes(lowerQuery)
        );
    },

    // Сортировка работ
    sortWorks: (works: WorkInfo[], field: string, direction: 'asc' | 'desc'): WorkInfo[] => {
        return [...works].sort((a, b) => {
            let valueA: any;
            let valueB: any;

            switch (field) {
                case 'createdAt':
                case 'publish_date':
                    valueA = new Date(a.publish_date || '').getTime();
                    valueB = new Date(b.publish_date || '').getTime();
                    break;
                case 'price':
                    valueA = a.price;
                    valueB = b.price;
                    break;
                case 'weight':
                    valueA = a.weight;
                    valueB = b.weight;
                    break;
                default:
                    valueA = a[field];
                    valueB = b[field];
            }

            if (direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    },

    // Группировка работ по статусу
    groupByStatus: (works: WorkInfo[]): Record<WorkStatus, WorkInfo[]> => {
        const groups: Record<WorkStatus, WorkInfo[]> = {
            [WorkStatus.NEW]:           [],
            [WorkStatus.OFFERED]:       [],
            [WorkStatus.TO_LOAD]:       [],
            [WorkStatus.ON_LOAD]:       [],
            [WorkStatus.IN_WORK]:       [], 
            [WorkStatus.TO_UNLOAD]:     [], 
            [WorkStatus.ON_UNLOAD]:     [],
            [WorkStatus.COMPLETED]:     []    
        };

        works.forEach(work => {
            if (groups[work.status]) {
                groups[work.status].push( work );
            }
        });

        return groups;
    },

};

// ======================
// ЭКСПОРТ ОСНОВНЫХ УТИЛИТ
// ======================

export default {
    format: workFormatters,
    status: workStatusUtils,
    offer: offerStatusUtils,
    data: workDataUtils
};