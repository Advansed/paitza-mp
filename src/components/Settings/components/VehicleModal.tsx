import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, FileText, Truck, X } from 'lucide-react';
import {
  TransportData,
  useTransportTypes,
  resolveTransportTypeId,
  asTransportType,
  toTransportTypeId,
  transportDisplayName,
  transportDriverName,
} from '../../../Store/transportStore';
import { uploadTransportPhoto, uploadTransportSts, useResolvedImageSrc } from '../../../utils/fileUpload';
import { useLoginStore } from '../../../Store/loginStore';
import { isExecutorRole } from '../../../Store/roles';
import { useToast } from '../../Toast';
import styles from './VehicleModal.module.css';

type VehicleModalProps = {
  vehicle: TransportData | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (data: Partial<TransportData>) => Promise<void>;
};

export const VehicleModal: React.FC<VehicleModalProps> = ({
  vehicle,
  saving = false,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation('fleet');
  const types = useTransportTypes();
  const toast = useToast();
  const { name: userName, phone: userPhone, user_type } = useLoginStore();
  const isExecutor = isExecutorRole(user_type);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const stsInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(vehicle?.guid);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const savedPhotoSrc = useResolvedImageSrc(photoFile ? null : vehicle?.image);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [stsFile, setStsFile] = useState<File | null>(null);
  const [stsPreview, setStsPreview] = useState('');
  const savedStsSrc = useResolvedImageSrc(stsFile ? null : vehicle?.sts);
  const [stsUploading, setStsUploading] = useState(false);
  const [page, setPage] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: '',
    licensePlate: '',
    transportType: '',
    loadCapacity: '',
    volume: '',
    manufactureYear: '',
    driverFio: '',
    driverPhone: '',
  });

  useEffect(() => {
    const isNew = !vehicle?.guid;
    const defaultFio = isNew && isExecutor ? (userName || '') : '';
    const defaultPhone = isNew && isExecutor ? (userPhone || '') : '';

    setForm({
      name: transportDisplayName(vehicle),
      licensePlate: vehicle?.license_plate || vehicle?.number || '',
      transportType: resolveTransportTypeId(vehicle?.transport_type, types, vehicle?.type),
      loadCapacity: String(vehicle?.load_capacity ?? vehicle?.capacity ?? ''),
      volume: String(vehicle?.volume ?? ''),
      manufactureYear: String(vehicle?.manufacture_year ?? vehicle?.year ?? ''),
      driverFio: transportDriverName(vehicle) || defaultFio,
      driverPhone: vehicle?.driver_phone || (typeof vehicle?.driver === 'object' ? vehicle.driver?.phone || '' : '') || defaultPhone,
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setStsFile(null);
    setStsPreview('');
    setPage(1);
  }, [vehicle, types, isExecutor, userName, userPhone]);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
      if (stsPreview.startsWith('blob:')) URL.revokeObjectURL(stsPreview);
    };
  }, [photoPreview, stsPreview]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const currentType = asTransportType(vehicle?.transport_type);
  const busy = saving || photoUploading || stsUploading;
  const canSubmit = Boolean(form.name.trim() && form.licensePlate.trim() && !busy);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      toast.error(t('badFormat'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error(t('tooLarge'));
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleStsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      toast.error(t('badFormat'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error(t('tooLarge'));
      return;
    }

    setStsFile(file);
    setStsPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (page === 1) {
      setPage(2);
      return;
    }

    const finalDriverFio = form.driverFio.trim() || (isExecutor && !isEdit ? (userName || '') : '');
    const finalDriverPhone = form.driverPhone.trim() || (isExecutor && !isEdit ? (userPhone || '') : '');

    const data: Partial<TransportData> = {
      name: form.name.trim(),
      license_plate: form.licensePlate.trim(),
      driver_fio: finalDriverFio,
      driver_phone: finalDriverPhone,
      driver: finalDriverFio || finalDriverPhone ? { fio: finalDriverFio, phone: finalDriverPhone } : undefined,
    };

    if (form.transportType.trim()) {
      data.transport_type = toTransportTypeId(form.transportType);
    }
    if (form.loadCapacity.trim()) {
      const tons = parseFloat(form.loadCapacity.replace(',', '.'));
      if (!isNaN(tons)) data.load_capacity = tons;
    }
    if (form.volume.trim()) {
      const volume = parseFloat(form.volume.replace(',', '.'));
      if (!isNaN(volume)) data.volume = volume;
    }
    if (form.manufactureYear.trim()) {
      const year = parseInt(form.manufactureYear, 10);
      if (!isNaN(year)) data.manufacture_year = year;
    }

    const transportId = vehicle?.guid || (photoFile || stsFile ? crypto.randomUUID() : '');
    if (transportId && (photoFile || stsFile)) data.guid = transportId;

    if (photoFile) {
      setPhotoUploading(true);
      try {
        const { filePath } = await uploadTransportPhoto(photoFile, transportId);
        if (!filePath) throw new Error(t('noFilePath'));
        data.image = filePath;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('photoFailed'));
        setPhotoUploading(false);
        return;
      }
      setPhotoUploading(false);
    } else if (vehicle?.image) {
      data.image = vehicle.image;
    }

    if (stsFile) {
      setStsUploading(true);
      try {
        const { filePath } = await uploadTransportSts(stsFile, transportId);
        if (!filePath) throw new Error(t('noFilePath'));
        data.sts = filePath;
        data.verified = true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('stsFailed'));
        setStsUploading(false);
        return;
      }
      setStsUploading(false);
    } else if (vehicle?.sts) {
      data.sts = vehicle.sts;
      data.verified = true;
    }

    await onSave(data);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <div>
            <h2 id="vehicle-modal-title" className={styles.title}>
              {page === 2 ? t('stsTitle') : isEdit ? t('editTitle') : t('add')}
            </h2>
            <p className={styles.step}>{t('pageOf', { page, total: 2 })}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('close')}>
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {page === 1 && (
          <>
          <div className={styles.photoField}>
            <span>{t('photo')}</span>
            <button
              type="button"
              className={styles.photoFrame}
              onClick={() => photoInputRef.current?.click()}
              disabled={busy}
            >
              {photoPreview || savedPhotoSrc ? (
                <img src={photoPreview || savedPhotoSrc} alt={t('photo')} className={styles.photoImg} />
              ) : (
                <div className={styles.photoEmpty}>
                  <Truck size={36} strokeWidth={1.5} />
                  <p>{t('photoEmpty')}</p>
                  <span>{t('fileHint')}</span>
                </div>
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className={styles.fileInput}
              onChange={handlePhotoChange}
              disabled={busy}
            />
            <button
              type="button"
              className={styles.photoBtn}
              onClick={() => photoInputRef.current?.click()}
              disabled={busy}
            >
              <Camera size={16} strokeWidth={2} />
              {photoUploading
                ? t('uploading')
                : photoPreview || savedPhotoSrc
                  ? t('replacePhoto')
                  : t('uploadPhoto')}
            </button>
          </div>

          <label className={styles.field}>
            <span>
              {t('brand')} <i>*</i>
            </span>
            <input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder={t('brandPlaceholder')}
            />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>
                {t('plate')} <i>*</i>
              </span>
              <input
                value={form.licensePlate}
                onChange={(e) => setField('licensePlate', e.target.value)}
                placeholder={t('platePlaceholder')}
              />
            </label>
            <label className={styles.field}>
              <span>{t('bodyType')}</span>
              <select
                value={form.transportType}
                onChange={(e) => setField('transportType', e.target.value)}
              >
                <option value="">{t('choose')}</option>
                {form.transportType &&
                  !types.some((type) => type.id === form.transportType) && (
                    <option value={form.transportType}>
                      {currentType?.name || t('currentType')}
                    </option>
                  )}
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.row3}>
            <label className={styles.field}>
              <span>{t('tonsLabel')}</span>
              <input
                type="number"
                step="0.1"
                value={form.loadCapacity}
                onChange={(e) => setField('loadCapacity', e.target.value)}
                placeholder="20"
              />
            </label>
            <label className={styles.field}>
              <span>{t('volumeLabel')}</span>
              <input
                type="number"
                step="0.1"
                value={form.volume}
                onChange={(e) => setField('volume', e.target.value)}
                placeholder="82"
              />
            </label>
            <label className={styles.field}>
              <span>{t('year')}</span>
              <input
                type="number"
                value={form.manufactureYear}
                onChange={(e) => setField('manufactureYear', e.target.value)}
                placeholder="2021"
              />
            </label>
          </div>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>{t('driver')}</span>
              <input
                value={form.driverFio}
                onChange={(e) => setField('driverFio', e.target.value)}
                placeholder={t('driverPlaceholder')}
              />
            </label>
            <label className={styles.field}>
              <span>{t('driverPhone')}</span>
              <input
                type="tel"
                value={form.driverPhone}
                onChange={(e) => setField('driverPhone', e.target.value)}
                placeholder="+7 900 000-00-00"
              />
            </label>
          </div>
          </>
          )}

          {page === 2 && (
          <div className={styles.photoField}>
            <span>{t('stsTitle')}</span>
            <button
              type="button"
              className={styles.photoFrame}
              onClick={() => stsInputRef.current?.click()}
              disabled={busy}
            >
              {stsPreview || savedStsSrc ? (
                <img src={stsPreview || savedStsSrc} alt={t('stsTitle')} className={styles.photoImg} />
              ) : (
                <div className={styles.photoEmpty}>
                  <FileText size={36} strokeWidth={1.5} />
                  <p>{t('stsEmpty')}</p>
                  <span>{t('fileHint')}</span>
                </div>
              )}
            </button>
            <input
              ref={stsInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className={styles.fileInput}
              onChange={handleStsChange}
              disabled={busy}
            />
            <button
              type="button"
              className={styles.photoBtn}
              onClick={() => stsInputRef.current?.click()}
              disabled={busy}
            >
              <FileText size={16} strokeWidth={2} />
              {stsUploading
                ? t('uploading')
                : stsPreview || savedStsSrc
                  ? t('replaceSts')
                  : t('uploadSts')}
            </button>
          </div>
          )}

          <div className={styles.actions}>
            {page === 1 ? (
              <button type="submit" className={styles.submit} disabled={!canSubmit}>
                {t('next')}
              </button>
            ) : (
              <button type="submit" className={styles.submit} disabled={!canSubmit}>
                {busy ? t('saving') : isEdit ? t('save') : t('addToFleet')}
              </button>
            )}
            <button
              type="button"
              className={styles.cancel}
              onClick={page === 1 ? onClose : () => setPage(1)}
              disabled={busy}
            >
              {page === 1 ? t('cancel') : t('back')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
