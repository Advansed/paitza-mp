import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useTransportItems, transportDisplayName } from '../../Store/transportStore';
import type { AddMemberInput } from '../../Store/membersStore';
import { formatPhone } from '../Login/utils';
import styles from '../Settings/components/VehicleModal.module.css';
import own from './DriversPage.module.css';

type AddDriverModalProps = {
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: AddMemberInput) => Promise<boolean>;
};

export const AddDriverModal: React.FC<AddDriverModalProps> = ({ saving = false, onClose, onSubmit }) => {
  const { t } = useTranslation('drivers');
  const transports = useTransportItems();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [transportId, setTransportId] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const options = useMemo(
    () =>
      transports
        .map((item) => {
          const value = item.id ?? item.guid;
          if (value == null || value === '') return null;
          const title = transportDisplayName(item) || t('vehicleFallback');
          const plate = item.license_plate || item.number || '';
          return { value: String(value), label: plate ? `${title} · ${plate}` : title };
        })
        .filter((o): o is { value: string; label: string } => Boolean(o)),
    [transports, t]
  );

  const phoneDigits = phone.replace(/\D/g, '');
  const nameError = touched && !name.trim() ? t('nameRequired') : '';
  const phoneError = touched && phoneDigits.length < 10 ? t('phoneRequired') : '';
  const canSubmit = Boolean(name.trim() && phoneDigits.length >= 10 && !saving);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    const input: AddMemberInput = { name: name.trim(), phone: formatPhone(phone) };
    if (transportId) {
      input.transport_id = /^\d+$/.test(transportId) ? Number(transportId) : transportId;
    }
    const ok = await onSubmit(input);
    if (ok) onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <h2 id="driver-modal-title" className={styles.title}>
            {t('add')}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('close', { ns: 'common' })}>
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span>
              {t('name')} <i>*</i>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              autoFocus
            />
            {nameError && <em className={own.fieldError}>{nameError}</em>}
          </label>

          <label className={styles.field}>
            <span>
              {t('phone')} <i>*</i>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 000-00-00"
            />
            {phoneError && <em className={own.fieldError}>{phoneError}</em>}
          </label>

          <label className={styles.field}>
            <span>{t('vehicle')}</span>
            <select
              value={transportId}
              onChange={(e) => setTransportId(e.target.value)}
              disabled={!options.length}
            >
              <option value="">{t('noVehicle')}</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {!options.length && (
              <em className={own.fieldHint}>{t('vehicleHint')}</em>
            )}
          </label>

          <p className={own.modalNote}>
            {t('autoAssign')}
          </p>

          <div className={styles.actions}>
            <button type="submit" className={styles.submit} disabled={saving}>
              {saving ? t('saving') : t('addShort')}
            </button>
            <button type="button" className={styles.cancel} onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
