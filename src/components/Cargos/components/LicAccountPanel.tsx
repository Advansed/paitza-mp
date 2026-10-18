import React, { useMemo } from 'react';
import { IonSpinner } from '@ionic/react';
import { Landmark } from 'lucide-react';
import { formatters } from '../../../utils/utils';
import type { LicAccountData } from '../hooks/useLicAccount';
import styles from './LicAccountPanel.module.css';

const LABELS: Record<string, string> = {
  name: 'Наименование',
  short_name: 'Краткое название',
  client: 'Владелец',
  fio: 'ФИО',
  inn: 'ИНН',
  kpp: 'КПП',
  ogrn: 'ОГРН',
  address: 'Адрес',
  postal_address: 'Почтовый адрес',
  phone: 'Телефон',
  email: 'Email',
  bank_name: 'Банк',
  bank: 'Банк',
  bank_bik: 'БИК',
  bik: 'БИК',
  bank_account: 'Расчётный счёт',
  account: 'Расчётный счёт',
  rs: 'Расчётный счёт',
  bank_corr_account: 'Корр. счёт',
  correspondent_account: 'Корр. счёт',
  ks: 'Корр. счёт',
  lic: 'Лицевой счёт',
  lic_number: 'Лицевой счёт',
  number: 'Номер счёта',
  balance: 'Баланс',
  summ: 'Сумма',
  amount: 'Сумма',
};

const MONEY_KEYS = new Set(['balance', 'summ', 'amount']);
const SKIP_KEYS = new Set([
  'guid',
  'id',
  'token',
  'success',
  'message',
  'data',
  'recipient',
  'cargo',
]);

function asText(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'string') return value.trim();
  return '';
}

type LicAccountPanelProps = {
  data: LicAccountData | null;
  isLoading?: boolean;
  error?: string | null;
};

export const LicAccountPanel: React.FC<LicAccountPanelProps> = ({
  data,
  isLoading,
  error,
}) => {
  const rows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .filter(([key, value]) => {
        if (SKIP_KEYS.has(key) || key.startsWith('_')) return false;
        if (value != null && typeof value === 'object') return false;
        return Boolean(asText(value));
      })
      .map(([key, value]) => {
        const text = asText(value);
        const money = MONEY_KEYS.has(key) && Number.isFinite(Number(value));
        return {
          key,
          label: LABELS[key] || key,
          value: money ? formatters.currency(Number(value)) : text,
        };
      });
  }, [data]);

  return (
    <section className={styles.card} aria-label="Лицевой счёт">
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden>
          <Landmark size={16} strokeWidth={1.75} />
        </span>
        <div>
          <div className={styles.kicker}>Лицевой счёт</div>
          <h2 className={styles.title}>Данные счёта</h2>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.state}>
          <IonSpinner name="crescent" />
          <span>Загрузка реквизитов…</span>
        </div>
      ) : error ? (
        <div className={styles.state}>{error}</div>
      ) : rows.length === 0 ? (
        <div className={styles.state}>Данные лицевого счёта не найдены</div>
      ) : (
        <dl className={styles.grid}>
          {rows.map((row) => (
            <div key={row.key} className={styles.row}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};
