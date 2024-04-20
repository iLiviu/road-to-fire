import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';

import { TransactionType, Transaction, TRANSACTION_ICONS } from '../../models/transaction';
import { AssetManagementService } from '../../services/asset-management.service';


/**
 * Display a list item containing details about a transaction
 * @see TransactionsListComponent
 */
@Component({
  selector: 'app-transactions-list-item',
  templateUrl: './transactions-list-item.component.html',
  styleUrls: ['./transactions-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsListItemComponent implements OnChanges {

  @Input('transaction') tx: Transaction;
  isCredit: boolean;
  isDebit: boolean;
  isTransfer: boolean;
  includesCash: boolean;
  @Input() selected: boolean;
  @Input() readOnly: boolean = false;
  @Output() selectStateChange = new EventEmitter<boolean>();

  readonly TransactionType = TransactionType;
  readonly TRANSACTION_ICONS = TRANSACTION_ICONS;

  constructor(private assetManagementService: AssetManagementService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.tx) {
      this.isCredit = this.tx.isCredit();
      this.isDebit = this.tx.isDebit();
      this.isTransfer = this.tx.isTransfer();
      this.includesCash = this.tx.includesCash();
    }
  }

  viewTransaction() {
    this.assetManagementService.viewTransaction(this.tx);
  }

  /**
   * A helper function to prevent default action for an event
   */
  preventDefault(event: Event) {
    event.stopPropagation();
  }

  /**
   * Fired when the checked state of the list item checkbox changes
   * @param event source event
   */
  selectionChanged(event: Event) {
    this.selectStateChange.emit(this.selected);

  }
}
