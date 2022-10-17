import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { RecurringTransaction } from '../../models/recurring-transaction';

/**
 * Component to display a sorted list of recurring transactions.
 */
@Component({
  selector: 'app-recurring-transactions-list',
  templateUrl: './recurring-transactions-list.component.html',
  styleUrls: ['./recurring-transactions-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringTransactionsListComponent implements OnChanges {

  @Input() transactions: RecurringTransaction[];
  @Input() dataLoaded = false;

  constructor() { }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes.transactions && this.transactions) {
      // always sort transactions as they can be added with past dates
      // inactive(invalid) transactions are displayed first
      // dates are in ISO format so string comparison is fine
      this.transactions.sort((a, b) => (a.inactive && !b.inactive) ||
        (a.tx.date < b.tx.date) ? -1 : 1);
    }
  }

  txIdTrackFn(index: number, item: RecurringTransaction) {
    if (item && item.id) {
      return item.id;
    }
    return null;
  }
}
