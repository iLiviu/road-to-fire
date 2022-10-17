import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
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
  styleUrls: ['./transaction-view.component.css'],
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

  constructor(public dialogRef: MatDialogRef<TransactionViewComponent>,
    @Inject(MAT_DIALOG_DATA) public tx: Transaction) {
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

}
