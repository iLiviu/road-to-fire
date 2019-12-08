import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PortfolioPageComponent } from '../../components/portfolio-page/portfolio-page.component';
import { RecurringTransaction } from '../../models/recurring-transaction';
import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { PortfolioService } from '../../services/portfolio.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { Router } from '@angular/router';
import { LoggerService } from 'src/app/core/services/logger.service';
import { StorageService } from 'src/app/core/services/storage.service';

/**
 * Component to display a page, allowing the user to manage the recurring transactions
 * (view/edit/delete)
 */
@Component({
  selector: 'app-recurring-transactions',
  templateUrl: './recurring-transactions.component.html',
  styleUrls: ['./recurring-transactions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class RecurringTransactionsComponent extends PortfolioPageComponent implements OnInit {

  transactions: RecurringTransaction[];
  transactionsLoaded = false;
  private loadTimer: any;

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
      case AppEventType.RECURRING_TRANSACTION_ADDED:
      case AppEventType.RECURRING_TRANSACTION_REMOVED:
      case AppEventType.RECURRING_TRANSACTION_UPDATED:
        this.onTransactionsUpdated();
        break;
      default:
        super.handleEvents(event);
    }
  }

  private async loadTransactions() {
    try {
      const transactions = await this.portfolioService.getRecurringTransactions();
      this.transactions = transactions;
    } catch (err) {
      this.logger.error('An error occurred while retrieving recurring transactions!', err);
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
