import React from 'react';
import { Star, Truck, User, Package } from 'lucide-react';
import { DriverInfo } from '../../../Store/cargoStore';
import { formatters } from '../../../utils/utils';
import styles from './InvoiceOfferCard.module.css';

type InvoiceOfferCardProps = {
  invoice: DriverInfo;
};

export const InvoiceOfferCard: React.FC<InvoiceOfferCardProps> = ({ invoice }) => {
  return (
    <section className={styles.card} aria-label="Заявка водителя">
      <div className={styles.head}>
        <div>
          <div className={styles.kicker}>Заявка водителя</div>
          <h2 className={styles.title}>{invoice.client || 'Водитель'}</h2>
        </div>
        <div className={styles.status}>{invoice.status}</div>
      </div>

      <div className={styles.price}>{formatters.currency(invoice.price)}</div>

      <div className={styles.grid}>
        <div className={styles.row}>
          <span className={styles.icon}>
            <User size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>Водитель</div>
            <div className={styles.value}>{invoice.client || '—'}</div>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.icon}>
            <Star size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>Рейтинг</div>
            <div className={styles.value}>{invoice.rating || '—'}</div>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.icon}>
            <Truck size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>Транспорт</div>
            <div className={styles.value}>
              {invoice.transport || '—'}
              {invoice.capacity ? ` · ${invoice.capacity}` : ''}
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.icon}>
            <Package size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>Вес / объём</div>
            <div className={styles.value}>
              {invoice.weight} т · {invoice.volume} м³
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
