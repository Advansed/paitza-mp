import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { intlLocale } from '../../i18n';
import { IonAlert } from '@ionic/react';
import { Phone, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { CompanyMember, MEMBER_STATUS, useCompanyMembers } from '../../Store/membersStore';
import { useSocketStore } from '../../Store/socketStore';
import { formatPhonePretty, phoneHref } from '../Works/feedFormat';
import { AddDriverModal } from './AddDriverModal';
import styles from './DriversPage.module.css';

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(intlLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const DriversPage: React.FC = () => {
  const { t } = useTranslation('drivers');
  const { items, isLoading, isSaving, loaded, load, add, setStatus, remove } = useCompanyMembers();
  const isConnected = useSocketStore((s) => s.isConnected);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CompanyMember | null>(null);

  useEffect(() => {
    if (isConnected) load();
  }, [isConnected, load]);

  const total = items.length;
  const active = items.filter((m) => m.status === MEMBER_STATUS.ACTIVE).length;

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <div>
          <div className={styles.kicker}>{t('kicker')}</div>
          <h2 className={styles.title}>{t('manage')}</h2>
          <p className={styles.sub}>
            {t('summary', { total, active })}
          </p>
        </div>
        <button type="button" className={styles.addBtn} onClick={() => setModalOpen(true)}>
          <Plus size={18} strokeWidth={2.25} />
          {t('add')}
        </button>
      </header>

      {isLoading && !loaded ? (
        <div className={styles.state}>{t('loading', { ns: 'common' })}</div>
      ) : total === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Users size={28} strokeWidth={1.75} />
          </span>
          <h3>{t('emptyTitle')}</h3>
          <p>{t('emptyText')}</p>
          <button type="button" className={styles.addBtn} onClick={() => setModalOpen(true)}>
            <UserPlus size={18} strokeWidth={2.25} />
            {t('add')}
          </button>
        </div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('phone')}</th>
                <th>{t('role')}</th>
                <th>{t('status')}</th>
                <th>{t('added')}</th>
                <th aria-label={t('actions')} />
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.driver_id} className={m.status === MEMBER_STATUS.SUSPENDED ? styles.rowMuted : ''}>
                  <td className={styles.name}>{m.driver_name || '—'}</td>
                  <td>
                    <PhoneLink phone={m.driver_phone} />
                  </td>
                  <td>{m.member_role === 'driver' ? t('driver') : m.member_role}</td>
                  <td>
                    <StatusSwitch member={m} onChange={setStatus} />
                  </td>
                  <td className={styles.muted}>{formatDate(m.joined_at)}</td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => setPendingDelete(m)}
                      aria-label={t('detachTitle')}
                      title={t('detachTitle')}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.cards}>
            {items.map((m) => (
              <article
                key={m.driver_id}
                className={`${styles.card} ${m.status === MEMBER_STATUS.SUSPENDED ? styles.rowMuted : ''}`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardInfo}>
                    <div className={styles.name}>{m.driver_name || '—'}</div>
                    <PhoneLink phone={m.driver_phone} />
                  </div>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setPendingDelete(m)}
                    aria-label={t('detachTitle')}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
                <div className={styles.cardMeta}>
                  <span>{m.member_role === 'driver' ? t('driver') : m.member_role}</span>
                  <span>{t('since', { date: formatDate(m.joined_at) })}</span>
                </div>
                <StatusSwitch member={m} onChange={setStatus} />
              </article>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <AddDriverModal saving={isSaving} onClose={() => setModalOpen(false)} onSubmit={add} />
      )}

      <IonAlert
        isOpen={Boolean(pendingDelete)}
        header={t('detachTitle')}
        message={t('detachConfirm')}
        onDidDismiss={() => setPendingDelete(null)}
        buttons={[
          { text: t('cancel', { ns: 'common' }), role: 'cancel' },
          {
            text: t('detach'),
            role: 'destructive',
            handler: () => {
              if (pendingDelete) remove(pendingDelete.driver_id);
            },
          },
        ]}
      />
    </div>
  );
};

function PhoneLink({ phone }: { phone: string }) {
  if (!phone) return <span className={styles.muted}>—</span>;
  const href = phoneHref(phone);
  const label = formatPhonePretty(phone);
  return href ? (
    <a className={styles.phone} href={href}>
      <Phone size={13} strokeWidth={2} />
      {label}
    </a>
  ) : (
    <span className={styles.phone}>{label}</span>
  );
}

function StatusSwitch({
  member,
  onChange,
}: {
  member: CompanyMember;
  onChange: (driverId: string, status: number) => void;
}) {
  const { t } = useTranslation('drivers');
  const isActive = member.status === MEMBER_STATUS.ACTIVE;
  return (
    <label className={styles.switch}>
      <input
        type="checkbox"
        checked={isActive}
        onChange={() =>
          onChange(member.driver_id, isActive ? MEMBER_STATUS.SUSPENDED : MEMBER_STATUS.ACTIVE)
        }
      />
      <span className={styles.switchTrack} aria-hidden>
        <span className={styles.switchThumb} />
      </span>
      <span className={isActive ? styles.statusActive : styles.statusSuspended}>
        {isActive ? t('active') : t('suspended')}
      </span>
    </label>
  );
}
