import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import {
  TransactionType,
  Transaction
} from '../../models/transaction';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RecurringTransaction, RecurringTransactionType } from '../../models/recurring-transaction';
import { ExchangeTransaction } from '../../models/exchange-transaction';
import { TransferTransaction } from '../../models/transfer-transaction';
import { TradeTransaction } from '../../models/trade-transaction';
import { TwoWayTransaction } from '../../models/two-way-transaction';

/**
 * Component that displays a UI for viewing the details of a recurring transaction.
 */
@Component({
  selector: 'app-recurring-transaction-view',
  templateUrl: './recurring-transaction-view.component.html',
  styleUrls: ['./recurring-transaction-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringTransactionViewComponent {

  exchangeTx: ExchangeTransaction;
  isCredit: boolean;
  isDebit: boolean;
  tx: Transaction;
  transferTx: TransferTransaction;
  tradeTx: TradeTransaction;
  twoWayTx: TwoWayTransaction;
  txOccurrence: string;

  readonly TransactionType = TransactionType;
  readonly RecurringTransactionType = RecurringTransactionType;

  constructor(
    public dialogRef: MatDialogRef<RecurringTransactionViewComponent>,
    @Inject(MAT_DIALOG_DATA) public recTx: RecurringTransaction) {
    this.tx = recTx.tx;
    if (recTx.tx.isExchange()) {
      this.exchangeTx = <ExchangeTransaction>recTx.tx;
      this.twoWayTx = <TwoWayTransaction>recTx.tx;
    } else if (recTx.tx.isTransfer()) {
      this.transferTx = <TransferTransaction>recTx.tx;
      this.twoWayTx = <TwoWayTransaction>recTx.tx;
    } else if (recTx.tx.isTrade()) {
      this.tradeTx = <TradeTransaction>recTx.tx;
    }
    this.isCredit = recTx.tx.isCredit();
    this.isDebit = recTx.tx.isDebit();

    this.txOccurrence = this.recTx.getOccurrenceString();
  }

  get displayName(): string {
    return this.tx?.description || 'Recurring Transaction';
  }

  get transactionTypeLabel(): string {
    if (!this.tx) {
      return 'Recurring Transaction';
    }
    switch (this.tx.type) {
      case TransactionType.DebitCash:
        return 'Debit Cash';
      case TransactionType.CreditCash:
        return 'Credit Cash';
      case TransactionType.Transfer:
        return 'Transfer';
      case TransactionType.CashTransfer:
        return 'Cash Transfer';
      case TransactionType.Exchange:
        return 'Exchange';
      case TransactionType.Buy:
        return 'Buy';
      case TransactionType.Sell:
        return 'Sell';
      case TransactionType.Dividend:
      case TransactionType.CashDividend:
        return 'Dividend';
      case TransactionType.Interest:
      case TransactionType.CashInterest:
        return 'Interest';
      case TransactionType.PrincipalPayment:
        return 'Principal Payment';
      case TransactionType.CapitalCost:
        return 'Capital Cost';
      default:
        if (this.isCredit) {
          return 'Credit';
        }
        if (this.isDebit) {
          return 'Debit';
        }
        return 'Recurring Transaction';
    }
  }

  get typeBadgeClass(): string {
    if (!this.tx) {
      return '';
    }
    if (this.exchangeTx) {
      return 'exchange';
    }
    if (this.transferTx) {
      return 'transfer';
    }
    if (this.isCredit) {
      return 'credit';
    }
    if (this.isDebit) {
      return 'debit';
    }
    return '';
  }

  cancel() {
    this.dialogRef.close();
  }
}
