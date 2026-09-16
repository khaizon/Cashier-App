import { FC, useState } from 'react';

import './DeleteSaleDialog.css';
import { formatter } from '../../shared/functions/formatter';

/**
 * Confirmation before a transaction is deleted.
 *
 * The prompt is deliberately explicit rather than a bare `confirm()`: deleting a
 * sale removes money from the day's totals, the reports and the CSV, so the
 * operator is shown exactly which transaction is about to go and is asked to say
 * why. The reason is required because it becomes the audit record.
 */

/** Common causes, so the usual case is one click and a confirm. */
const PRESET_REASONS = [
  'Rang up by mistake',
  'Customer cancelled',
  'Duplicate entry',
  'Test transaction',
] as const;

const OTHER = 'Other';

type DeleteSaleDialogProps = {
  orderRef: string;
  total: number;
  itemSummary: string;
  when: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

const DeleteSaleDialog: FC<DeleteSaleDialogProps> = ({
  orderRef,
  total,
  itemSummary,
  when,
  busy = false,
  onCancel,
  onConfirm,
}) => {
  const [choice, setChoice] = useState<string>(PRESET_REASONS[0]);
  const [custom, setCustom] = useState('');

  const usingOther = choice === OTHER;
  const reason = (usingOther ? custom : choice).trim();
  const canDelete = reason.length > 0 && !busy;

  return (
    <div className="deleteSaleBackdrop" role="dialog" aria-modal="true" aria-label={`Delete transaction ${orderRef}`}>
      <div className="deleteSaleCard">
        <h2>Delete this transaction?</h2>

        <dl className="deleteSaleSummary">
          <div>
            <dt>Reference</dt>
            <dd className="deleteSaleRef">{orderRef}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>{when}</dd>
          </div>
          <div>
            <dt>Items</dt>
            <dd>{itemSummary}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd className="money">{formatter.format(total)}</dd>
          </div>
        </dl>

        <p className="deleteSaleWarning">
          This removes the sale from the day&apos;s totals, the reports and the CSV export. It cannot be undone, but the
          removal is recorded with your name and the reason below.
        </p>

        <label className="deleteSaleReason">
          Reason
          <select value={choice} onChange={(event) => setChoice(event.target.value)} disabled={busy}>
            {PRESET_REASONS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
            <option value={OTHER}>{OTHER}…</option>
          </select>
        </label>

        {usingOther && (
          <input
            className="deleteSaleCustom"
            value={custom}
            autoFocus
            maxLength={255}
            placeholder="Why is this being deleted?"
            onChange={(event) => setCustom(event.target.value)}
          />
        )}

        <div className="deleteSaleActions">
          <button type="button" className="deleteSaleCancel" onClick={onCancel} disabled={busy}>
            cancel
          </button>
          <button
            type="button"
            className="deleteSaleConfirm"
            disabled={!canDelete}
            onClick={() => onConfirm(reason)}
          >
            {busy ? 'deleting…' : 'delete transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSaleDialog;
