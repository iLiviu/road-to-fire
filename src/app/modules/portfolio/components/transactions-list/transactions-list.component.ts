import { Component, Input, OnChanges, SimpleChanges, ViewChild, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { Transaction } from '../../models/transaction';
import * as Hammer from 'hammerjs';
import { NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';


/**
 * Component to display a list containing transaction details
 */
@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsListComponent implements OnChanges, OnInit {

  @Input() transactions: Transaction[];
  @Input() dataLoaded = false;
  @ViewChild('viewport') private readonly viewportComponent: CdkVirtualScrollViewport;
  selectionCount = 0;
  txSelectionStates: NumKeyDictionary<boolean> = {};

  constructor(private portfolioService: PortfolioService, private logger: LoggerService) {

  }


  ngOnInit(): void {
  }



  ngOnChanges(changes: SimpleChanges): void {
    if (changes.transactions && this.transactions) {
      // always sort transactions as they can be added with past dates
      // dates are in ISO format so string comparison is fine
      this.transactions.sort((a, b) => a.date < b.date ? 1 : -1);
      this.initSelectionState();
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

  txIdTrackFn(index: number, item: Transaction) {
    if (item && item.id) {
      return item.id;
    }
    return null;
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

  /**
   * Fired when the checked state of a checkbox changes
   * @param state checked state
   * @param tx transaction associated with the checkbox
   */
  itemSelectStateChanged(state: boolean, tx: Transaction) {
    if (this.txSelectionStates[tx.id] !== state) {
      this.txSelectionStates[tx.id] = state;
      if (state) {
        this.selectionCount++;
      } else {
        this.selectionCount--;
      }
    }
  }

  /**
   * Check/Uncheck all transactions
   */
  toggleCheckTransactions() {
    const newState = this.selectionCount !== this.transactions.length;
    for (const tx of this.transactions) {
      this.txSelectionStates[tx.id] = newState;
    }
    if (newState) {
      this.selectionCount = this.transactions.length;
    } else {
      this.selectionCount = 0;
    }
  }

  /**
   * Delete all selected transactions from storage
   */
  async deleteSelectedTransactions() {
    try {
      for (const tx of this.transactions) {
        if (this.txSelectionStates[tx.id]) {
          await this.portfolioService.removeTransaction(tx);
        }
      }
      this.logger.info('Transaction(s) deleted!');
    } catch (err) {
      this.logger.error('An error occurred while deleting transactions!', err);
    }
  }

  /**
   * Calculate the exact number of checked items
   */
  private initSelectionState() {
    this.selectionCount = 0;
    for (const tx of this.transactions) {
      if (this.txSelectionStates[tx.id]) {
        this.selectionCount++;
      }
    }
  }
}
