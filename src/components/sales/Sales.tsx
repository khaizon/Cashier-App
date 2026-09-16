import { FC, useCallback, useEffect, useState } from 'react';

import './Sales.css';
import {
  ApiError,
  DailyTotal,
  PeriodTotals,
  SaleReceipt,
  SalesStats,
  deleteSale,
  downloadSalesCsv,
  fetchRecentSales,
  fetchSalesStats,
} from '../../api/client';
import { formatter } from '../../shared/functions/formatter';
import DeleteSaleDialog from './DeleteSaleDialog';

type SalesProps = {
  token: string;
  onUnauthorized: () => void;
};

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
] as const;

const PAGE_SIZE = 20;

/** "2026-09-16" -> "16 Sep". Parsed as local since it is a calendar date. */
function shortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function timeOf(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  return Number.isNaN(parsed.getTime())
    ? isoTimestamp
    : parsed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function dayOf(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const SummaryCards: FC<{ today: PeriodTotals; period: PeriodTotals; days: number }> = ({ today, period, days }) => (
  <div className="salesCards">
    <div className="salesCard salesCardPrimary">
      <span className="salesCardLabel">Today</span>
      <span className="salesCardValue money">{formatter.format(today.revenue)}</span>
      <span className="salesCardNote">
        {today.transactions} sale{today.transactions === 1 ? '' : 's'} · {today.items_sold} item
        {today.items_sold === 1 ? '' : 's'}
      </span>
    </div>
    <div className="salesCard">
      <span className="salesCardLabel">Last {days} days</span>
      <span className="salesCardValue money">{formatter.format(period.revenue)}</span>
      <span className="salesCardNote">
        {period.transactions} sale{period.transactions === 1 ? '' : 's'}
      </span>
    </div>
    <div className="salesCard">
      <span className="salesCardLabel">Average sale</span>
      <span className="salesCardValue money">{formatter.format(period.average_sale)}</span>
      <span className="salesCardNote">across the period</span>
    </div>
    <div className="salesCard">
      <span className="salesCardLabel">Items sold</span>
      <span className="salesCardValue">{period.items_sold}</span>
      <span className="salesCardNote">in the period</span>
    </div>
  </div>
);

const DailyChart: FC<{ daily: DailyTotal[] }> = ({ daily }) => {
  const peak = Math.max(...daily.map((day) => day.revenue), 0);
  // With nothing sold there is no scale to draw, so say so rather than render
  // a row of invisible zero-height bars.
  const hasSales = peak > 0;

  return (
    <section className="salesPanel">
      <h2>Revenue per day</h2>
      {daily.length === 0 ? (
        <p className="salesEmpty">No days in this window.</p>
      ) : (
        <div
          className={`salesChart${hasSales ? '' : ' salesChartEmpty'}`}
          role="img"
          aria-label={hasSales ? 'Daily revenue' : 'No revenue recorded'}
        >
          {daily.map((day) => {
            const height = hasSales ? Math.max(2, Math.round((day.revenue / peak) * 100)) : 0;
            return (
              <div
                key={day.date}
                className={`salesBar${day.revenue > 0 ? ' salesBarFilled' : ''}`}
                title={`${shortDate(day.date)}: ${formatter.format(day.revenue)} from ${day.transactions} sale${day.transactions === 1 ? '' : 's'}`}
              >
                <span className="salesBarFill" style={{ height: `${height}%` }} />
                <span className="salesBarLabel">{shortDate(day.date)}</span>
              </div>
            );
          })}
        </div>
      )}
      {!hasSales && <p className="salesEmpty">No sales recorded in this window yet.</p>}
    </section>
  );
};

const PaymentMix: FC<{ payments: SalesStats['payments'] }> = ({ payments }) => (
  <section className="salesPanel">
    <h2>Payment mix</h2>
    {payments.length === 0 ? (
      <p className="salesEmpty">Nothing recorded yet.</p>
    ) : (
      <ul className="salesMix">
        {payments.map((entry) => (
          <li key={entry.payment}>
            <div className="salesMixHead">
              <span className={`salesPayTag salesPayTag--${entry.payment}`}>{entry.payment}</span>
              <span className="money">{formatter.format(entry.revenue)}</span>
            </div>
            <div className="salesMixTrack">
              <span className="salesMixFill" style={{ width: `${Math.round(entry.share * 100)}%` }} />
            </div>
            <span className="salesMixNote">
              {Math.round(entry.share * 100)}% · {entry.transactions} sale{entry.transactions === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const TopItems: FC<{ items: SalesStats['top_items'] }> = ({ items }) => (
  <section className="salesPanel">
    <h2>Top sellers</h2>
    {items.length === 0 ? (
      <p className="salesEmpty">Nothing sold yet.</p>
    ) : (
      <table className="salesTable salesTableCompact">
        <thead>
          <tr>
            <th align="left">Item</th>
            <th>Qty</th>
            <th align="right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.title}>
              <td align="left">{item.title}</td>
              <td align="center">{item.quantity}</td>
              <td align="right" className="money">
                {formatter.format(item.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
);

const Sales: FC<SalesProps> = ({ token, onUnauthorized }) => {
  const [days, setDays] = useState<number>(14);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [recent, setRecent] = useState<SaleReceipt[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  /** The sale awaiting confirmation, or null when no prompt is open. */
  const [pendingDelete, setPendingDelete] = useState<SaleReceipt | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** Bumped after a delete so the list and the aggregates are refetched. */
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Rows and aggregates are separate endpoints; load them together so the
    // page never shows a summary that disagrees with the table below it.
    Promise.all([fetchSalesStats(token, days), fetchRecentSales(token, PAGE_SIZE, offset)])
      .then(([nextStats, nextSales]) => {
        if (cancelled) return;
        setStats(nextStats);
        setRecent(nextSales);
        setError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // An expired session is the app's problem, not this page's.
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err instanceof Error ? err.message : 'Could not load recorded sales.');
      });

    return () => {
      cancelled = true;
    };
  }, [token, days, offset, onUnauthorized, reload]);

  const changePeriod = (next: number) => {
    setDays(next);
    // A different window means a different result set; start from the top.
    setOffset(0);
  };

  /**
   * Perform a confirmed deletion.
   *
   * The reload after success matters: the aggregates on this page include the
   * sale that just went, so leaving them stale would contradict the table.
   */
  const confirmDelete = useCallback(
    (reason: string) => {
      if (!pendingDelete) return;
      setDeleting(true);
      deleteSale(token, pendingDelete.id, reason)
        .then(() => {
          setPendingDelete(null);
          setError('');
          setReload((count) => count + 1);
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) {
            onUnauthorized();
            return;
          }
          setError(err instanceof Error ? err.message : 'Could not delete the transaction.');
          setPendingDelete(null);
        })
        .finally(() => setDeleting(false));
    },
    [pendingDelete, token, onUnauthorized],
  );

  // Derived rather than tracked: nothing has arrived yet. Toggling a `loading`
  // flag inside the effect would only cause a cascading render.
  if (!stats) {
    return (
      <div className="sales">
        {error ? (
          <div className="salesError" role="alert">
            {error}
          </div>
        ) : (
          <p className="salesEmpty">loading recorded sales…</p>
        )}
      </div>
    );
  }

  return (
    <div className="sales">
      <header className="salesHeader">
        <div>
          <h1>Recorded sales</h1>
          <p>Every sale the cashier has recorded, newest first.</p>
        </div>
        <div className="salesTools">
          <div className="salesPeriods" role="group" aria-label="Reporting period">
            {PERIODS.map((period) => (
              <button
                key={period.days}
                type="button"
                className={period.days === days ? 'salesPeriodActive' : undefined}
                onClick={() => changePeriod(period.days)}
              >
                {period.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="salesExport"
            disabled={exporting}
            title={`Download the last ${days} days as CSV`}
            onClick={() => {
              setExporting(true);
              setError('');
              downloadSalesCsv(token, days)
                .catch((err: unknown) => {
                  if (err instanceof ApiError && err.status === 401) {
                    onUnauthorized();
                    return;
                  }
                  setError(err instanceof Error ? err.message : 'Could not export the sales CSV.');
                })
                .finally(() => setExporting(false));
            }}
          >
            {exporting ? 'exporting…' : '↓ csv'}
          </button>
        </div>
      </header>

      {error && (
        <div className="salesError" role="alert">
          {error}
          <button type="button" onClick={() => setError('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {stats && (
        <>
          <SummaryCards today={stats.today} period={stats.period} days={stats.range.days} />

          <div className="salesGrid">
            <DailyChart daily={stats.daily} />
            <PaymentMix payments={stats.payments} />
            <TopItems items={stats.top_items} />
          </div>
        </>
      )}

      <section className="salesPanel">
        <h2>Transactions</h2>
        {recent.length === 0 ? (
          <p className="salesEmpty">{offset > 0 ? 'No more transactions.' : 'No sales recorded yet.'}</p>
        ) : (
          <table className="salesTable">
            <thead>
              <tr>
                <th align="left">Ref</th>
                <th align="left">When</th>
                <th align="left">Items</th>
                <th align="left">Payment</th>
                <th align="right">Total</th>
                <th align="right">
                  <span className="salesVisuallyHidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((sale) => (
                <tr key={sale.id}>
                  <td align="left" className="salesRef">
                    {sale.order_ref}
                  </td>
                  <td align="left">
                    <span className="salesWhen">{dayOf(sale.created_at)}</span> {timeOf(sale.created_at)}
                  </td>
                  <td align="left" className="salesLines">
                    {sale.items.map((line) => `${line.quantity}× ${line.title}`).join(', ')}
                  </td>
                  <td align="left">
                    <span className={`salesPayTag salesPayTag--${sale.payment}`}>{sale.payment}</span>
                  </td>
                  <td align="right" className="money">
                    {formatter.format(sale.total)}
                  </td>
                  <td align="right">
                    {/* Opens a confirmation prompt; nothing is deleted directly. */}
                    <button
                      type="button"
                      className="salesDelete"
                      title={`Delete transaction ${sale.order_ref}`}
                      aria-label={`Delete transaction ${sale.order_ref}`}
                      onClick={() => setPendingDelete(sale)}
                    >
                      delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="salesPager">
          <button type="button" disabled={offset === 0} onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}>
            ← newer
          </button>
          <span>
            {recent.length === 0 ? 'nothing to show' : `showing ${offset + 1}–${offset + recent.length}`}
          </span>
          <button type="button" disabled={recent.length < PAGE_SIZE} onClick={() => setOffset((current) => current + PAGE_SIZE)}>
            older →
          </button>
        </div>
      </section>

      {pendingDelete && (
        <DeleteSaleDialog
          orderRef={pendingDelete.order_ref}
          total={pendingDelete.total}
          when={`${dayOf(pendingDelete.created_at)} ${timeOf(pendingDelete.created_at)}`}
          itemSummary={pendingDelete.items.map((line) => `${line.quantity}× ${line.title}`).join(', ')}
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default Sales;
