import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Copy, Download, Share2 } from 'lucide-react';
import { PanelFrame } from '../../layout/PanelFrame';
import { useLoginStore, useToken } from '../../Store/loginStore';
import { useSocket } from '../../Store/useSocket';
import { useSocketStore } from '../../Store/socketStore';
import { useToast } from '../../components/Toast';
import styles from './PartnersPage.module.css';

type ReferralRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  user_type?: number;
};

type ReferralsData = {
  pending: ReferralRow[];
  accepted: ReferralRow[];
};

function asReferralList(value: unknown): ReferralRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const id = String(r.id || '').trim();
      if (!id) return null;
      return {
        id,
        name: String(r.name || '').trim(),
        phone: String(r.phone || '').trim(),
        email: String(r.email || '').trim(),
        user_type: typeof r.user_type === 'number' ? r.user_type : undefined,
      };
    })
    .filter((row): row is ReferralRow => Boolean(row));
}

export const PartnersPage: React.FC = () => {
  const { t } = useTranslation('common');
  const toast = useToast();
  const userId = useLoginStore((s) => s.id);
  const token = useToken();
  const { once, emit } = useSocket();
  const isConnected = useSocketStore((s) => s.isConnected);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [pending, setPending] = useState<ReferralRow[]>([]);
  const [accepted, setAccepted] = useState<ReferralRow[]>([]);

  const inviteUrl = useMemo(() => {
    if (!userId || typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/?auth=register&partner=${encodeURIComponent(userId)}`;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!inviteUrl) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(inviteUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  const loadReferrals = useCallback(() => {
    if (!isConnected || !token) return;
    setLoadingList(true);
    once('get_partner_referrals', (response: { success?: boolean; data?: ReferralsData; message?: string }) => {
      setLoadingList(false);
      if (response?.success) {
        setPending(asReferralList(response.data?.pending));
        setAccepted(asReferralList(response.data?.accepted));
        return;
      }
      toast.error(response?.message || t('partnersListLoadError'));
    });
    emit('get_partner_referrals', { token });
  }, [emit, isConnected, once, t, toast, token]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const shareText = useMemo(
    () => t('partnersShareText', { url: inviteUrl }),
    [t, inviteUrl]
  );

  const handleCopy = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('partnersCopied'));
    } catch {
      toast.error(t('partnersShareFailed'));
    }
  }, [inviteUrl, t, toast]);

  const handleShare = useCallback(async () => {
    if (!inviteUrl) return;
    const title = t('partnersTitle');
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title,
          text: shareText,
          url: inviteUrl,
          dialogTitle: title,
        });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: shareText, url: inviteUrl });
        return;
      }
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('partnersCopied'));
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === 'AbortError') return;
      toast.error(t('partnersShareFailed'));
    }
  }, [inviteUrl, shareText, t, toast]);

  const handleDownloadQr = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'paitza-invite.png';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [qrDataUrl]);

  const renderList = (items: ReferralRow[], emptyKey: string) => {
    if (loadingList) {
      return <p className={styles.listEmpty}>{t('loading')}</p>;
    }
    if (!items.length) {
      return <p className={styles.listEmpty}>{t(emptyKey)}</p>;
    }
    return (
      <ul className={styles.list}>
        {items.map((row) => (
          <li key={row.id} className={styles.listItem}>
            <div className={styles.listName}>{row.name || t('partnersUntitled')}</div>
            <div className={styles.listMeta}>
              {[row.phone, row.email].filter(Boolean).join(' · ')}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <PanelFrame title={t('partnersTitle')} subtitle={t('partnersText')}>
      <div className={styles.wrap}>
        {!userId ? (
          <p className={styles.hint}>{t('partnersNoId')}</p>
        ) : (
          <>
            <label className={styles.label} htmlFor="partner-invite-url">
              {t('partnersLinkLabel')}
            </label>
            <div className={styles.linkRow}>
              <input
                id="partner-invite-url"
                className={styles.linkInput}
                value={inviteUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.primaryBtn} onClick={handleShare}>
                <Share2 size={16} strokeWidth={2} />
                {t('partnersShare')}
              </button>
              <button type="button" className={styles.ghostBtn} onClick={handleCopy}>
                <Copy size={16} strokeWidth={2} />
                {t('partnersCopy')}
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
              >
                <Download size={16} strokeWidth={2} />
                {t('partnersDownloadQr')}
              </button>
            </div>

            {qrDataUrl && (
              <div className={styles.qrBlock}>
                <img className={styles.qr} src={qrDataUrl} alt={t('partnersDownloadQr')} />
              </div>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('partnersPendingTitle')}
                <span className={styles.count}>{pending.length}</span>
              </h2>
              <p className={styles.sectionHint}>{t('partnersPendingHint')}</p>
              {renderList(pending, 'partnersListEmpty')}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('partnersAcceptedTitle')}
                <span className={styles.count}>{accepted.length}</span>
              </h2>
              <p className={styles.sectionHint}>{t('partnersAcceptedHint')}</p>
              {renderList(accepted, 'partnersListEmpty')}
            </section>
          </>
        )}
      </div>
    </PanelFrame>
  );
};

export default PartnersPage;
