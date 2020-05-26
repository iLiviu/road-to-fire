import { Injectable } from '@angular/core';

import { AssetType, Asset } from '../models/asset';
import { PortfolioService } from './portfolio.service';
import { PortfolioAccount } from '../models/portfolio-account';
import { Transaction, TransactionType, TransactionData } from '../models/transaction';
import { RecurringTransactionType, RecurringTransaction } from '../models/recurring-transaction';
import { StorageService } from 'src/app/core/services/storage.service';
import { DepositAsset } from '../models/deposit-asset';
import { BondAsset } from '../models/bond-asset';
import { TransferTransaction, TransferTransactionData } from '../models/transfer-transaction';
import { AssetManagementService } from './asset-management.service';
import { FloatingMath, DateUtils } from 'src/app/shared/util';
import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { LoggerService } from 'src/app/core/services/logger.service';

/**
 * Service that periodically checks for actions that need to be executed:
 * scheduled transactions that are due, deposits and bonds that have matured,
 * interest & principal payments on bonds are due
 */
@Injectable()
export class PeriodicChecksService {

  private started = false;
  private portfolioModuleLoaded = false;
  private storageSynced = false;
  private offlineCheckQueued = false;

  constructor(private portfolioService: PortfolioService, private storageService: StorageService,
    private assetManagementService: AssetManagementService, private eventsService: EventsService,
    private logger: LoggerService) {
    this.eventsService.events$.subscribe(event => this.handleEvents(event));
    this.storageService.waitForSync().then(() => {
      this.storageSynced = true;
      this.firstStart();
    });
  }

  /**
   * Listen for events and handle the ones specific to this service
   * @param event event that was triggered
   */
  private handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.PORTFOLIO_MODULE_LOADED:
        this.portfolioModuleLoaded = true;
        this.firstStart();
        break;
      case AppEventType.OFFLINE_MODE_TOGGLED:
        if (!event.data) {
          // we are back online
          if (this.offlineCheckQueued) {
            // wait for cloud sync before resuming periodic checks
            this.storageService.waitForSync().then(() => {
              this.runPeriodicChecks();
            });
          }
        }
        break;
    }
  }

  private async firstStart() {
    if (this.portfolioModuleLoaded && this.storageSynced && !this.started) {
      this.started = true;

      await this.runPeriodicChecks();
      setInterval(() => this.runPeriodicChecks(), 60 * 60 * 1000); // run every hour

      // when the app first loads, try to to a silent update for the quotes
      await this.portfolioService.updateAssetQuotes(true);
    }

  }

  private async addAutomaticTransaction(tx: Transaction) {
    tx = await this.portfolioService.addTransaction(tx);
    this.portfolioService.addTransactionDoneNotification(tx.description, tx.id);
    return tx;
  }

  /**
   * Check if deposit is expired, and credit appropriate cash amount if so
   * @param deposit deposit to check
   * @param account account of deposit
   */
  private async checkDeposit(deposit: DepositAsset, account: PortfolioAccount) {
    const expirationDate = new Date(deposit.maturityDate);
    const now = new Date();
    if (DateUtils.compareDates(expirationDate, now) <= 0 && !deposit.pendingDelete) {
      const interestAmount = deposit.getPayableInterest();
      const withholdingTax = deposit.getWithholdingTax();
      if (deposit.autoRenew) {
        const newExpirationDate = new Date(expirationDate.getTime() + deposit.getPeriod());
        deposit.creationDate = deposit.maturityDate;
        deposit.maturityDate = newExpirationDate.toISOString();
        if (deposit.capitalize) {
          deposit.amount = FloatingMath.fixRoundingError(deposit.amount + interestAmount);
          this.portfolioService.addTextNotification('Deposit renewed', `"${deposit.description}" has been renewed and interest ` +
            `has been capitalized.`);
        } else {
          await this.assetManagementService.payInterest(interestAmount, 0, withholdingTax, expirationDate, deposit, null,
            account, true, true);
        }
        await this.portfolioService.updateAsset(deposit, account);
      } else {
        await this.assetManagementService.payInterest(interestAmount, 0, withholdingTax, expirationDate, deposit, null,
          account, true, true);

        const txDescription = 'Liquidated deposit ' + deposit.description;
        const txValue = deposit.amount;
        const txData: TransferTransactionData = {
          asset: {
            accountDescription: account.description,
            accountId: account.id,
            id: deposit.id,
            description: deposit.description,
            currency: deposit.currency,
          },
          otherAsset: {
            accountDescription: account.description,
            accountId: account.id,
            currency: deposit.currency,
          },
          date: expirationDate.toISOString(),
          description: txDescription,
          type: TransactionType.Transfer,
          fee: 0,
          value: txValue,
        };
        let tx = new TransferTransaction(txData);

        const cashAsset = this.getCashAsset(deposit, account);
        if (cashAsset) {
          cashAsset.amount = FloatingMath.fixRoundingError(cashAsset.amount + txValue);
          await this.portfolioService.updateAsset(cashAsset, account);
          await this.portfolioService.removeAsset(deposit, account);
          tx.otherAsset.description = cashAsset.description;
          tx.otherAsset.id = cashAsset.id;
          tx = <TransferTransaction>await this.addAutomaticTransaction(tx);
        } else {
          await this.portfolioService.addPendingTransactionNotification('Pending deposit liquidation', tx);
          deposit.pendingDelete = true;
          await this.portfolioService.updateAsset(deposit, account);
        }

      }
    }
  }

  /**
   * Check if bond is expired or has a due interest or principal payment
   * and credit appropriate cash amount if so.
   * @param bond bond to check
   * @param account account of deposit
   */
  private async checkBond(bond: BondAsset, account: PortfolioAccount) {
    const now = new Date();
    let needsRecheck = false;

    // check if interest payment is due
    if (bond.interestPaymentSchedule && bond.interestPaymentSchedule.length > 0) {
      const nextInterestEvent = bond.interestPaymentSchedule[0];
      const nextInterestDate = new Date(nextInterestEvent.paymentDate);
      if (DateUtils.compareDates(nextInterestDate, now) <= 0) {
        // interest payment is due
        const interestAmount = bond.getNextPayableInterest();
        const withholdingTax = bond.getNextWithholdingTax();
        await this.assetManagementService.payInterest(interestAmount, 0, withholdingTax, nextInterestDate, bond, null, account, true, true);

        // update payment schedule
        bond.interestPaymentSchedule.splice(0, 1);
        bond.previousInterestPaymentDate = nextInterestDate.toISOString();
        await this.portfolioService.updateAsset(bond, account);
        needsRecheck = true;
      }
    }

    // check if an principal payment is due
    if (bond.principalPaymentSchedule && bond.principalPaymentSchedule.length > 0) {
      const nextPayment = bond.principalPaymentSchedule[0];
      const nextPaymentDate = new Date(nextPayment.date);
      if (DateUtils.compareDates(nextPaymentDate, now) <= 0) {
        // principal payment is due
        await this.payPrincipal(nextPayment.amount, bond, account, nextPaymentDate);
        needsRecheck = true;
      }
    }

    // only check if expired when there is no due payment left
    if (!needsRecheck) {
      const expirationDate = new Date(bond.maturityDate);
      if (DateUtils.compareDates(expirationDate, now) <= 0 && !bond.pendingDelete) {
        // bond expired
        await this.payPrincipal(bond.principalAmount, bond, account, expirationDate);
        needsRecheck = false;
      }
    }

    if (needsRecheck) {
      // a interest/principal payment was made. check again if we sill have due payments
      await this.checkBond(bond, account);
    }
  }

  /**
   * Pay (part of) principal from a bond. If all principal is paid, remove the bond asset from account.
   *
   * @param principalPayment the principal to pay
   * @param bond bond to pay principal from
   * @param account bond's account
   * @param txDate the payment date
   */
  private async payPrincipal(principalPayment: number, bond: BondAsset, account: PortfolioAccount, txDate: Date) {
    const cashAsset = this.getCashAsset(bond, account);
    await this.assetManagementService.payBondPrincipal(principalPayment, bond, cashAsset, true, account, txDate, true, 0);
  }

  /**
   * Mark a recurring transaction as invalid so it won't be processed again in the future,
   * until user manually fixes it.
   * @param recTx recurring transaction to mark
   */
  private markRecurringTxAsInvalid(recTx: RecurringTransaction) {
    recTx.inactive = true;
    this.portfolioService.updateRecurringTransaction(recTx);
    this.portfolioService.addRecurringTransactionNotification('Failed recurring transaction', recTx);
  }

  /**
   * Execute a recurring transaction
   * @param recTx recurring transaction
   * @param txDate the date when transaction occurred
   */
  private async executeTransaction(recTx: RecurringTransaction, txDate: Date) {
    if (recTx.autoApprove) {
      try {
        const approved = await this.assetManagementService.executeTransaction(recTx.tx, true, true);
        return approved;
      } catch (err) {
        this.markRecurringTxAsInvalid(recTx);
        this.logger.error(`Failed transaction: ${err}`, err);
      }
    } else {
      this.portfolioService.addPendingTransactionNotification('Pending recurring transaction', recTx.tx);
      return true;
    }
    return false;
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
   * Check if a recurring transaction should have occurred
   * @param recTx recurring transaction
   */
  private async checkRecurringTransaction(recTx: RecurringTransaction) {
    const todayDate = new Date();
    const txDate = new Date(recTx.tx.date);
    if (DateUtils.compareDates(txDate, todayDate) <= 0) {
      const executed = await this.executeTransaction(recTx, txDate);
      if (executed) {
        if (recTx.type === RecurringTransactionType.AfterGivenDays ||
          recTx.type === RecurringTransactionType.Never ||
          recTx.transactionsLeft === 1) {

          // no need to wait for completion
          this.portfolioService.removeRecurringTransaction(recTx);
        } else {
          const nextDate = recTx.getNextTransactionDate();
          recTx.tx.date = nextDate.toISOString();
          if (recTx.transactionsLeft > 0) {
            recTx.transactionsLeft--;
          }
          await this.portfolioService.updateRecurringTransaction(recTx);
          // the next date could still be in the past, so check again
          await this.checkRecurringTransaction(recTx);
        }
      }
    }
  }

  /**
   * Check if there are recurring transactions that should have occurred until now
   */
  private async checkRecurringTransactions() {
    const recTxs = await this.portfolioService.getRecurringTransactions();
    for (const recTx of recTxs) {
      if (!recTx.inactive) {
        await this.checkRecurringTransaction(recTx);
      }

    }
  }

  /**
   * Check all assets for actions that should occur periodically (interest payments,
   * deposit liquidations, bonds reached maturity)
   */
  private async checkAssets() {
    const accounts = await this.portfolioService.getAccounts();
    for (const account of accounts) {
      for (const asset of account.assets) {
        if (asset.type === AssetType.Deposit) {
          await this.checkDeposit(<DepositAsset>asset, account);
        } else if (asset.type === AssetType.Bond || asset.type === AssetType.P2P) {
          await this.checkBond(<BondAsset>asset, account);
        }
      }
    }
  }

  /**
   * Run all actions that should occur periodically
   */
  private async runPeriodicChecks() {
    // if we have cloud sync enabled, we only run periodic actions if we are online, to avoid duplication
    // of transactions if the local storage was not synced with cloud storage before going offline
    if (!this.storageService.isCloudSyncEnabled() || !this.storageService.isOffline()) {
      this.offlineCheckQueued = false;
      await this.checkAssets();
      await this.checkRecurringTransactions();
    } else {
      this.offlineCheckQueued = true;
      this.logger.warn(`Scheduled transactions will be postponed until you're online!`);
    }
  }
}
