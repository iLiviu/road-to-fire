import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { Transaction } from '../../models/transaction';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioPageComponent } from '../../components/portfolio-page/portfolio-page.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { StorageService } from 'src/app/core/services/storage.service';

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

  transactions: Transaction[];
  transactionsLoaded = false;

  private loadTimer;

  constructor(protected eventsService: EventsService, protected portfolioService: PortfolioService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef) {
    super(logger, portfolioService, dialogService, eventsService, router, storageService);
  }

  ngOnInit() {
    super.ngOnInit();
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

  private async loadTransactions() {
    try {
      const transactions = await this.portfolioService.getTransactions();
      this.transactions = transactions;
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
