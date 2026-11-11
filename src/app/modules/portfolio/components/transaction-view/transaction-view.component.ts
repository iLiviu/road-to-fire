import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  Transaction, TransactionType
} from '../../models/transaction';
import { ExchangeTransaction } from '../../models/exchange-transaction';
import { TransferTransaction } from '../../models/transfer-transaction';
import { TradeTransaction } from '../../models/trade-transaction';
import { TwoWayTransaction } from '../../models/two-way-transaction';

/**
 * Component to display details about a transaction
 */
@Component({
  selector: 'app-transaction-view',
  templateUrl: './transaction-view.component.html',
  styleUrls: ['./transaction-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionViewComponent {

  exchangeTx: ExchangeTransaction;
  isCredit: boolean;
  isDebit: boolean;
  includesCash: boolean;
  transferTx: TransferTransaction;
  tradeTx: TradeTransaction;
  twoWayTx: TwoWayTransaction;

  readonly TransactionType = TransactionType;

  constructor(
    public dialogRef: MatDialogRef<TransactionViewComponent>,
    @Inject(MAT_DIALOG_DATA) public tx: Transaction
  ) {
    if (tx.isExchange()) {
      this.exchangeTx = <ExchangeTransaction>tx;
    } else if (tx.isTransfer()) {
      this.transferTx = <TransferTransaction>tx;
    } else if (tx.isTrade()) {
      this.tradeTx = <TradeTransaction>tx;
    }
    if (tx.isTwoWayTransaction()) {
      this.twoWayTx = <TwoWayTransaction>tx;
    }
    this.isCredit = tx.isCredit();
    this.isDebit = tx.isDebit();
    this.includesCash = tx.includesCash();
  }

  get displayName(): string {
    return this.tx?.description || 'Transaction';
  }

  get transactionTypeLabel(): string {
    if (!this.tx) {
      return 'Transaction';
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
        return 'Transaction';
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
