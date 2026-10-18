import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { intlLocale } from '../../../i18n';
import { IonIcon, IonInput, IonSpinner } from '@ionic/react';
import {
  addOutline,
  businessOutline,
  cardOutline,
  phonePortraitOutline,
  receiptOutline,
} from 'ionicons/icons';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Clock,
  Lock,
  Plus,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useWallet, type DueDeal } from '../hooks/useWallet';
import walletStyles from './WalletPage.module.css';
import { useToast } from '../../Toast';
import { useLogin } from '../../../Store/useLogin';
import { openUrlInApp } from '../../../utils/openUrlInApp';
import { InvoiceModal } from './InvoiceModal/InvoiceModal';
import type { Transaction } from '../../../Store/accountStore';
import { shortDate } from '../../Works/feedFormat';

export interface WalletPageProps {
  onBack: () => void;
  initialAmount?: number | string | null;
}

type PayMethod = 'invoice' | 'sbp' | 'acquiring';

const formatAmountInput = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const parseAmountInput = (value: string): number => {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

function monthLabel(date: Date, style: 'short' | 'long') {
  return date.toLocaleDateString(intlLocale(), { month: style }).replace('.', '');
}

function parseTxDate(raw: string): Date | null {
  if (!raw) return null;
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;
  const m = String(raw).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function isIncome(t: Transaction): boolean {
  return t.type === 'income' || (t.amount > 0 && t.type !== 'inv' && t.type !== 'expense');
}

function isExpense(t: Transaction): boolean {
  return t.type === 'expense' || t.amount < 0;
}

function formatTxWhen(raw: string): string {
  const date = parseTxDate(raw);
  if (!date) return raw || '';
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const time = date.toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' });
  const today = i18n.t('today', { ns: 'common' });
  if (sameDay && time !== '00:00') return `${today}, ${time}`;
  if (sameDay) return today;
  return date.toLocaleDateString(intlLocale());
}

function MonthChart({ bars }: { bars: { key: string; label: string; value: number }[] }) {
  const width = 560;
  const height = 168;
  const padX = 18;
  const padTop = 12;
  const padBottom = 28;
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const points = bars.map((bar, i) => {
    const x = padX + (i / Math.max(bars.length - 1, 1)) * (width - padX * 2);
    const y = padTop + (1 - bar.value / max) * (height - padTop - padBottom);
    return { ...bar, x, y };
  });
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const area = `${line} L${last.x.toFixed(1)} ${height - padBottom} L${first.x.toFixed(1)} ${height - padBottom} Z`;

  return (
    <svg className={walletStyles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden>
      <defs>
        <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b5adc" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2b5adc" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#incomeArea)" />
      <path d={line} fill="none" stroke="#2b5adc" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p) => (
        <circle key={p.key} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#2b5adc" strokeWidth="2" />
      ))}
      {points.map((p) => (
        <text key={`${p.key}-l`} x={p.x} y={height - 8} textAnchor="middle" className={walletStyles.chartSvgLabel}>
          {p.label}
        </text>
      ))}
    </svg>
  );
}

export const WalletPage: React.FC<WalletPageProps> = ({
  onBack: _onBack,
  initialAmount,
}) => {
  const { t } = useTranslation('finance');
  const toast = useToast();
  const { user } = useLogin();
  const isCustomer = user.user_type === 1;
  const {
    accountData,
    transactions,
    isLoading,
    formattedBalance,
    load,
    refreshWallet,
    set_payment,
    set_invoice,
    get_invoice,
    get_deals,
    set_deals_payment,
    seller_id,
  } = useWallet();

  const [amount, setAmount] = useState(() => {
    const n = Number(initialAmount);
    return Number.isFinite(n) && n > 0 ? formatAmountInput(Math.ceil(n)) : '';
  });
  const [showTopUp, setShowTopUp] = useState(() => Number(initialAmount) > 0);
  const [showDeals, setShowDeals] = useState(false);
  const [deals, setDeals] = useState<DueDeal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [payingDealId, setPayingDealId] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState<PayMethod | null>(null);
  const [invoiceModalData, setInvoiceModalData] = useState<unknown>();
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const n = Number(initialAmount);
    if (Number.isFinite(n) && n > 0) {
      setAmount(formatAmountInput(Math.ceil(n)));
      setShowTopUp(true);
    }
  }, [initialAmount]);

  useEffect(() => {
    if (!showTopUp) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !payLoading) setShowTopUp(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showTopUp, payLoading]);

  useEffect(() => {
    if (!showDeals) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !dealsLoading && !payingDealId) setShowDeals(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDeals, dealsLoading, payingDealId]);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, [load]);

  const formatMoney = (n: number) => {
    try {
      return n.toLocaleString(intlLocale(), {
        style: 'currency',
        currency: accountData?.currency || 'RUB',
        maximumFractionDigits: 0,
      });
    } catch {
      return `${n} ₽`;
    }
  };

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const stats = useMemo(() => {
    const list = transactions || [];

    const bars = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - 5 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d, 'short'), value: 0 };
    });

    for (const t of list) {
      const date = parseTxDate(t.date);
      if (!isIncome(t)) continue;
      const value = Math.abs(t.amount);
      if (date) {
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const bar = bars.find((b) => b.key === key);
        if (bar) bar.value += value;
      }
    }

    return { bars };
  }, [transactions, thisMonth, thisYear, i18n.language]);

  const amountNumber = useMemo(() => parseAmountInput(amount), [amount]);

  const canPay = amountNumber > 0 && !isLoading && !payLoading;
  const displayName = user?.name?.trim() || t('user', { ns: 'common' });

  const deposit = Number(accountData?.deposit ?? 0);
  const depositPaid = deposit > 0;
  const advanceReserve = Number(accountData?.advanceReserve ?? 0);
  const advanceInWork = Number(accountData?.advanceInWork ?? 0);
  const remainingToPay = Number(accountData?.remainingToPay ?? 0);
  const monthIncome = Number(accountData?.monthIncome ?? 0);
  const upcomingIncome = Number(accountData?.upcomingIncome ?? 0);
  const holdAdvance = Number(accountData?.holdAdvance ?? 0);

  const closeTopUp = () => {
    if (payLoading) return;
    setShowTopUp(false);
  };

  const openDueDeals = async () => {
    setShowDeals(true);
    setDealsLoading(true);
    try {
      const res = await get_deals();
      if (!res.success) {
        toast.error(res.error || t('dealsLoadError'));
        setDeals([]);
        return;
      }
      setDeals(res.data || []);
    } finally {
      setDealsLoading(false);
    }
  };

  const closeDeals = () => {
    if (dealsLoading || payingDealId) return;
    setShowDeals(false);
  };

  const handleDealPayment = async (deal: DueDeal) => {
    if (payingDealId) return;
    if (!deal.cargoId || !deal.performer) {
      toast.error(t('dueMissing'));
      return;
    }
    if (deal.due <= 0) {
      toast.error(t('dueZero'));
      return;
    }

    const dealKey = deal.id || `${deal.cargoId}-${deal.performer}`;
    setPayingDealId(dealKey);
    try {
      const res = await set_deals_payment({
        cargo_id: deal.cargoId,
        performer: deal.performer,
        amount: deal.due,
        currency: deal.currency || accountData?.currency || 'RUB',
      });
      if (!res.success) {
        toast.error(res.error || t('dueFailed'));
        return;
      }
      toast.success(t('dueSent'));
      void refreshWallet({ silent: true });
      const refreshed = await get_deals();
      if (refreshed.success) setDeals(refreshed.data || []);
    } finally {
      setPayingDealId(null);
    }
  };

  const handleOpenInvoicePdf = async (invoiceId: string) => {
    if (invoiceLoadingId !== null) return;
    setInvoiceLoadingId(invoiceId);
    try {
      const res = await get_invoice(invoiceId, { silent: true });
      if (res?.success) setInvoiceModalData(res.data);
      else toast.error(res?.error || t('invoiceLoadError'));
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  const handlePayOnline = async (method: 'sbp' | 'acquiring') => {
    if (amountNumber <= 0) return;
    setPayLoading(method);
    try {
      const res = await set_payment({
        type: 1,
        amount: amountNumber,
        description: `Пополнение лицевого счета ${user?.id || ''}`.trim(),
      });
      if (!res?.success) {
        toast.error(res?.error || t('topUpError'));
        return;
      }

      if (method === 'acquiring') {
        const url = res?.data?.payment_url || res?.data?.paymentUrl;
        if (url) {
          try {
            await openUrlInApp(url);
            setShowTopUp(false);
            void refreshWallet({ silent: true });
          } catch {
            toast.error(t('payOpenError'));
          }
        } else {
          toast.info(t('payLinkMissing'));
        }
      } else {
        const payload = res?.data?.sbp_payload || res?.data?.sbpPayload;
        if (payload) {
          try {
            await openUrlInApp(payload);
            setShowTopUp(false);
            void refreshWallet({ silent: true });
          } catch {
            toast.error(t('sbpOpenError'));
          }
        } else {
          toast.info(t('sbpMissing'));
        }
      }
    } finally {
      setPayLoading(null);
    }
  };

  const handleCreateInvoice = async () => {
    if (amountNumber <= 0) return;
    setPayLoading('invoice');
    try {
      const payload = {
        invoice_date: new Date().toISOString().split('T')[0],
        seller_id,
        payment_due: '10 дней',
        payment_purpose: `Пополнение счета от ${new Date().toLocaleDateString()}`,
        signer: 'Егоров Д.Н.',
        total_amount: amountNumber,
        vat_amount: 0,
        items: [
          {
            item_name: 'Пополнение баланса',
            qty: 1,
            unit: 'шт.',
            price: amountNumber,
            total: amountNumber,
          },
        ],
      };
      const res = await set_invoice(payload);
      if (!res?.success) {
        toast.error(res?.error || t('invoiceError'));
        return;
      }

      let invoice = res.data;
      const invoiceId =
        invoice?.invoiceNumber ||
        invoice?.id ||
        invoice?.guid ||
        invoice?.invoice_id;

      if ((!invoice?.items || !invoice?.invoiceNumber) && invoiceId) {
        const loaded = await get_invoice(String(invoiceId), { silent: true });
        if (loaded?.success && loaded.data) invoice = loaded.data;
      }

      if (!invoice) {
        toast.error(t('invoiceViewMissing'));
        void refreshWallet({ silent: true });
        return;
      }

      setShowTopUp(false);
      setInvoiceModalData(invoice);
      void refreshWallet({ silent: true });
    } finally {
      setPayLoading(null);
    }
  };

  const txIcon = (t: Transaction) => {
    if (isIncome(t)) return { className: walletStyles.txIconIn, icon: <ArrowDownLeft size={18} strokeWidth={2.25} /> };
    if (t.type === 'inv') return { className: walletStyles.txIconInv, icon: <ArrowUpRight size={18} strokeWidth={2.25} /> };
    return { className: walletStyles.txIconOut, icon: <ArrowUpRight size={18} strokeWidth={2.25} /> };
  };

  return (
    <div className={walletStyles.page}>
      {invoiceModalData !== undefined && (
        <InvoiceModal
          isOpen={invoiceModalData !== undefined}
          onClose={() => setInvoiceModalData(undefined)}
          inv={invoiceModalData as any}
        />
      )}

      {showDeals && (
        <div className={walletStyles.modalOverlay} role="presentation" onClick={closeDeals}>
          <div
            className={`${walletStyles.modalDialog} ${walletStyles.dealsDialog}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deals-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={walletStyles.modalHead}>
              <div>
                <h2 id="deals-title" className={walletStyles.modalTitle}>
                  {t('dealsTitle')}
                </h2>
                <p className={walletStyles.modalSub}>
                  {t('dealsTotal', { amount: formatMoney(remainingToPay) })}
                </p>
              </div>
              <button
                type="button"
                className={walletStyles.modalClose}
                onClick={closeDeals}
                aria-label={t('close', { ns: 'common' })}
                disabled={dealsLoading || Boolean(payingDealId)}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {dealsLoading ? (
              <div className={walletStyles.loadingWrap}>
                <IonSpinner name="bubbles" />
              </div>
            ) : deals.length === 0 ? (
              <div className={walletStyles.empty}>
                <IonIcon icon={receiptOutline} />
                <p>{t('dealsEmpty')}</p>
                <span>{t('dealsEmptyHint')}</span>
              </div>
            ) : (
              <ul className={walletStyles.dealList}>
                {deals.map((deal, index) => {
                  const dealKey = deal.id || `${deal.cargoId}-${deal.performer}`;
                  const isPaying = payingDealId === dealKey;
                  const canPay =
                    Boolean(deal.cargoId && deal.performer && deal.due > 0) && !payingDealId;
                  return (
                  <li key={`${dealKey}-${index}`}>
                    <div className={walletStyles.dealItem}>
                      <div className={walletStyles.dealText}>
                        <div className={walletStyles.dealTitle}>{deal.cargoName}</div>
                        <div className={walletStyles.dealSub}>
                          {t('executor', { name: deal.executorName || '—' })}
                        </div>
                        <div className={walletStyles.dealMeta}>
                          {t('delivery', { date: deal.deliveryDate ? shortDate(deal.deliveryDate) || deal.deliveryDate : '—' })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={walletStyles.dealPayBtn}
                        disabled={!canPay}
                        onClick={() => void handleDealPayment(deal)}
                        aria-label={t('payDue', { amount: formatMoney(deal.due) })}
                      >
                        {isPaying ? (
                          <IonSpinner name="bubbles" />
                        ) : (
                          <>
                            <span className={walletStyles.dealDue}>{formatMoney(deal.due)}</span>
                            <span className={walletStyles.dealPayLabel}>{t('dueLabel')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {showTopUp && (
        <div className={walletStyles.modalOverlay} role="presentation" onClick={closeTopUp}>
          <div
            className={walletStyles.modalDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topup-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={walletStyles.modalHead}>
              <div>
                <h2 id="topup-title" className={walletStyles.modalTitle}>
                  {t('topUpTitle')}
                </h2>
                <p className={walletStyles.modalSub}>{t('topUpSub')}</p>
              </div>
              <button
                type="button"
                className={walletStyles.modalClose}
                onClick={closeTopUp}
                aria-label={t('close', { ns: 'common' })}
                disabled={Boolean(payLoading)}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className={walletStyles.amountWrap}>
              <IonInput
                id="wallet-amount"
                className={walletStyles.amountInput}
                inputMode="numeric"
                value={amount}
                placeholder="0"
                onIonInput={(e) => setAmount(formatAmountInput(String(e.detail.value ?? '')))}
              />
              <span className={walletStyles.amountCurrency}>₽</span>
            </div>

            <div className={walletStyles.quickRow}>
              {[1000, 5000, 10000, 25000].map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`${walletStyles.quickChip} ${amountNumber === q ? walletStyles.quickChipActive : ''}`}
                  onClick={() => setAmount(formatAmountInput(q))}
                  disabled={Boolean(payLoading)}
                >
                  {q.toLocaleString(intlLocale())} ₽
                </button>
              ))}
            </div>

            <div className={walletStyles.payMethods}>
              <button
                type="button"
                className={walletStyles.payMethod}
                disabled={!canPay}
                onClick={() => void handleCreateInvoice()}
              >
                <span className={walletStyles.payMethodIcon}>
                  {payLoading === 'invoice' ? <IonSpinner name="bubbles" /> : <IonIcon icon={businessOutline} />}
                </span>
                <span className={walletStyles.payMethodText}>
                  <strong>{t('invoice')}</strong>
                  <span>{t('invoiceSub')}</span>
                </span>
              </button>

              <button
                type="button"
                className={walletStyles.payMethod}
                disabled={!canPay}
                onClick={() => void handlePayOnline('sbp')}
              >
                <span className={walletStyles.payMethodIcon}>
                  {payLoading === 'sbp' ? <IonSpinner name="bubbles" /> : <IonIcon icon={phonePortraitOutline} />}
                </span>
                <span className={walletStyles.payMethodText}>
                  <strong>{t('sbp')}</strong>
                  <span>{t('sbpSub')}</span>
                </span>
              </button>

              <button
                type="button"
                className={walletStyles.payMethod}
                disabled={!canPay}
                onClick={() => void handlePayOnline('acquiring')}
              >
                <span className={walletStyles.payMethodIcon}>
                  {payLoading === 'acquiring' ? <IonSpinner name="bubbles" /> : <IonIcon icon={cardOutline} />}
                </span>
                <span className={walletStyles.payMethodText}>
                  <strong>{t('acquiring')}</strong>
                  <span>{t('acquiringSub')}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={walletStyles.stats}>
        <section className={`${walletStyles.statCard} ${walletStyles.statHero}`}>
          <div className={walletStyles.statHead}>
            <span className={walletStyles.statIconHero} aria-hidden>
              <ArrowUpRight size={18} strokeWidth={2.25} />
            </span>
            <span className={walletStyles.statLabel}>
              {isCustomer ? t('balance') : t('available')}
            </span>
          </div>
          <div className={walletStyles.statValue}>{formattedBalance}</div>
          {!isCustomer && (
            <div className={walletStyles.statSub}>{t('expected', { amount: formatMoney(upcomingIncome) })}</div>
          )}
          <div className={walletStyles.statActions}>
            {!isCustomer && (
              <button
                type="button"
                className={walletStyles.heroGhost}
                onClick={() => toast.info(t('withdrawSoon'))}
              >
                <ArrowUpRight size={16} strokeWidth={2.25} />
                {t('withdraw')}
              </button>
            )}
            <button
              type="button"
              className={walletStyles.heroPrimary}
              onClick={() => {
                setShowTopUp(true);
                window.setTimeout(() => document.getElementById('wallet-amount')?.focus(), 50);
              }}
            >
              <Plus size={16} strokeWidth={2.25} />
              {t('topUp')}
            </button>
          </div>
        </section>

        {isCustomer ? (
          <>
            <section className={walletStyles.statCard}>
              <div className={walletStyles.statHead}>
                <span className={`${walletStyles.statIcon} ${walletStyles.statIconBlue}`} aria-hidden>
                  <Lock size={16} strokeWidth={2.25} />
                </span>
                <span className={walletStyles.statLabel}>{t('reserve')}</span>
              </div>
              <div className={walletStyles.statValue}>{formatMoney(advanceReserve)}</div>
              <div className={walletStyles.statSub}>{t('reserveSub')}</div>
            </section>

            <section className={walletStyles.statCard}>
              <div className={walletStyles.statHead}>
                <span className={`${walletStyles.statIcon} ${walletStyles.statIconOrange}`} aria-hidden>
                  <Briefcase size={16} strokeWidth={2.25} />
                </span>
                <span className={walletStyles.statLabel}>{t('advances')}</span>
              </div>
              <div className={walletStyles.statValue}>{formatMoney(advanceInWork)}</div>
              <div className={walletStyles.statSub}>{t('advancesSub')}</div>
            </section>

            <section
              className={`${walletStyles.statCard} ${walletStyles.statCardClickable}`}
              role="button"
              tabIndex={0}
              onClick={() => void openDueDeals()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void openDueDeals();
                }
              }}
              aria-label={t('dueAria')}
            >
              <div className={walletStyles.statHead}>
                <span className={`${walletStyles.statIcon} ${walletStyles.statIconGreen}`} aria-hidden>
                  <Wallet size={16} strokeWidth={2.25} />
                </span>
                <span className={walletStyles.statLabel}>{t('due')}</span>
              </div>
              <div className={walletStyles.statValue}>{formatMoney(remainingToPay)}</div>
              <div className={walletStyles.statSub}>{t('dueSub')}</div>
            </section>
          </>
        ) : (
          <>
            <section className={walletStyles.statCard}>
              <div className={walletStyles.statHead}>
                <span className={`${walletStyles.statIcon} ${walletStyles.statIconGreen}`} aria-hidden>
                  <TrendingUp size={16} strokeWidth={2.25} />
                </span>
                <span className={walletStyles.statLabel}>{t('monthIncome', { month: monthLabel(now, 'long') })}</span>
              </div>
              <div className={walletStyles.statValue}>{formatMoney(monthIncome)}</div>
            </section>

            <section className={walletStyles.statCard}>
              <div className={walletStyles.statHead}>
                <span className={`${walletStyles.statIcon} ${walletStyles.statIconOrange}`} aria-hidden>
                  <Clock size={16} strokeWidth={2.25} />
                </span>
                <span className={walletStyles.statLabel}>{t('expectedTitle')}</span>
              </div>
              <div className={walletStyles.statValue}>{formatMoney(upcomingIncome)}</div>
              <div className={walletStyles.statSub}>
                {t('advancesGot', { amount: formatMoney(holdAdvance) })}
              </div>
            </section>

            <section className={walletStyles.statCard}>
              <div className={walletStyles.statHead}>
                <span className={`${walletStyles.statIcon} ${walletStyles.statIconBlue}`} aria-hidden>
                  <Lock size={16} strokeWidth={2.25} />
                </span>
                <span className={walletStyles.statLabel}>{t('deposit')}</span>
                <span className={`${walletStyles.depositBadge} ${depositPaid ? walletStyles.depositOn : walletStyles.depositOff}`}>
                  {depositPaid ? t('depositPaid') : t('depositUnpaid')}
                </span>
              </div>
              <div className={walletStyles.statValue}>{formatMoney(deposit)}</div>
              <p className={walletStyles.depositHint}>
                {t('depositHint')}
              </p>
            </section>
          </>
        )}
      </div>

      {!isCustomer && (
      <div className={walletStyles.midGrid}>
        <section className={walletStyles.card}>
          <h2 className={walletStyles.cardTitle}>{t('incomeChart')}</h2>
          <p className={walletStyles.cardSub}>{t('incomeChartSub')}</p>
          <MonthChart bars={stats.bars} />
        </section>

        <section className={walletStyles.card}>
          <h2 className={walletStyles.cardTitle}>{t('payoutMethod')}</h2>
          <div className={walletStyles.bankCard} aria-label={t('payoutCard')}>
            <div className={walletStyles.bankCardTop}>
              <span className={walletStyles.chip} aria-hidden />
              <span className={walletStyles.bankBadge}>{t('primary')}</span>
            </div>
            <div className={walletStyles.bankNumber}>•• •• •• 4417</div>
            <div className={walletStyles.bankWho}>{displayName} · МИР</div>
          </div>
          <button
            type="button"
            className={walletStyles.addCardBtn}
            onClick={() => toast.info(t('addCardLater'))}
          >
            <IonIcon icon={addOutline} />
            {t('addCard')}
          </button>
        </section>
      </div>
      )}

      <section className={walletStyles.card} id="statement">
        <h2 className={walletStyles.cardTitle}>{t('history')}</h2>
        {isLoading ? (
          <div className={walletStyles.loadingWrap}>
            <IonSpinner name="bubbles" />
          </div>
        ) : (transactions || []).length === 0 ? (
          <div className={walletStyles.empty}>
            <IonIcon icon={receiptOutline} />
            <p>{t('emptyTx')}</p>
            <span>{t('emptyTxHint')}</span>
          </div>
        ) : (
          <ul className={walletStyles.txList}>
            {(transactions || []).slice(0, 50).map((tx, index) => {
              const inv = tx.type === 'inv';
              const icon = txIcon(tx);
              return (
                <li key={`${tx.id || 'tx'}-${index}`}>
                  <button
                    type="button"
                    className={walletStyles.txItem}
                    disabled={!inv}
                    onClick={inv ? () => void handleOpenInvoicePdf(tx.id) : undefined}
                  >
                    <span className={`${walletStyles.txIcon} ${icon.className}`} aria-hidden>
                      {icon.icon}
                    </span>
                    <div className={walletStyles.txText}>
                      <div className={walletStyles.txTitle}>{tx.title || t('operation')}</div>
                      {(tx.subtitle || '').trim() ? (
                        <div className={walletStyles.txSub}>{tx.subtitle}</div>
                      ) : null}
                    </div>
                    <div className={walletStyles.txRight}>
                      <div
                        className={
                          isIncome(tx)
                            ? walletStyles.txPlus
                            : isExpense(tx)
                              ? walletStyles.txMinus
                              : walletStyles.txNeutral
                        }
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {formatMoney(tx.amount)}
                      </div>
                      <span className={walletStyles.txWhen}>
                        {inv && invoiceLoadingId === tx.id ? t('loading', { ns: 'common' }) : formatTxWhen(tx.date)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
