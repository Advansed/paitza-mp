import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonAlert, IonModal } from '@ionic/react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CloudUpload,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Star,
  Trash2,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { CargoInfo, CargoStatus, DriverInfo, useCargoStore } from '../../../Store/cargoStore';
import type { CargoActionResult } from '../hooks/useCargos';
import { statusUtils, formatters } from '../../../utils/utils';
import {
  getCargoActionHint,
  isCargoCompleted,
  isCargoInExecution,
  isCargoProblems,
  resolveCargoProgressStatus,
} from '../cargoStatusFlow';
import { CargoOrderInfo } from './CargoOrderInfo';
import { CargoStatusTimeline } from './CargoStatusTimeline';
import { CargoTripAction } from './CargoTripAction';
import styles from './CargoView.module.css';

interface CargoViewProps {
  cargo: CargoInfo;
  onBack: () => void;
  onEdit: (cargo: CargoInfo) => void;
  onDelete: (guid: string) => Promise<boolean>;
  onPublish: (guid: string) => Promise<CargoActionResult>;
  onUnpublish: (guid: string) => Promise<boolean>;
  onAcceptInvoice: (invoice: DriverInfo) => void | Promise<void>;
  onRejectInvoice: (invoice: DriverInfo) => Promise<boolean>;
  onChatInvoice: (invoice: DriverInfo) => void;
  onAdvanceInvoice: (invoice: DriverInfo, status: number) => void | Promise<void>;
  onStartUnloading: (invoice: DriverInfo) => void | Promise<void>;
  onComplete: (invoice: DriverInfo, rating: number, completed: boolean) => void | Promise<void>;
  onMapClick?: (cargo: CargoInfo) => void;
  isLoading?: boolean;
}

function invoiceStatusMeta(
  status: DriverInfo['status'],
  label: (key: 'bidPending' | 'bidAccepted') => string,
) {
  if (status === 'Заказано') {
    return {
      label: label('bidPending'),
      kind: 'pending' as const,
      Icon: Clock,
    };
  }
  if (status === 'Завершено' || status === 'Доставлено' || status === 'Разгружено') {
    return {
      label: label('bidAccepted'),
      kind: 'accepted' as const,
      Icon: CheckCircle2,
    };
  }
  return {
    label: label('bidAccepted'),
    kind: 'accepted' as const,
    Icon: CheckCircle2,
  };
}

function isAssignedInvoice(invoice: DriverInfo) {
  return invoice.status !== 'Заказано';
}

const CargoViewInner: React.FC<CargoViewProps> = ({
  cargo,
  onBack,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onAcceptInvoice,
  onRejectInvoice,
  onChatInvoice,
  onAdvanceInvoice,
  onStartUnloading,
  onComplete,
  onMapClick,
  isLoading = false,
}) => {
  const { t } = useTranslation('cargos');
  const cargos = useCargoStore((state) => state.cargos);
  const [actionOpen, setActionOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPublishAlert, setShowPublishAlert] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showUnpublishAlert, setShowUnpublishAlert] = useState(false);
  const [rejectInvoice, setRejectInvoice] = useState<DriverInfo | null>(null);
  const [acceptInvoice, setAcceptInvoice] = useState<DriverInfo | null>(null);

  const cargoInfo = useMemo(() => {
    const found = cargos.find((item) => item.guid === cargo.guid);
    return found ?? cargo;
  }, [cargos, cargo.guid, cargo]);

  const progressStatus = resolveCargoProgressStatus(cargoInfo);
  const status = progressStatus;
  const canPublish = status === CargoStatus.NEW;
  const canUnpublish = status === CargoStatus.WAITING;
  const canEdit = statusUtils.canEdit(status);
  const canDelete = statusUtils.canDelete(status);
  const invoices = cargoInfo.invoices ?? [];
  const totalInvoices = invoices.length;
  const actionHint = getCargoActionHint(progressStatus);
  const publishAlertMessage = 'Опубликовать заказ для поиска водителей?';
  const completed = isCargoCompleted(progressStatus);
  const problems = isCargoProblems(progressStatus);
  const inExecution = isCargoInExecution(progressStatus);
  const showTracker = inExecution || completed;
  const showPublishActions = canPublish;
  const showWaitingActions = canUnpublish;
  const showTripActions = inExecution && !completed;

  const selectedInvoice = useMemo(
    () => invoices.find(isAssignedInvoice) ?? null,
    [invoices]
  );
  const pendingInvoices = useMemo(
    () => invoices.filter((item) => item.status === 'Заказано'),
    [invoices]
  );
  const otherInvoices = useMemo(
    () => invoices.filter((item) => item.status !== 'Заказано'),
    [invoices]
  );

  useEffect(() => {
    setActionOpen(false);
  }, [selectedInvoice?.status]);

  const handleDelete = async () => {
    setShowDeleteAlert(false);
    setActionOpen(false);
    await onDelete(cargoInfo.guid);
  };

  const handlePublish = async () => {
    setShowPublishAlert(false);
    setActionOpen(false);
    const result = await onPublish(cargoInfo.guid);
    if (!result.success) {
      setPublishError(result.message || 'Не удалось опубликовать заказ');
    }
  };

  const handleUnpublish = async () => {
    setShowUnpublishAlert(false);
    setActionOpen(false);
    await onUnpublish(cargoInfo.guid);
  };

  const handleConfirmAccept = () => {
    if (!acceptInvoice) return;
    const invoice = acceptInvoice;
    setAcceptInvoice(null);
    void onAcceptInvoice(invoice);
  };

  const handleStartLoading = async (invoice: DriverInfo) => {
    await onAdvanceInvoice(invoice, 14);
    setActionOpen(false);
  };

  const handleSend = async (invoice: DriverInfo) => {
    await onAdvanceInvoice(invoice, 16);
    setActionOpen(false);
  };

  const handleStartUnloading = async (invoice: DriverInfo) => {
    await onStartUnloading(invoice);
    setActionOpen(false);
  };

  const handleCompleteTrip = async (
    invoice: DriverInfo,
    rating: number,
    completedFlag: boolean
  ) => {
    await onComplete(invoice, rating, completedFlag);
    setActionOpen(false);
  };

  const closeAnd = (fn: () => void) => {
    setActionOpen(false);
    fn();
  };

  const actionContent = (
    <>
      {canPublish && (
        <div className={styles.actionList}>
          <button
            type="button"
            className={styles.actionPrimary}
            onClick={() => setShowPublishAlert(true)}
          >
            <CloudUpload size={18} strokeWidth={1.75} />
            <span>
              <span className={styles.actionItemTitle}>Опубликовать груз</span>
              <span className={styles.actionItemHint}>Открыть заказ для водителей</span>
            </span>
          </button>

          {canEdit && (
            <button
              type="button"
              className={styles.actionItem}
              onClick={() => closeAnd(() => onEdit(cargoInfo))}
            >
              <Pencil size={18} strokeWidth={1.75} />
              <span>
                <span className={styles.actionItemTitle}>Изменить</span>
                <span className={styles.actionItemHint}>Редактировать параметры заказа</span>
              </span>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className={`${styles.actionItem} ${styles.actionDanger}`}
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 size={18} strokeWidth={1.75} />
              <span>
                <span className={styles.actionItemTitle}>Удалить</span>
                <span className={styles.actionItemHint}>Удалить черновик заказа</span>
              </span>
            </button>
          )}
        </div>
      )}

      {status === CargoStatus.WAITING && (
        <div className={styles.waitingBox}>
          <div className={styles.doneNote}>
            Заказ опубликован. Ожидаем предложения от водителей.
            {totalInvoices > 0 && ` Уже есть заявок: ${totalInvoices}.`}
          </div>
          <button
            type="button"
            className={`${styles.actionItem} ${styles.actionDanger}`}
            onClick={() => setShowUnpublishAlert(true)}
          >
            <XCircle size={18} strokeWidth={1.75} />
            <span>
              <span className={styles.actionItemTitle}>Снять с публикации</span>
              <span className={styles.actionItemHint}>Заказ снова станет черновиком</span>
            </span>
          </button>
        </div>
      )}

      {problems && (
        <div className={styles.doneNote}>
          По заявке возникли проблемы. Откройте карточку исполнителя, чтобы разобрать ситуацию.
        </div>
      )}

      {completed && (
        <div className={styles.doneNote}>
          {t('orderDoneNote', { defaultValue: 'Заказ завершён. Дальнейших действий не требуется.' })}
        </div>
      )}
    </>
  );

  const renderBid = (invoice: DriverInfo, actionable: boolean) => {
    const meta = invoiceStatusMeta(invoice.status, t);
    const StatusIcon = meta.Icon;
    const truckLine = [invoice.transport, invoice.capacity].filter(Boolean).join(' · ') || 'Транспорт не указан';

    return (
      <article key={invoice.guid} className={styles.bidCard}>
        <div className={styles.bidRow}>
          <span className={styles.bidAvatar} aria-hidden>
            <Truck size={20} strokeWidth={1.75} />
          </span>
          <div className={styles.bidBody}>
            <div className={styles.bidTop}>
              <div className={styles.bidIdentity}>
                <div className={styles.bidNameRow}>
                  <p className={styles.bidName}>{invoice.client || 'Исполнитель'}</p>
                  <ShieldCheck size={14} strokeWidth={2} className={styles.bidVerified} />
                </div>
                <p className={styles.bidTruck}>{truckLine}</p>
              </div>
              <div className={styles.bidPriceCol}>
                <p className={styles.bidPrice}>{formatters.currency(invoice.price)}</p>
                <span className={`${styles.bidStatus} ${styles[`bidStatus_${meta.kind}`]}`}>
                  <StatusIcon size={12} strokeWidth={2} />
                  {meta.label}
                </span>
              </div>
            </div>

            <div className={styles.bidMeta}>
              <span className={styles.bidRating}>
                <Star size={14} strokeWidth={1.75} className={styles.bidStar} />
                {invoice.rating || '—'}
              </span>
              <span>
                {invoice.weight} т · {invoice.volume} м³
              </span>
            </div>

            {actionable && (
              <div className={styles.bidActions}>
                <button
                  type="button"
                  className={styles.bidPrimary}
                  disabled={isLoading}
                  onClick={() => setAcceptInvoice(invoice)}
                >
                  Выбрать исполнителя
                </button>
                <button
                  type="button"
                  className={styles.bidSecondary}
                  disabled={isLoading}
                  onClick={() => onChatInvoice(invoice)}
                >
                  <MessageSquare size={14} strokeWidth={1.75} />
                  Написать
                </button>
                <button
                  type="button"
                  className={styles.bidGhost}
                  disabled={isLoading}
                  onClick={() => setRejectInvoice(invoice)}
                >
                  <XCircle size={14} strokeWidth={1.75} />
                  Отклонить
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className={styles.view}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        {t('backToOrders')}
      </button>

      <div className={styles.stack}>
        {showTracker && <CargoStatusTimeline cargo={cargoInfo} />}

        <CargoOrderInfo cargo={cargoInfo} onMapClick={onMapClick} />

        {selectedInvoice && (
          <section className={styles.carrierCard}>
            <p className={styles.carrierKicker}>
              <ShieldCheck size={14} strokeWidth={2} />
              {completed ? t('tripDone') : t('selectedCarrier')}
            </p>
            <div className={styles.carrierRow}>
              <span className={styles.carrierAvatar} aria-hidden>
                <Truck size={20} strokeWidth={1.75} />
              </span>
              <p className={styles.carrierName}>
                {[selectedInvoice.client, selectedInvoice.transport].filter(Boolean).join(' · ') ||
                  t('carrier')}
              </p>
              <button
                type="button"
                className={styles.carrierChat}
                onClick={() => onChatInvoice(selectedInvoice)}
                aria-label={t('writeToCarrier')}
              >
                <MessageSquare size={16} strokeWidth={1.75} />
              </button>
            </div>
          </section>
        )}

        {status === CargoStatus.WAITING && (
          <div className={styles.waitingBox}>
            <div className={styles.doneNote}>
              Заказ опубликован. Ожидаем предложения от водителей.
              {totalInvoices > 0 && ` Уже есть заявок: ${totalInvoices}.`}
            </div>
            <button
              type="button"
              className={`${styles.actionItem} ${styles.actionDanger}`}
              onClick={() => setShowUnpublishAlert(true)}
            >
              <XCircle size={18} strokeWidth={1.75} />
              <span>
                <span className={styles.actionItemTitle}>Снять с публикации</span>
                <span className={styles.actionItemHint}>Заказ снова станет черновиком</span>
              </span>
            </button>
          </div>
        )}

        <section className={styles.bidsSection}>
          <div className={styles.bidsHead}>
            <h3 className={styles.bidsTitle}>
              {inExecution || completed
                ? t('allBids')
                : t('bidsCount', { count: totalInvoices })}
            </h3>
          </div>

          {totalInvoices === 0 ? (
            <div className={styles.bidsEmpty}>
              {t('noBids')}
            </div>
          ) : (
            <div className={styles.bidsList}>
              {pendingInvoices.map((invoice) =>
                renderBid(invoice, !inExecution && !completed)
              )}
              {otherInvoices.map((invoice) => renderBid(invoice, false))}
            </div>
          )}
        </section>

        {(showPublishActions || showWaitingActions || showTripActions) && (
          <div className={styles.ctaRow}>
            <button
              type="button"
              className={styles.actionCta}
              onClick={() => setActionOpen(true)}
            >
              <span className={styles.actionCtaTitle}>Действие по заказу</span>
              <span className={styles.actionCtaHint}>{actionHint}</span>
            </button>
          </div>
        )}
      </div>

      <IonModal
        isOpen={actionOpen}
        onDidDismiss={() => setActionOpen(false)}
        className={styles.actionModal}
      >
        <div className={styles.modalShell}>
          <div className={styles.modalHead}>
            <div>
              <div className={styles.modalKicker}>Заказ</div>
              <h2 className={styles.modalTitle}>Действие по заказу</h2>
            </div>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setActionOpen(false)}
              aria-label="Закрыть"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
          <div className={styles.modalBody}>
            {showTripActions && selectedInvoice ? (
              <CargoTripAction
                invoice={selectedInvoice}
                onChat={onChatInvoice}
                onStartLoading={handleStartLoading}
                onSend={handleSend}
                onStartUnloading={handleStartUnloading}
                onComplete={handleCompleteTrip}
                isLoading={isLoading}
              />
            ) : (
              actionContent
            )}
          </div>
        </div>
      </IonModal>

      <IonModal
        isOpen={Boolean(acceptInvoice)}
        onDidDismiss={() => setAcceptInvoice(null)}
        className={styles.actionModal}
      >
        {acceptInvoice && (
          <div className={styles.modalShell}>
            <div className={styles.modalHead}>
              <div>
                <div className={styles.modalKicker}>Подтверждение</div>
                <h2 className={styles.modalTitle}>Выбрать исполнителя?</h2>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setAcceptInvoice(null)}
                aria-label="Закрыть"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmText}>
                После подтверждения заявка будет принята, с исполнителем будет заключён договор.
              </p>
              <div className={styles.confirmCard}>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>Исполнитель</span>
                  <span className={styles.confirmValue}>
                    {acceptInvoice.client || 'Исполнитель'}
                  </span>
                </div>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>Транспорт</span>
                  <span className={styles.confirmValue}>
                    {[acceptInvoice.transport, acceptInvoice.capacity]
                      .filter(Boolean)
                      .join(' · ') || 'Не указан'}
                  </span>
                </div>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>Ставка</span>
                  <span className={styles.confirmValue}>
                    {formatters.currency(acceptInvoice.price)}
                  </span>
                </div>
              </div>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmCancel}
                  onClick={() => setAcceptInvoice(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.confirmSubmit}
                  disabled={isLoading}
                  onClick={handleConfirmAccept}
                >
                  Подтвердить выбор
                </button>
              </div>
            </div>
          </div>
        )}
      </IonModal>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Подтверждение"
        message="Вы уверены, что хотите удалить этот груз?"
        buttons={[
          {
            text: 'Отмена',
            role: 'cancel',
            handler: () => setShowDeleteAlert(false),
          },
          {
            text: 'Удалить',
            handler: handleDelete,
          },
        ]}
      />

      <IonAlert
        isOpen={Boolean(rejectInvoice)}
        onDidDismiss={() => setRejectInvoice(null)}
        header="Отклонить заявку"
        message="Отклонить заявку этого исполнителя?"
        buttons={[
          {
            text: 'Отмена',
            role: 'cancel',
            handler: () => setRejectInvoice(null),
          },
          {
            text: 'Отклонить',
            handler: () => {
              if (rejectInvoice) void onRejectInvoice(rejectInvoice);
            },
          },
        ]}
      />

      <IonAlert
        isOpen={showUnpublishAlert}
        onDidDismiss={() => setShowUnpublishAlert(false)}
        header="Снять с публикации"
        message="Заказ снова станет черновиком и перестанет быть виден водителям. Снять с публикации?"
        buttons={[
          {
            text: 'Отмена',
            role: 'cancel',
            handler: () => setShowUnpublishAlert(false),
          },
          {
            text: 'Снять',
            handler: handleUnpublish,
          },
        ]}
      />

      <IonModal
        isOpen={publishError !== null}
        onDidDismiss={() => setPublishError(null)}
        className={styles.actionModal}
      >
        <div className={styles.modalShell}>
          <div className={styles.modalHead}>
            <div>
              <div className={styles.modalKicker}>Публикация</div>
              <h2 className={styles.modalTitle}>Публикация неудачна</h2>
            </div>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setPublishError(null)}
              aria-label="Закрыть"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.confirmText}>{publishError}</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmSubmit}
                onClick={() => setPublishError(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </IonModal>

      <IonAlert
        isOpen={showPublishAlert}
        onDidDismiss={() => setShowPublishAlert(false)}
        header="Публикация груза"
        message={publishAlertMessage}
        buttons={[
          {
            text: 'Отмена',
            role: 'cancel',
            handler: () => setShowPublishAlert(false),
          },
          {
            text: 'Опубликовать',
            handler: handlePublish,
          },
        ]}
      />
    </div>
  );
};

export const CargoView = memo(CargoViewInner);
