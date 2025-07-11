import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { RecurringTransaction } from '../../models/recurring-transaction';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import * as Hammer from 'hammerjs';
import { Dictionary } from 'src/app/shared/models/dictionary';

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
  @Input() showHeader = true;
  @Input() baseCurrency: string;
  @Input() forexRates: Dictionary<number> = {};
  @ViewChild('viewport') private readonly viewportComponent: CdkVirtualScrollViewport;
  totalDebit: number;
  totalCredit: number;

  constructor(protected cdr: ChangeDetectorRef) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.transactions && this.transactions) {
      // always sort transactions as they can be added with past dates
      // inactive(invalid) transactions are displayed first
      // dates are in ISO format so string comparison is fine
      this.transactions.sort((a, b) => (a.inactive && !b.inactive) ||
        (a.tx.date < b.tx.date) ? -1 : 1);
      this.calculateTxStats();
    } else if (changes.baseCurrency && this.transactions) {
      this.calculateTxStats();
    }

    if (changes.dataLoaded && this.dataLoaded) {
      // hack so that gestures can be tracked in parent components
      setTimeout(() => {
        const hammertime = new Hammer(this.viewportComponent.elementRef.nativeElement, {});
        // no need to do any action, event is sent to parent
        hammertime.on('swiperight', (ev) => {
        });
        hammertime.on('swipeleft', (ev) => {
        });
      }, 0);
    }
  }

  /**
   * Fired when the size of the component changes.
   * Each time the component is resized we need to resize the virtual scroll viewport as it
   * it doesn't do it automatically in current angular version.
   */
  onResize() {
    if (this.viewportComponent) {
      this.viewportComponent.checkViewportSize();
    }
  }

  txIdTrackFn(index: number, item: RecurringTransaction) {
    if (item && item.id) {
      return item.id;
    }
    return null;
  }

  /**
   * Get the conversion rate between a currency and base currency.
   * If forex rate is not available, throw an error
   * @param currency currency to get the rate for
   */
  protected getCurrencyRate(currency: string): number {
    let rate = 1;
    if (currency !== this.baseCurrency) {
      const currencyPair: string = currency + this.baseCurrency;
      if (this.forexRates[currencyPair]) {
        // we already have the forex rates
        rate = this.forexRates[currencyPair];
      } else {
        throw new Error('Forex rate not available for currency: ' + currency);
      }
    }
    return rate;
  }

  /**
   * Calculate total debit & credit value in base currency for the transactions list
   */
  private async calculateTxStats() {
    this.totalDebit = 0;
    this.totalCredit = 0;
    
    for (const recTx of this.transactions) {
      const txValue = recTx.tx.value * this.getCurrencyRate(recTx.tx.asset.currency);
      if (recTx.tx.isDebit()) {
        this.totalDebit += txValue;
      } else if (recTx.tx.isCredit()) {
        this.totalCredit += txValue;
      }
    }
    this.cdr.markForCheck();
  }

}
