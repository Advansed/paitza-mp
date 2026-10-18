/**
 * Утилиты для модуля Cargos
 */

import i18n, { intlLocale } from '../i18n';
import { CargoStatus } from '../Store/cargoStore';
import { 
    STATUS_CLASSES,
    STATUS_COLORS,
    STATUS_DESCRIPTIONS,
    EDITABLE_STATUSES,
    DELETABLE_STATUSES,
    PUBLISHABLE_STATUSES
} from './constants';
import { normalizeCargoStatus } from '../components/Cargos/cargoStatusFlow';

// ======================
// УТИЛИТЫ ФОРМАТИРОВАНИЯ
// ======================

export const formatters = {
    // Форматирование валюты
    currency: (amount: number): string => {
        try {
            return new Intl.NumberFormat(intlLocale(), {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch {
            return `${amount} ₽`;
        }
    },

    // Форматирование веса
    weight: (weight: number, weight1 = 0): string => {
        const totalWeight = Math.max(0, weight - weight1);
        return i18n.t('tons', { ns: 'common', value: totalWeight.toFixed(1) });
    },

    // Форматирование объема
    volume: (volume: number): string => {
        return `${volume.toFixed(1)} м³`;
    },

    // Форматирование даты
    date: (dateString: string): string => {
        if (!dateString) return '';
        try {
            let date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // DD.MM.YYYY или DD.MM.YYYY HH:mm
                const m = String(dateString).trim().match(
                    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
                );
                if (m) {
                    date = new Date(
                        Number(m[3]),
                        Number(m[2]) - 1,
                        Number(m[1]),
                        Number(m[4] || 0),
                        Number(m[5] || 0),
                        Number(m[6] || 0)
                    );
                }
            }
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleDateString(intlLocale(), {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    },

    // Форматирование для input[type="date"]
    dateInput: (dateString: string): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    },

    // Форматирование телефона
    phone: (phone: string): string => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        
        if (digits.length === 11 && digits.startsWith('7')) {
            return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
        }
        
        if (digits.length === 10) {
            return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
        }
        
        return phone;
    },

    // Короткий ID
    shortId: (guid: string): string => {
        return guid ? guid.substring(0, 6).toUpperCase() : '';
    },

    // Маршрут
    route: (fromCity: string, toCity: string): string => {
        if (!fromCity || !toCity) return '';
        return `${fromCity} → ${toCity}`;
    },

    // Адрес
    address: (city: string, address?: string): string => {
        if (!city) return '';
        if (!address || address.trim() === '') return city;
        return `${city}, ${address}`;
    },

    // Относительная дата
    relativeDate: (dateString: string): string => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            const diffTime = inputDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === -1) return 'вчера';
            if (diffDays === 0) return 'сегодня';
            if (diffDays === 1) return 'завтра';
            
            return formatters.date(dateString);
        } catch {
            return dateString;
        }
    },

    /** Дата публикации: «только что» / «3 ч. назад» / «вчера» / DD.MM.YYYY */
    published: (dateString: string): string => {
        if (!dateString) return '';
        try {
            let date = new Date(dateString);
            if (isNaN(date.getTime())) {
                const m = String(dateString).trim().match(
                    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
                );
                if (m) {
                    date = new Date(
                        Number(m[3]),
                        Number(m[2]) - 1,
                        Number(m[1]),
                        Number(m[4] || 0),
                        Number(m[5] || 0),
                        Number(m[6] || 0)
                    );
                }
            }
            if (isNaN(date.getTime())) return formatters.date(dateString);

            const diffMs = Date.now() - date.getTime();
            if (diffMs < 0) return formatters.date(dateString);

            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) return 'только что';
            if (diffMins < 60) return `${diffMins} мин. назад`;
            if (diffHours < 24) return `${diffHours} ч. назад`;
            if (diffDays === 1) return 'вчера';
            if (diffDays < 7) return `${diffDays} дн. назад`;
            return formatters.date(dateString);
        } catch {
            return formatters.date(dateString);
        }
    },
};

// ======================
// УТИЛИТЫ СТАТУСОВ
// ======================

export const statusUtils = {
    // Получение CSS класса статуса
    getClassName: (status: CargoStatus | string): string => {
        const normalized = normalizeCargoStatus(status);
        return STATUS_CLASSES[normalized] || 'cr-status-1';
    },

    // Получение цвета статуса
    getColor: (status: CargoStatus | string): string => {
        const normalized = normalizeCargoStatus(status);
        return STATUS_COLORS[normalized] || '#1976d2';
    },

    // Получение описания статуса
    getDescription: (status: CargoStatus | string): string => {
        const normalized = normalizeCargoStatus(status);
        return STATUS_DESCRIPTIONS[normalized] || '';
    },

    // Проверка возможности редактирования
    canEdit: (status: CargoStatus | string): boolean => {
        return EDITABLE_STATUSES.includes(normalizeCargoStatus(status));
    },

    // Проверка возможности удаления
    canDelete: (status: CargoStatus | string): boolean => {
        return DELETABLE_STATUSES.includes(normalizeCargoStatus(status));
    },

    // Проверка возможности публикации
    canPublish: (status: CargoStatus | string): boolean => {
        return PUBLISHABLE_STATUSES.includes(normalizeCargoStatus(status));
    },

    // Получение следующего статуса
    getNextStatus: (currentStatus: CargoStatus | string): CargoStatus | null => {
        switch (normalizeCargoStatus(currentStatus)) {
            case CargoStatus.NEW:               return CargoStatus.WAITING;
            case CargoStatus.WAITING:           return CargoStatus.HAS_ORDERS;
            case CargoStatus.HAS_ORDERS:        return CargoStatus.ACCEPTED;
            case CargoStatus.ACCEPTED:          return CargoStatus.WAIT_LOAD;
            case CargoStatus.WAIT_LOAD:         return CargoStatus.LOADING;
            case CargoStatus.LOADING:           return CargoStatus.HAS_LOADED;
            case CargoStatus.HAS_LOADED:        return CargoStatus.IN_TRANSIT;
            case CargoStatus.IN_TRANSIT:        return CargoStatus.HAS_DELIVERED;
            case CargoStatus.HAS_DELIVERED:     return CargoStatus.UNLOADING;
            case CargoStatus.UNLOADING:         return CargoStatus.WAIT_COMPLETE;
            case CargoStatus.WAIT_COMPLETE:     return CargoStatus.COMPLETED;
            default:                            return null;
        }
    },

    // Получение прогресса в процентах
    getProgress: (status: CargoStatus | string): number => {
        const progressMap: Record<CargoStatus, number> = {
            [ CargoStatus.NEW ]:            0,
            [ CargoStatus.WAITING ]:        8,
            [ CargoStatus.HAS_ORDERS ]:     16,
            [ CargoStatus.ACCEPTED ]:       25,
            [ CargoStatus.WAIT_LOAD ]:      33,
            [ CargoStatus.LOADING ]:        41,
            [ CargoStatus.HAS_LOADED ]:     50,
            [ CargoStatus.IN_TRANSIT ]:     58,
            [ CargoStatus.HAS_DELIVERED ]:  66,
            [ CargoStatus.UNLOADING ]:      75,
            [ CargoStatus.WAIT_COMPLETE ]:  83,
            [ CargoStatus.COMPLETED ]:      100,
            [ CargoStatus.PROBLEMS ]:       0,
        };
        return progressMap[normalizeCargoStatus(status)] || 0;
    }
};
