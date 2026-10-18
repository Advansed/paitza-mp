import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IonButton } from '@ionic/react';
import styles from '../../Profile/Profile.module.css';
import {
  COMPANY_TYPES,
  COMPANY_TYPE_LABELS,
  CompanyData,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY,
  EMPTY_COMPANY,
  toSetCompanyPayload,
} from '../../../Store/companyStore';
import {
  COMPANY_COUNTRIES,
  COMPANY_CURRENCIES,
  findCompanyCountry,
} from '../../../Store/companyCountries';
import { useToast } from '../../Toast';

interface CustomerInfoProps {
  companyData: CompanyData | null;
  onSave: (data: Partial<CompanyData>) => Promise<void>;
  /** Без собственной карточки — поля внутри внешней секции */
  embedded?: boolean;
  consentSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

type FormState = Required<
  Pick<
    CompanyData,
    | 'company_type'
    | 'country_code'
    | 'currency'
    | 'tax_number'
    | 'tax_number_2'
    | 'reg_number'
    | 'duns'
    | 'name'
    | 'short_name'
    | 'name_en'
    | 'basis'
    | 'address'
    | 'postal_address'
    | 'address_en'
    | 'phone'
    | 'email'
    | 'description'
    | 'bank_beneficiary_name'
    | 'bank_name'
    | 'bank_address'
    | 'bank_country_code'
    | 'bank_account'
    | 'iban'
    | 'swift_bic'
    | 'local_bank_code'
    | 'intermediary_bank_name'
    | 'intermediary_bank_swift'
    | 'intermediary_bank_account'
  >
>;

type TextKey = Exclude<keyof FormState, 'company_type'>;

const OTHER_OPTION = 'OTHER';
const SWIFT_RE = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
const IBAN_RE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;

function toForm(data: CompanyData | null): FormState {
  const src = { ...EMPTY_COMPANY, ...(data || {}) };
  return {
    company_type: Number(src.company_type ?? COMPANY_TYPES.LEGAL),
    country_code: (src.country_code || DEFAULT_COUNTRY_CODE).toUpperCase(),
    currency: (src.currency || DEFAULT_CURRENCY).toUpperCase(),
    tax_number: src.tax_number || '',
    tax_number_2: src.tax_number_2 || '',
    reg_number: src.reg_number || '',
    duns: src.duns || '',
    name: src.name || '',
    short_name: src.short_name || '',
    name_en: src.name_en || '',
    basis: src.basis || '',
    address: src.address || '',
    postal_address: src.postal_address || '',
    address_en: src.address_en || '',
    phone: src.phone || '',
    email: src.email || '',
    description: src.description || '',
    bank_beneficiary_name: src.bank_beneficiary_name || '',
    bank_name: src.bank_name || '',
    bank_address: src.bank_address || '',
    bank_country_code: src.bank_country_code || '',
    bank_account: src.bank_account || '',
    iban: src.iban || '',
    swift_bic: src.swift_bic || '',
    local_bank_code: src.local_bank_code || '',
    intermediary_bank_name: src.intermediary_bank_name || '',
    intermediary_bank_swift: src.intermediary_bank_swift || '',
    intermediary_bank_account: src.intermediary_bank_account || '',
  };
}

const digits = (max: number) => (v: string) => v.replace(/\D/g, '').slice(0, max);
const upperCode = (max: number) => (v: string) => v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, max);
const letters2 = (v: string) => v.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);

export const CustomerInfo: React.FC<CustomerInfoProps> = ({
  companyData,
  onSave,
  embedded = false,
  consentSlot,
  footerSlot,
}) => {
  const { t } = useTranslation('settings');
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => toForm(companyData));
  const [showIntermediary, setShowIntermediary] = useState(false);

  useEffect(() => {
    if (!companyData) return;
    const next = toForm(companyData);
    setForm(next);
    if (next.intermediary_bank_name || next.intermediary_bank_swift) setShowIntermediary(true);
  }, [companyData]);

  const isRu = form.country_code === 'RU';
  const country = findCompanyCountry(form.country_code);
  const isKnownCountry = COMPANY_COUNTRIES.some((c) => c.code === form.country_code);
  const isLegal = form.company_type === COMPANY_TYPES.LEGAL;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCountryChange = (value: string) => {
    if (value === OTHER_OPTION) {
      setForm((prev) => ({ ...prev, country_code: '', currency: 'USD' }));
      return;
    }
    const next = findCompanyCountry(value);
    setForm((prev) => ({ ...prev, country_code: next.code, currency: next.currency }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return t('nameRequired');
    if (!form.tax_number.trim()) return t('taxRequired', { label: country.taxLabel });
    if (!/^[A-Z]{2}$/.test(form.country_code)) return t('countryCodeError');
    if (isRu && !/^(\d{10}|\d{12})$/.test(form.tax_number)) return t('innError');
    if (form.duns && !/^\d{9}$/.test(form.duns)) return t('dunsError');
    const iban = form.iban.replace(/\s+/g, '').toUpperCase();
    if (iban && !IBAN_RE.test(iban)) return t('ibanError');
    const swift = form.swift_bic.replace(/\s+/g, '').toUpperCase();
    if (swift && !SWIFT_RE.test(swift)) return t('swiftError');
    const midSwift = form.intermediary_bank_swift.replace(/\s+/g, '').toUpperCase();
    if (midSwift && !SWIFT_RE.test(midSwift)) return t('midSwiftError');
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    await onSave(
      toSetCompanyPayload({
        ...form,
        guid: companyData?.guid,
        tax_number_2: isRu && !isLegal ? '' : form.tax_number_2,
        payout_type: companyData?.payout_type,
        card_number_mask: companyData?.card_number_mask,
      })
    );
  };

  const text = (
    key: TextKey,
    label: string,
    opts: { placeholder?: string; format?: (v: string) => string; inputMode?: 'numeric' | 'email' | 'tel' | 'text' } = {}
  ) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        type="text"
        inputMode={opts.inputMode}
        className={styles.input}
        value={form[key]}
        onChange={(e) => set(key, opts.format ? opts.format(e.target.value) : e.target.value)}
        placeholder={opts.placeholder}
      />
    </div>
  );

  const fields = (
    <>
      {consentSlot}

      <div className={styles.formFields}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>{t('country')}</label>
            <select
              className={styles.input}
              value={isKnownCountry ? form.country_code : OTHER_OPTION}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              {COMPANY_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
              <option value={OTHER_OPTION}>{t('otherCountry')}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('companyType')}</label>
            <select
              className={styles.input}
              value={form.company_type}
              onChange={(e) => set('company_type', Number(e.target.value))}
            >
              {Object.values(COMPANY_TYPES).map((t) => (
                <option key={t} value={t}>
                  {COMPANY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.fieldRow}>
          {!isKnownCountry
            ? text('country_code', t('countryCode'), { placeholder: 'US', format: letters2 })
            : null}
          <div className={styles.field}>
            <label className={styles.label}>{t('currency')}</label>
            <select
              className={styles.input}
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
            >
              {(COMPANY_CURRENCIES.includes(form.currency)
                ? COMPANY_CURRENCIES
                : [form.currency, ...COMPANY_CURRENCIES]
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isRu ? (
          <>
            <div className={styles.fieldRow}>
              {text('tax_number', t('inn'), { placeholder: t('innPh'), format: digits(12), inputMode: 'numeric' })}
              {isLegal
                ? text('tax_number_2', t('kpp'), { placeholder: '9', format: digits(9), inputMode: 'numeric' })
                : text('reg_number', t('ogrnip'), { placeholder: '15', format: digits(15), inputMode: 'numeric' })}
            </div>
            {text('name', t('companyName'), { placeholder: isLegal ? t('companyName') : t('fullNamePh') })}
            <div className={styles.fieldRow}>
              {text('short_name', t('shortName'), { placeholder: t('companyName') })}
              {isLegal
                ? text('reg_number', t('ogrn'), { placeholder: '13', format: digits(15), inputMode: 'numeric' })
                : null}
            </div>
          </>
        ) : (
          <>
            <div className={styles.fieldRow}>
              {text('tax_number', country.taxLabel, { placeholder: t('taxPh'), format: upperCode(32) })}
              {text('tax_number_2', country.tax2Label, { placeholder: t('optional'), format: upperCode(32) })}
            </div>
            <div className={styles.fieldRow}>
              {text('reg_number', country.regLabel, { placeholder: t('regNumberPh'), format: upperCode(32) })}
              {text('duns', 'DUNS', { placeholder: '9', format: digits(9), inputMode: 'numeric' })}
            </div>
            {text('name', t('companyName'), { placeholder: t('companyName') })}
            <div className={styles.fieldRow}>
              {text('short_name', t('shortName'))}
              {text('name_en', t('nameEn'), { placeholder: 'Company Ltd.' })}
            </div>
          </>
        )}

        {text('address', t('legalAddress'), { placeholder: t('addressPh') })}
        <div className={styles.fieldRow}>
          {text('postal_address', t('postalAddress'))}
          {!isRu ? text('address_en', t('addressEn'), { placeholder: 'Street, city, country' }) : null}
        </div>

        <div className={styles.fieldRow}>
          {text('basis', t('basis'), { placeholder: t('basisPh') })}
          {text('description', t('representative'), { placeholder: t('fullName') })}
        </div>

        <div className={styles.fieldRow}>
          {text('phone', t('phone', { ns: 'drivers' }), { placeholder: '+7…', inputMode: 'tel' })}
          {text('email', 'Email', { placeholder: 'mail@company.com', inputMode: 'email' })}
        </div>

        <div className={styles.sectionDivider}>
          <p className={styles.sectionLabel}>{t('bankDetails')}</p>
          <div className={styles.formFields}>
            {isRu ? (
              <>
                <div className={styles.fieldRow}>
                  {text('local_bank_code', 'BIK', { placeholder: '044525225', format: digits(9), inputMode: 'numeric' })}
                  {text('bank_name', t('bank'), { placeholder: t('bankNamePh') })}
                </div>
                <div className={styles.fieldRow}>
                  {text('intermediary_bank_account', t('corrAccount'), { placeholder: '30101…', format: digits(20), inputMode: 'numeric' })}
                  {text('bank_account', t('account'), { placeholder: '40702…', format: digits(20), inputMode: 'numeric' })}
                </div>
              </>
            ) : (
              <>
                {text('bank_beneficiary_name', t('beneficiary'), { placeholder: t('beneficiaryPh') })}
                <div className={styles.fieldRow}>
                  {text('bank_name', t('bank'), { placeholder: 'Bank name' })}
                  {text('bank_country_code', t('bankCountry'), { placeholder: 'CN', format: letters2 })}
                </div>
                {text('bank_address', t('bankAddress'))}
                <div className={styles.fieldRow}>
                  {text('iban', 'IBAN', { placeholder: 'DE89 3704 0044 0532 0130 00', format: (v) => v.toUpperCase().slice(0, 42) })}
                  {text('bank_account', t('accountNumber'), { placeholder: t('noIban'), format: (v) => v.slice(0, 50) })}
                </div>
                <div className={styles.fieldRow}>
                  {text('swift_bic', 'SWIFT / BIC', { placeholder: t('swiftPh'), format: upperCode(11) })}
                  {text('local_bank_code', t('localBankCode'), { placeholder: 'Sort code, routing…', format: (v) => v.slice(0, 32) })}
                </div>

                {showIntermediary ? (
                  <>
                    <p className={styles.sectionLabel}>{t('intermediary')}</p>
                    {text('intermediary_bank_name', t('intermediaryName'))}
                    <div className={styles.fieldRow}>
                      {text('intermediary_bank_swift', t('intermediarySwift'), { format: upperCode(11) })}
                      {text('intermediary_bank_account', t('intermediaryAccount'), { format: (v) => v.slice(0, 50) })}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.consentTextLink}
                    onClick={() => setShowIntermediary(true)}
                  >
                    + {t('addIntermediary')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        {footerSlot}
        <IonButton color="primary" className={styles.saveBtn} onClick={handleSave}>
          {t('saveOrg')}
        </IonButton>
      </div>
    </>
  );

  if (embedded) {
    return <div className={styles.embeddedBody}>{fields}</div>;
  }

  return <div className={styles.card}>{fields}</div>;
};
