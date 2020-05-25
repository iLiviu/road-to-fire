import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { Transaction, TransactionType } from '../../models/transaction';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioPageComponent } from '../../components/portfolio-page/portfolio-page.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { StorageService } from 'src/app/core/services/storage.service';
import {
  TransactionsFilterEditComponent, TransactionFilters
} from '../../components/transactions-filter-edit/transactions-filter-edit.component';
import { DateUtils } from 'src/app/shared/util';

/**
 * Component to display a page where the user can see the list of all transactions and manage (delete) them
 */
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent extends PortfolioPageComponent implements OnInit {

  allTransactions: Transaction[];
  transactions: Transaction[];
  transactionsLoaded = false;
  filters: TransactionFilters;

  private loadTimer;

  constructor(protected eventsService: EventsService, protected portfolioService: PortfolioService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef) {
    super(logger, portfolioService, dialogService, eventsService, router, storageService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.filters = {
      includedTypes: {},
      minDate: null,
      maxDate: null,
    };
    // select all transaction types
    Object.values(TransactionType).forEach(txType => this.filters.includedTypes[txType] = true);
  }

  /**
   * Open the filter editor dialog and allow user to select filters for transactions
   */
  async showFilterDialog() {
    const newFilters = await this.dialogService.showAdaptableScreenModal(TransactionsFilterEditComponent, this.filters);
    if (newFilters) {
      this.filters = newFilters;
      this.filterTransactions();
      this.cdr.markForCheck();
    }
  }

  protected onConfigLoaded() {
    super.onConfigLoaded();
    this.loadTransactions();
  }

  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.TRANSACTION_ADDED:
      case AppEventType.TRANSACTION_REMOVED:
      case AppEventType.TRANSACTION_UPDATED:
        this.onTransactionsUpdated();
        break;
      default:
        super.handleEvents(event);
    }
  }

  /**
   * Display only transactions that match the given filters
   */
  private filterTransactions() {
    this.transactions = this.allTransactions.filter((tx: Transaction) =>
      this.filters.includedTypes[tx.type] &&
      (!this.filters.minDate || DateUtils.compareDates(this.filters.minDate, new Date(tx.date)) <= 0) &&
      (!this.filters.maxDate || DateUtils.compareDates(this.filters.maxDate, new Date(tx.date)) >= 0)
    );
  }

  private async loadTransactions() {
    try {
      this.allTransactions = await this.portfolioService.getTransactions();
      this.filterTransactions();
    } catch (err) {
      this.logger.error('An error occurred while retrieving transactions!', err);
    }
    this.transactionsLoaded = true;
    this.cdr.markForCheck();
  }


  private onTransactionsUpdated() {
    clearTimeout(this.loadTimer);
    // delay load to avoid multiple refreshes when more transactions are updated at once
    this.loadTimer = setTimeout(() => {
      this.loadTransactions();
    }, 100);
  }
}
