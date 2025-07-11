import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PortfolioPageComponent } from '../../components/portfolio-page/portfolio-page.component';
import { RecurringTransaction, RecurringTransactionType } from '../../models/recurring-transaction';
import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { PortfolioService } from '../../services/portfolio.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { Router } from '@angular/router';
import { LoggerService } from 'src/app/core/services/logger.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { AssetType, Asset } from '../../models/asset';
import { DepositAsset } from '../../models/deposit-asset';
import { PortfolioAccount } from '../../models/portfolio-account';
import { AssetManagementService } from '../../services/asset-management.service';
import { BondAsset } from '../../models/bond-asset';
import { debounce } from 'lodash-decorators';
import { AssetFactory } from '../../models/asset-factory';
import { DateUtils, FloatingMath } from 'src/app/shared/util';
import { RecurringTransactionsFilterEditComponent, RecurringTransactionFilters, RecurringTransactionFilterInterval } from '../../components/recurring-transactions-filter-edit/recurring-transactions-filter-edit.component';

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

  assetTxs: RecurringTransaction[];
  recTxs: RecurringTransaction[];
  transactions: RecurringTransaction[];
  transactionsLoaded = false;
  private loadTimer: any;
  filters: RecurringTransactionFilters = {
    showDividendTransactions: true,
    showUserTransactions: true,
    showBondAndDepositTransactions: true,
    interval: RecurringTransactionFilterInterval.all,
  };

  constructor(protected eventsService: EventsService, protected portfolioService: PortfolioService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef,
    protected assetManagementService: AssetManagementService) {
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

  /**
   * Get the associated cash asset for a given asset. If a specific cash asset is
   * not recorded, then choose a cash asset that has the same currency from the same account.
   * @param asset asset to get associated cash asset for
   * @param account account where asset is located
   */
  private getCashAsset(asset: Asset, account: PortfolioAccount) {
    let cashAsset: Asset;
    if (asset.cashAssetId) {
      cashAsset = account.getAssetById(asset.cashAssetId);
      // check that cash asset currency was not changed
      if (cashAsset && cashAsset.currency !== asset.currency) {
        cashAsset = null;
      }
    }
    if (!cashAsset) {
      let matchesFound = 0;
      for (const accAsset of account.assets) {
        if (accAsset.type === AssetType.Cash && accAsset.currency === asset.currency) {
          matchesFound++;
          if (matchesFound > 1) {
            // if we have more than one cash account, do not automatically pick one
            cashAsset = null;
            break;
          }
          cashAsset = accAsset;
        }
      }

    }
    return cashAsset;
  }

  /**
   * Get the next interest payment transaction and liquidation transaction (if deposit is not set to autorenew)
   * @param deposit the deposit to get transactions for
   * @param account account of deposit asset
   */
  getDepositTransactions(deposit: DepositAsset, account: PortfolioAccount) {
    const recTxs: RecurringTransaction[] = [];
    const interestAmount = deposit.getPayableInterest();
    const withholdingTax = deposit.getWithholdingTax();
    const cashAsset = this.getCashAsset(deposit, account);
    const expirationDate = new Date(deposit.maturityDate);
    let addInterestTx = false;

    if (deposit.autoRenew) {
      if (!deposit.capitalize) {
        addInterestTx = true;
      }
    } else {
      const tx = this.assetManagementService.createDepositLiquidateTransaction(deposit, account, expirationDate, cashAsset);
      const recTx = new RecurringTransaction();
      recTx.autoApprove = true;
      recTx.type = RecurringTransactionType.Never;
      recTx.transactionsLeft = 1;
      recTx.tx = tx;
      recTxs.push(recTx);

      addInterestTx = true;
    }

    if (addInterestTx) {
      const tx = this.assetManagementService.createInterestTransaction(interestAmount, 0, withholdingTax,
        expirationDate, deposit, account, cashAsset);
      const recTx = new RecurringTransaction();
      recTx.autoApprove = true;
      recTx.type = RecurringTransactionType.Never;
      recTx.transactionsLeft = 1;
      recTx.tx = tx;
      recTxs.push(recTx);
    }
    return recTxs;
  }


  /**
   * Get all principal & interest payment transactions for a given bond
   * @param bond the bond to get the transactions for
   * @param account account of bond asset
   */
  getBondTransactions(bond: BondAsset, account: PortfolioAccount) {
    const recTxs: RecurringTransaction[] = [];
    const cashAsset = this.getCashAsset(bond, account);
    const bondCopy = <BondAsset>AssetFactory.newInstance(bond.type, bond);
    let transactionsLeft: boolean;
    do {
      transactionsLeft = false;
      // get next interest transaction    
      let interestAmount = bondCopy.getNextPayableInterest();
      let nextInterestDate: Date;
      if (interestAmount) {
        nextInterestDate = bondCopy.getNextInterestPaymentDate();
        const withholdingTax = bondCopy.getNextWithholdingTax();
        const tx = this.assetManagementService.createInterestTransaction(interestAmount, 0, withholdingTax, nextInterestDate,
          bondCopy, account, cashAsset);
        const recTx = new RecurringTransaction();
        recTx.autoApprove = true;
        recTx.type = RecurringTransactionType.Never;
        recTx.transactionsLeft = 1;
        recTx.tx = tx;
        recTxs.push(recTx);
        transactionsLeft = true;

        bondCopy.interestPaymentSchedule.splice(0, 1);
        bondCopy.previousInterestPaymentDate = nextInterestDate.toISOString();
      }

      // get next principal payment transaction
      let nextPaymentDate: Date;
      let nextPaymentAmount: number;
      if (bondCopy.principalPaymentSchedule && bondCopy.principalPaymentSchedule.length > 0) {
        const nextPayment = bondCopy.principalPaymentSchedule[0];
        nextPaymentAmount = nextPayment.amount;
        nextPaymentDate = new Date(nextPayment.date);
      } else {
        nextPaymentDate = new Date(bondCopy.maturityDate);
        nextPaymentAmount = bondCopy.principalAmount;
      }
      if (bondCopy.interestPaymentSchedule.length > 0) {
        nextInterestDate = bondCopy.getNextInterestPaymentDate();
      } else {
        nextInterestDate = null;
      }
      if (nextPaymentDate && (!nextInterestDate || DateUtils.compareDates(nextPaymentDate, nextInterestDate) < 0)) {
        const tx = this.assetManagementService.createBondPrincipalPaymentTransaction(nextPaymentAmount, bondCopy, cashAsset, account,
          nextPaymentDate, 0, false);
        const recTx = new RecurringTransaction();
        recTx.autoApprove = true;
        recTx.type = RecurringTransactionType.Never;
        recTx.transactionsLeft = 1;
        recTx.tx = tx;
        recTxs.push(recTx);
        bondCopy.principalAmount = FloatingMath.fixRoundingError(bondCopy.principalAmount - nextPaymentAmount);
        if (bondCopy.principalPaymentSchedule && bondCopy.principalPaymentSchedule.length > 0) {
          bondCopy.principalPaymentSchedule.splice(0, 1);
        }
        transactionsLeft = bondCopy.principalAmount > 0;
      }
    } while (transactionsLeft);

    return recTxs;
  }

  /**
   * Open the filter editor dialog and allow user to select filters for transactions
   */
  async showFilterDialog() {
    const newFilters = await this.dialogService.showAdaptableScreenModal(RecurringTransactionsFilterEditComponent, this.filters);
    if (newFilters) {
      this.filters = newFilters;
      this.displayTransactions();
      this.cdr.markForCheck();
    }
  }

  /**
   * Get a list of bond & deposit interest & principal payment transactions
   */
  private async getAssetRecurringTxs() {
    const recTxs: RecurringTransaction[] = [];
    const accounts = await this.portfolioService.getAccounts();
    for (const account of accounts) {
      for (const asset of account.assets) {
        if (asset.type === AssetType.Deposit) {
          const newTxs = this.getDepositTransactions(<DepositAsset>asset, account);
          recTxs.push(...newTxs);
        } else if (asset.type === AssetType.Bond || asset.type === AssetType.P2P) {
          const newTxs = this.getBondTransactions(<BondAsset>asset, account);
          recTxs.push(...newTxs);
        }
      }
    }
    return recTxs;
  }

  /**
   * Prepare the transaction list that will be displayed
   */
  private displayTransactions() {
    const allTxs: RecurringTransaction[] = [];
    if (this.filters.showUserTransactions || this.filters.showDividendTransactions) {
      allTxs.push(...this.recTxs.filter(recTx => recTx.tx.isDividend() ? this.filters.showDividendTransactions : this.filters.showUserTransactions));
    }
    if (this.filters.showBondAndDepositTransactions) {
      allTxs.push(...this.assetTxs);
    }
    this.transactions = allTxs.filter((recTx: RecurringTransaction) =>
      (this.filters.showDividendTransactions || !recTx.tx.isDividend()) &&
      (!this.filters.minDate || DateUtils.compareDates(this.filters.minDate, new Date(recTx.tx.date)) <= 0) &&
      (!this.filters.maxDate || DateUtils.compareDates(this.filters.maxDate, new Date(recTx.tx.date)) >= 0)
    );
  }

  private async loadTransactions() {
    try {
      const recTxsPromise$ = this.portfolioService.getRecurringTransactions();
      const assetTxsPromise$ = this.getAssetRecurringTxs();
      [this.recTxs, this.assetTxs] = await Promise.all([recTxsPromise$, assetTxsPromise$]);

      const allTxs: RecurringTransaction[] = [];
      allTxs.push(...this.recTxs);
      allTxs.push(...this.assetTxs);
      const requiredCurrencies: string[] = [];
      allTxs.forEach(recTx => requiredCurrencies.push(recTx.tx.asset.currency));
      await this.updateForexRates(requiredCurrencies);

      this.displayTransactions();
    } catch (err) {
      this.logger.error('An error occurred while retrieving recurring transactions!', err);
    }
    this.transactionsLoaded = true;
    this.cdr.markForCheck();
  }

  @debounce(100)
  private onTransactionsUpdated() {
    if (this.isConfigLoaded()) {
      this.loadTransactions();
    }
  }
}
