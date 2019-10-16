import { Component, OnInit, Input, SimpleChanges, OnChanges, ChangeDetectionStrategy } from '@angular/core';

import { TransactionType, TRANSACTION_ICONS } from '../../models/transaction';
import { RecurringTransaction, RecurringTransactionType } from '../../models/recurring-transaction';
import { AssetManagementService } from '../../services/asset-management.service';

/**
 * Component to display an element of a recurring transactions list
 * @see RecurringTransactionsListComponent
 */
@Component({
  selector: 'app-recurring-transactions-list-item',
  templateUrl: './recurring-transactions-list-item.component.html',
  styleUrls: ['./recurring-transactions-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringTransactionsListItemComponent implements OnInit, OnChanges {

  @Input('transaction') recTx: RecurringTransaction;
  isCredit: boolean;
  isDebit: boolean;
  txOccurrence: string;
  txIcon: string;

  readonly TransactionType = TransactionType;
  readonly RecurringTransactionType = RecurringTransactionType;
  readonly TRANSACTION_ICONS = TRANSACTION_ICONS;

  constructor(private assetManagementService: AssetManagementService) { }

  ngOnInit() {
    this.txOccurrence = this.recTx.getOccurrenceString();
    if (this.recTx.inactive) {
      this.txIcon = 'error';
    } else {
      this.txIcon = TRANSACTION_ICONS[this.recTx.tx.type];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.recTx) {
      this.isCredit = this.recTx.tx.isCredit();
      this.isDebit = this.recTx.tx.isDebit();
    }
  }

  onItemMenu(event: Event) {
    // prevent default item action
    event.stopPropagation();
  }

  delete() {
    this.assetManagementService.removeRecurringTransaction(this.recTx);
  }

  view() {
    this.assetManagementService.viewRecurringTransaction(this.recTx);
  }

  edit() {
    this.assetManagementService.editRecurringTransaction(this.recTx);
  }
}
