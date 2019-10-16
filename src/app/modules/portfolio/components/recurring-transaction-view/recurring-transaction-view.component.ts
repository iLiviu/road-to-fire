import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';

import {
  TransactionType,
  Transaction
} from '../../models/transaction';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
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
  styleUrls: ['./recurring-transaction-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringTransactionViewComponent implements OnInit {

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

  constructor(public dialogRef: MatDialogRef<RecurringTransactionViewComponent>,
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
    } else {
    }
    this.isCredit = recTx.tx.isCredit();
    this.isDebit = recTx.tx.isDebit();

    this.txOccurrence = this.recTx.getOccurrenceString();
  }

  ngOnInit() {
  }
}
