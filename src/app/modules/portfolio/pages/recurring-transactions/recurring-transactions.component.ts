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
   * Get the next interest payment transaction for a given bond and the next principal payment
   * transaction
   * @param bond the bond to get the transactions for
   * @param account account of bond asset
   */
  getBondTransactions(bond: BondAsset, account: PortfolioAccount) {
    const recTxs: RecurringTransaction[] = [];
    const cashAsset = this.getCashAsset(bond, account);

    // get next interest transaction
    const interestAmount = bond.getNextPayableInterest();
    if (interestAmount) {
      let nextInterestDate: Date;
      if (bond.interestPaymentSchedule && bond.interestPaymentSchedule.length > 0) {
        const nextInterestEvent = bond.interestPaymentSchedule[0];
        nextInterestDate = new Date(nextInterestEvent.paymentDate);
      } else {
        nextInterestDate = new Date(bond.maturityDate);
      }
      const withholdingTax = bond.getNextWithholdingTax();
      const tx = this.assetManagementService.createInterestTransaction(interestAmount, 0, withholdingTax, nextInterestDate,
        bond, account, cashAsset);
      const recTx = new RecurringTransaction();
      recTx.autoApprove = true;
      recTx.type = RecurringTransactionType.Never;
      recTx.transactionsLeft = 1;
      recTx.tx = tx;
      recTxs.push(recTx);
    }

    // get next principal payment transaction
    let nextPaymentDate: Date;
    let nextPaymentAmount: number;
    if (bond.principalPaymentSchedule && bond.principalPaymentSchedule.length > 0) {
      const nextPayment = bond.principalPaymentSchedule[0];
      nextPaymentAmount = nextPayment.amount;
      nextPaymentDate = new Date(nextPayment.date);
    } else if (!bond.interestPaymentSchedule || bond.interestPaymentSchedule.length < 2) {
      // we only add the principal payment on expiration if we don't have more than 1 interest payment
      // before expiration as we only want to show the earliest transactions
      nextPaymentDate = new Date(bond.maturityDate);
      nextPaymentAmount = bond.principalAmount;
    }
    if (nextPaymentDate) {
      const tx = this.assetManagementService.createBondPrincipalPaymentTransaction(nextPaymentAmount, bond, cashAsset, account,
        nextPaymentDate, 0, false);
      const recTx = new RecurringTransaction();
      recTx.autoApprove = true;
      recTx.type = RecurringTransactionType.Never;
      recTx.transactionsLeft = 1;
      recTx.tx = tx;
      recTxs.push(recTx);
    }

    return recTxs;
  }

  toggleBondAndDepositTxs() {
    this.portfolioConfig.hideBondAndDepositsRecurringTxs = !this.portfolioConfig.hideBondAndDepositsRecurringTxs;
    this.portfolioService.saveConfig(this.portfolioConfig);
    this.displayTransactions();
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
    allTxs.push(...this.recTxs);
    if (!this.portfolioConfig.hideBondAndDepositsRecurringTxs) {
      allTxs.push(...this.assetTxs);
    }
    this.transactions = allTxs;
  }

  private async loadTransactions() {
    try {
      const recTxsPromise$ = this.portfolioService.getRecurringTransactions();
      const assetTxsPromise$ = this.getAssetRecurringTxs();
      [this.recTxs, this.assetTxs] = await Promise.all([recTxsPromise$, assetTxsPromise$]);
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
