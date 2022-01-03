import { Injectable } from '@angular/core';

import { PortfolioAccount } from '../models/portfolio-account';
import { Transaction, TransactionType } from '../models/transaction';
import { Asset, AssetType } from '../models/asset';
import { StorageChangeEvent, StorageChangeOrigin, StorageService } from 'src/app/core/services/storage.service';
import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { PortfolioConfig } from '../models/portfolio-config';
import { PortfolioStorage } from '../models/portfolio-storage';
import {
  PortfolioStorageService, ASSETS_PATH, ACCOUNTS_PATH, TRANSACTIONS_PATH,
  NOTIFICATIONS_PATH, CONFIG_PATH, RECURRING_TRANSACTIONS_PATH, PORTFOLIO_HISTORY_PATH
} from './portfolio-storage.service';
import { AssetQuote, StoredAssetQuote } from '../models/asset-quote';
import { APP_CONSTS } from 'src/app/config/app.constants';
import { AssetsQuoteService } from './assets-quote.service';
import { Dictionary, NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { LoggerService } from 'src/app/core/services/logger.service';
import { AppNotification, AppNotificationType } from '../models/notification';
import { RecurringTransaction } from '../models/recurring-transaction';
import { TradeableAsset } from '../models/tradeable-asset';
import { BondAsset } from '../models/bond-asset';
import { TwoWayTransaction } from '../models/two-way-transaction';
import { FloatingMath } from 'src/app/shared/util';
import { PortfolioHistory } from '../models/portfolio-history';
import { UserAppError } from 'src/app/shared/models/user-app-error';
import { TransferTransaction, TransferTransactionData } from '../models/transfer-transaction';
import { TransactionFactory } from '../models/transaction-factory';
import { constants } from 'buffer';


const PORTFOLIO_VERSION = 2;

enum ChangeAction {
  ADDED,
  REMOVED,
  MODIFIED
}


interface GroupedSymbolsMap {
  [assetType: number]: Dictionary<boolean>;
}

interface GroupedQuotesMap {
  [assetType: number]: Dictionary<AssetQuote>;
}

/**
 * Portfolio service
 * Provide storage-independent access to manage portfolio configuration, add/edit/remove accounts,
 * assets, transactions, recurring transactions, notifications, asset quotes and forex rates.
 */
@Injectable()
export class PortfolioService {

  readonly storage: PortfolioStorage;

  private accountsCache: PortfolioAccount[];
  private accountsMapCache: NumKeyDictionary<PortfolioAccount>;
  private notificationsCache: AppNotification[];
  private txCache: Transaction[];
  private txMapCache: NumKeyDictionary<Transaction>;
  private recTxCache: RecurringTransaction[];
  private recTxMapCache: NumKeyDictionary<RecurringTransaction>;
  private portfolioHistoryCache: PortfolioHistory;

  constructor(private eventsService: EventsService,
    private portfolioStorageService: PortfolioStorageService,
    private assetQuoteService: AssetsQuoteService,
    private logger: LoggerService,
    private storageService: StorageService) {
    this.storage = this.portfolioStorageService.storage;
    this.eventsService.events$.subscribe(event => this.handleEvents(event));

    this.initStorage();
  }

  /**
   * Adds a new account to storage
   * @param account account to save
   * @return Promise that resolves with the updated account object, once the operation is complete
   */
  async addAccount(account: PortfolioAccount): Promise<PortfolioAccount> {
    const acc = await this.storage.addAccount(account);
    if (this.accountsCache) {
      this.accountsCache.push(acc);
      this.accountsMapCache[acc.id] = acc;
    }
    this.eventsService.accountAdded(acc.id);
    return acc;
  }

  /**
   * Saves the updated account to storage
   * @param account account to save
   * @return Promise that resolves with the updated account object, once the operation is complete
   */
  async updateAccount(account: PortfolioAccount) {
    const acc = await this.storage.updateAccount(account);
    this.invalidateAccountsCache();
    this.eventsService.accountUpdated(acc.id);
    return acc;
  }

  /**
   * Remove a specific account from storage
   * @param account account to remove
   * @return A promise that resolves when the action is complete
   */
  async removeAccount(account: PortfolioAccount): Promise<void> {
    await this.storage.removeAccount(account);
    this.invalidateAccountsCache();
    this.eventsService.accountRemoved(account.id);

  }

  /**
   * Get a specific account.
   * @param id id of account to retrieve
   * @return Promise that resolves with the account object or `null` if account doesn't exist
   */
  async getAccount(id: number): Promise<PortfolioAccount> {
    if (id) {
      if (this.accountsMapCache) {
        return this.accountsMapCache[id];
      } else {
        const acc = await this.storage.getAccount(id);
        return acc;
      }
    }
    return null;
  }

  /**
   * Build an in-memory cache of the accounts
   * @param newAccounts accounts to cache
   */
  private buildAccountsCache(newAccounts: PortfolioAccount[]) {
    this.accountsCache = newAccounts;
    this.accountsMapCache = {};
    for (const account of newAccounts) {
      this.accountsMapCache[account.id] = account;
    }
  }

  /**
   * Get all accounts from storage
   * @return Promise that resolves with an array of all accounts.
   */
  async getAccounts(): Promise<PortfolioAccount[]> {
    if (this.accountsCache) {
      return this.accountsCache;
    } else {
      const accounts = await this.storage.getAllAccounts();
      this.buildAccountsCache(accounts);
      return accounts;
    }
  }

  /**
   * Adds a new asset to storage. Also adds it to the account's list of assets.
   * @param asset asset to add
   * @param account the account to which the asset belongs
   * @return Promise that resolves with the updated asset object, once the operation is complete
   */
  async addAsset(asset: Asset, account: PortfolioAccount): Promise<Asset> {
    asset.updateStats();
    asset = await this.storage.addAsset(asset);
    account.assets.push(asset);
    await this.storage.updateAccount(account);
    this.invalidateAccountsCache();
    this.eventsService.assetAdded(asset.id);
    this.eventsService.accountUpdated(account.id);
    return asset;
  }

  /**
   * Updates the account's cached version of the asset and saves the updated asset to storage.
   * If an asset does not exist for the given account and error is thrown.
   * @param asset asset to update
   * @param account the account to which the asset belongs
   * @return Promise that resolves with the asset object, once the operation is complete
   */
  async updateAsset(asset: Asset, account: PortfolioAccount): Promise<Asset> {
    const accAsset = account.getAssetById(asset.id);
    if (accAsset) {
      asset.updateStats();
      await this.storage.updateAsset(asset);
      if (accAsset !== asset) {
        Object.assign(accAsset, asset);
      }
      this.invalidateAccountsCache();
      this.eventsService.assetUpdated(asset.id);
      return asset;
    } else {
      throw new Error('Account Asset not found: ' + asset.id);
    }
  }

  /**
   * Remove a specific asset from storage. Also removes it from the account's list of assets.
   * If an asset does not exist for the given account and error is thrown.
   * @param asset asset to remove
   * @param account the account to which the asset belongs
   * @return A promise that resolves when the action is complete
   */
  async removeAsset(asset: Asset, account: PortfolioAccount): Promise<void> {
    const idx = account.assets.findIndex(item => item.id === asset.id);
    if (idx >= 0) {
      account.assets.splice(idx, 1);
      await this.storage.removeAsset(asset);
      await this.storage.updateAccount(account);
      this.invalidateAccountsCache();
      this.eventsService.assetRemoved(asset.id);
      this.eventsService.accountUpdated(account.id);
    } else {
      throw new Error('Asset not found');
    }
  }

  /**
   * Add a new transaction to storage
   * @param tx transaction to save
   * @return Promise that resolves with the transaction object, once the operation is complete
   */
  async addTransaction(tx: Transaction): Promise<Transaction> {
    const newTx = await this.storage.addTransaction(tx);
    if (this.txCache) {
      this.txCache.push(tx);
      this.txMapCache[tx.id] = tx;
    }
    this.eventsService.transactionAdded(newTx.id);
    return newTx;
  }

  /**
   * Saves the updated transaction to storage
   * @param tx transaction to save
   * @return Promise that resolves with the transaction object, once the operation is complete
   */
  async updateTransaction(tx: Transaction): Promise<Transaction> {
    tx = await this.storage.updateTransaction(tx);
    this.invalidateTxCache();
    this.eventsService.transactionUpdated(tx.id);
    return tx;
  }

  /**
   * Get a specific transaction.
   * @param txId id of transaction to retrieve
   * @return Promise that resolves with the transaction object or `null` if transaction doesn't exist
   */
  async getTransaction(txId: number): Promise<Transaction> {
    if (this.txMapCache) {
      return this.txMapCache[txId];
    } else {
      const tx = await this.storage.getTransaction(txId);
      return tx;
    }
  }

  /**
   * Remove a specific transaction from storage
   * @param tx transaction to remove
   * @return A promise that resolves when the action is complete
   */
  async removeTransaction(tx: Transaction): Promise<void> {
    await this.storage.removeTransaction(tx);
    this.invalidateTxCache();
    this.eventsService.transactionRemoved(tx.id);
  }

  /**
   * Get all transactions from storage
   * @return Promise that resolves with an array of all transactions.
   */
  async getTransactions(): Promise<Transaction[]> {
    if (this.txCache) {
      return this.txCache;
    } else {
      const transactions = await this.storage.getAllTransactions();
      this.buildTxsCache(transactions);
      return transactions;
    }
  }

  /**
   * Build an in-memory cache of the transactions
   * @param transactions transactions to cache
   */
  private buildTxsCache(transactions: Transaction[]) {
    this.txCache = transactions;
    this.txMapCache = {};
    for (const tx of transactions) {
      this.txMapCache[tx.id] = tx;
    }
  }

  /**
   * Get all transactions specific to an account
   * @param accountId id of account to get transactions for
   * @return Promise that resolves with an array of transactions.
   */
  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    const list: Transaction[] = [];
    const transactions = await this.getTransactions();
    for (const transaction of transactions) {
      if ((transaction.asset.accountId === accountId) ||
        (transaction.isTwoWayTransaction() && (<TwoWayTransaction>transaction).otherAsset.accountId === accountId)) {
        list.push(transaction);
      }
    }
    return list;
  }

  /**
   * Add a new recurring transaction to storage
   * @param tx transaction to save
   * @return Promise that resolves with the transaction object, once the operation is complete
   */
  async addRecurringTransaction(tx: RecurringTransaction): Promise<RecurringTransaction> {
    const newTx = await this.storage.addRecurringTransaction(tx);
    if (this.recTxCache) {
      this.recTxCache.push(newTx);
      this.recTxMapCache[newTx.id] = newTx;
    }
    this.eventsService.recurringTransactionAdded(newTx.id);
    return newTx;
  }

  /**
   * Saves the updated transaction to storage
   * @param tx transaction to save
   * @return Promise that resolves with the transaction object, once the operation is complete
   */
  async updateRecurringTransaction(tx: RecurringTransaction): Promise<RecurringTransaction> {
    tx = await this.storage.updateRecurringTransaction(tx);
    this.invalidateRecTxCache();
    this.eventsService.recurringTransactionUpdated(tx.id);
    return tx;
  }

  /**
   * Get a specific recurring transaction.
   * @param txId id of transaction to retrieve
   * @return Promise that resolves with the recurring transaction object or `null` if transaction doesn't exist
   */
  async getRecurringTransaction(txId: number): Promise<RecurringTransaction> {
    if (txId) {
      if (this.recTxMapCache) {
        return this.recTxMapCache[txId];
      } else {
        const tx = await this.storage.getRecurringTransaction(txId);
        return tx;
      }
    }
    return null;
  }

  /**
   * Remove a specific recurring transaction from storage
   * @param tx transaction to remove
   * @return A promise that resolves when the action is complete
   */
  async removeRecurringTransaction(tx: RecurringTransaction): Promise<void> {
    await this.storage.removeRecurringTransaction(tx);
    this.invalidateRecTxCache();
    this.eventsService.recurringTransactionRemoved(tx.id);
  }

  /**
   * Build an in-memory cache of the recurring transactions
   * @param transactions recurring transactions to cache
   */
  private buildRecTxsCache(transactions: RecurringTransaction[]) {
    this.recTxCache = transactions;
    this.recTxMapCache = {};
    for (const tx of transactions) {
      this.recTxMapCache[tx.id] = tx;
    }
  }

  /**
   * Get all recurring transactions from storage
   * @return Promise that resolves with an array of all recurring transactions.
   */
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    if (this.recTxCache) {
      return this.recTxCache;
    } else {
      const transactions = await this.storage.getAllRecurringTransactions();
      this.buildRecTxsCache(transactions);
      return transactions;
    }
  }

  /**
   * Add a text notification describing an event.
   * @param title title of the notification
   * @param description detailed description for the notification
   * @param date date when notification was triggered (provide only if it needs to be in the past)
   * @return Promise that resolves with the new notification object.
   */
  addTextNotification(title: string, description: string, date?: Date) {
    if (!date) {
      date = new Date();
    }
    const notification: AppNotification = {
      title: title,
      data: description,
      unread: true,
      date: date.toISOString(),
      type: AppNotificationType.INFORMATIVE,
    };
    return this.addNotification(notification);
  }

  /**
   * Add a notification about a completed transaction to storage
   * @param title title of the notification
   * @param transactionId id of transaction
   * @param date date when notification was triggered (provide only if it needs to be in the past)
   * @return Promise that resolves with the new notification object.
   */
  addTransactionDoneNotification(title: string, transactionId: number, date?: Date) {
    if (!date) {
      date = new Date();
    }
    const notification: AppNotification = {
      title: title,
      data: transactionId,
      unread: true,
      date: date.toISOString(),
      type: AppNotificationType.TRANSACTION_DONE,
    };
    return this.addNotification(notification);
  }

  /**
   * Add a notification about a pending transaction to storage
   * @param title title of the notification
   * @param tx affected pending transaction
   * @param date date when notification was triggered (provide only if it needs to be in the past)
   * @return Promise that resolves with the new notification object.
   */
  addPendingTransactionNotification(title: string, tx: Transaction, date?: Date) {
    if (!date) {
      date = new Date();
    }
    const txClone = TransactionFactory.newInstance(tx.type, tx);
    const notification: AppNotification = {
      title: title,
      data: txClone,
      unread: true,
      date: date.toISOString(),
      type: AppNotificationType.PENDING_TRANSACTION,
    };
    return this.addNotification(notification);
  }


  /**
   * Add a notification about a recurring transaction to storage
   * @param title title of the notification
   * @param recTx affected recurring transaction
   * @param date date when notification was triggered (provide only if it needs to be in the past)
   * @return Promise that resolves with the new notification object.
   */
  addRecurringTransactionNotification(title: string, recTx: RecurringTransaction, date?: Date) {
    if (!date) {
      date = new Date();
    }
    const notification: AppNotification = {
      title: title,
      data: recTx.id,
      unread: true,
      date: date.toISOString(),
      type: AppNotificationType.RECURRING_TRANSACTION,
    };
    return this.addNotification(notification);
  }

  /**
   * Add a custom notification to storage
   * @param title title of the notification
   * @param data notification specific data
   * @param date date when notification was triggered (provide only if it needs to be in the past)
   * @return Promise that resolves with the new notification object.
   */
  addCustomNotification(title: string, data: any, date?: Date) {
    if (!date) {
      date = new Date();
    }
    const notification: AppNotification = {
      title: title,
      data: data,
      unread: true,
      date: date.toISOString(),
      type: AppNotificationType.CUSTOM,
    };
    return this.addNotification(notification);
  }

  /**
   * Add a new notification to storage
   * @param notification notification to add
   * @return Promise that resolves with the updated notification object that now has a unique id.
   */
  async addNotification(notification: AppNotification) {
    notification = await this.storage.addNotification(notification);
    if (this.notificationsCache) {
      this.notificationsCache.push(notification);
    }
    this.eventsService.notificationAdded(notification.id);
    return notification;
  }

  /**
   * Mark a specific notification as read and update storage.
   * @param notification notification to mark as read
   * @returns promise with the updated notification object
   */
  async markNotificationAsRead(notification: AppNotification) {
    if (notification.unread) {
      notification.unread = false;
      await this.storage.updateNotification(notification);
      this.eventsService.notificationUpdated(notification.id);
    }
    return notification;
  }

  /**
   * Get a specific notification
   * @param id id of the notification to get
   * @return Promise that resolves with the notification object or `null` if it doesn't exist
   */
  async getNotification(id: number): Promise<AppNotification> {
    const notification = await this.storage.getNotification(id);
    return notification;
  }

  /**
   * Get all notifications from storage
   * @returns Promise that resolves with an array containing all stored notifications
   */
  async getNotifications(): Promise<AppNotification[]> {
    if (this.notificationsCache) {
      return this.notificationsCache;
    } else {
      const notifications = await this.storage.getNotifications();
      this.notificationsCache = notifications;
      return notifications;
    }
  }

  /**
   * Delete a specific notification from storage
   * @param notification notification to delete
   * @returns promise that resolves when the operation is completed
   */
  async deleteNotification(notification: AppNotification) {
    await this.storage.removeNotification(notification);
    this.invalidateNotificationsCache();
    this.eventsService.notificationRemoved(notification.id);
  }

  /**
   * Delete all notifications from storage
   * @returns promise that resolves when the operation is completed
   */
  async clearNotifications() {
    await this.storage.clearNotifications();
    this.invalidateNotificationsCache();
    this.eventsService.notificationRemoved(null);
  }

  /**
   * Checks which assets need their quotes updated (last update was more than `APP_CONSTS.QUOTE_CACHE_TIMEOUT`
   * seconds ago) and requests their quotes from the asset quote service. The updated quotes are saved in storage.
   *
   * @param silentUpdate if `true`, does not throw an error if all assets were already updated less than `APP_CONSTS.QUOTE_CACHE_TIMEOUT`
   * seconds ago
   * @param forceUpdate if `true`, ignores cache and request latest quote update
   *
   * @returns `true` if all assets quotes were updated, and `false` if there is at least one asset that didn't have it's
   * quote updated.
   */
  async updateAssetQuotes(silentUpdate?: boolean, forceUpdate?: boolean): Promise<boolean> {
    this.eventsService.quotesUpdateStarted();
    try {
      let allAssetsUpdated = true;
      const accounts = await this.getAccounts();
      const symbols: GroupedSymbolsMap = {};
      const quotesMap: GroupedQuotesMap = {};
      const assetTypes: AssetType[] = [
        AssetType.Stock,
        AssetType.Bond,
        AssetType.RealEstate, // we include real estate for manual quote update
        AssetType.MutualFund,
        AssetType.Cryptocurrency,
        AssetType.Commodity
      ];
      let assetTypesMask = 0;
      for (const assetType of assetTypes) {
        symbols[assetType] = {};
        quotesMap[assetType] = {};
        assetTypesMask |= assetType;
      }

      let newAssetsFound = false;
      let lowestUpdateTime: number = null;
      const nowTimestamp = new Date().getTime();
      for (const account of accounts) {
        for (const asset of account.assets) {
          if (asset.isOfRelatedType(assetTypesMask)) {
            const tradeableAsset = <TradeableAsset>asset;
            let cacheExpired = true;
            if (!forceUpdate && tradeableAsset.lastQuoteUpdate) {
              const timePassed = (nowTimestamp - new Date(tradeableAsset.lastQuoteUpdate).getTime()) / 1000;
              cacheExpired = timePassed >= APP_CONSTS.QUOTE_CACHE_TIMEOUT;
              if (!lowestUpdateTime || timePassed < lowestUpdateTime) {
                lowestUpdateTime = timePassed;
              }
            }
            if (cacheExpired) {
              allAssetsUpdated = false;
              if (tradeableAsset.symbol) {
                let assetType: AssetType;
                if (tradeableAsset.isMutualFund()) {
                  assetType = AssetType.MutualFund;
                } else if (tradeableAsset.isStockLike()) {
                  assetType = AssetType.Stock;
                } else {
                  assetType = asset.type;
                }
                symbols[assetType][tradeableAsset.symbol] = true;
                newAssetsFound = true;
              }
            }
          }
        }
      }

      if (newAssetsFound) {
        const promises: Promise<AssetQuote[]>[] = [];
        for (const assetType of assetTypes) {
          const assetSymbols: string[] = Object.keys(symbols[assetType]);
          if (assetSymbols.length > 0) {
            const promise = this.assetQuoteService.getAssetQuotes(assetSymbols, assetType)
              .then(assetQuotes => {
                for (const quote of assetQuotes) {
                  quotesMap[assetType][quote.symbol] = quote;
                }
                return assetQuotes;
              });
            promises.push(promise);
          }
        }
        if (promises.length > 0) {
          await Promise.all(promises);

          // update all assets with current prices
          const timestamp = new Date().toISOString();
          for (const account of accounts) {
            for (const asset of account.assets) {
              if (asset.isOfRelatedType(assetTypesMask)) {
                const tradeableAsset = <TradeableAsset>asset;
                let assetType: AssetType;
                if (tradeableAsset.isMutualFund()) {
                  assetType = AssetType.MutualFund;
                } else if (tradeableAsset.isStockLike()) {
                  assetType = AssetType.Stock;
                } else {
                  assetType = asset.type;
                }
                const quote: AssetQuote = quotesMap[assetType][tradeableAsset.symbol];
                if (quote && quote.price) {
                  if (quote.percentPrice) {
                    // bonds have prices set in percentage of principal value
                    const bond: BondAsset = <BondAsset>asset;
                    if (bond.principalAmount) {
                      tradeableAsset.currentPrice = FloatingMath.fixRoundingError(quote.price / 100 * bond.principalAmount);
                    } else {
                      tradeableAsset.currentPrice = quote.price;
                    }
                  } else {
                    tradeableAsset.currentPrice = quote.price;
                  }
                  tradeableAsset.lastQuoteUpdate = timestamp;
                  this.updateAsset(asset, account);
                }
              }
            }
          }
        }
      } else if (allAssetsUpdated) {
        if (lowestUpdateTime && !silentUpdate) {
          const lastUpdate = (lowestUpdateTime / 60 / 60).toFixed(1);
          const checkPeriod = Math.round(APP_CONSTS.QUOTE_CACHE_TIMEOUT / 60 / 60);
          throw new UserAppError(`Slow down! You last updated the prices ${lastUpdate} hours ago.
                        Try checking prices at least ${checkPeriod} hours apart. `);
        }
      }
      // check if there were any tradeable assets that didn't have their quote updated
      allAssetsUpdated = true;
      for (const account of accounts) {
        if (!allAssetsUpdated) {
          break;
        }
        for (const asset of account.assets) {
          if (asset.isOfRelatedType(assetTypesMask)) {
            const tradeableAsset = <TradeableAsset>asset;
            if (tradeableAsset.lastQuoteUpdate) {
              const timePassed = (new Date().getTime() - new Date(tradeableAsset.lastQuoteUpdate).getTime()) / 1000;
              if (timePassed >= APP_CONSTS.QUOTE_CACHE_TIMEOUT) {
                allAssetsUpdated = false;
                break;
              }
            } else {
              allAssetsUpdated = false;
            }
          }
        }
      }
      return allAssetsUpdated;
    } finally {
      this.eventsService.quotesUpdateFinished();
    }
  }


  /**
   * Get locally cached forex rates, if available
   */
  private async getCatchedForexRates(includeExpired?: boolean): Promise<StoredAssetQuote[]> {
    const validQuotes: StoredAssetQuote[] = [];
    const storedRates = await this.storage.getStoredForexRates();
    if (storedRates && storedRates.quotes) {
      for (const quote of storedRates.quotes) {
        const timePassed = (new Date().getTime() - new Date(quote.timestamp).getTime()) / 1000;
        if (includeExpired || timePassed < APP_CONSTS.QUOTE_CACHE_TIMEOUT) {
          validQuotes.push(quote);
        }
      }
    }

    return validQuotes;
  }


  /**
   * Get locally stored forex rates, if available and not expired, otherwise use quote service to retrieve them
   * @param pairs currency pair list
   * @returns Promise that resolves with the list of forex rates requested
   */
  async getForexRates(pairs: string[]): Promise<AssetQuote[]> {
    let storedQuotes = await this.getCatchedForexRates();
    const requiredPairs: string[] = [];
    const storedquotesMap: Dictionary<boolean> = {};
    storedQuotes.forEach(quote => storedquotesMap[quote.symbol] = true);
    for (const pair of pairs) {
      if (!storedquotesMap[pair]) {
        requiredPairs.push(pair);
      }
    }

    if (requiredPairs.length > 0) {
      try {
        const newQuotes = await this.assetQuoteService.getForexRates(requiredPairs);
        const now = new Date().toISOString();
        for (const quote of newQuotes) {
          storedQuotes.push({
            timestamp: now,
            ...quote
          });
        }
        // we don't need to wait for rates to be stored
        this.storage.storeForexRates({ quotes: storedQuotes });
      } catch (err) {
        this.logger.error('Could not retrieve latest forex rates!', err);
        // we probably failed due to network error, so fail silently and
        // return the cached rates (including expired ones)
        storedQuotes = await this.getCatchedForexRates(true);
      }
    }
    return storedQuotes;
  }

  async getPortfolioHistory(): Promise<PortfolioHistory> {
    if (!this.portfolioHistoryCache) {
      this.portfolioHistoryCache = await this.storage.getPortfolioHistory();
    }
    return this.portfolioHistoryCache;
  }

  savePortfolioHistory(history: PortfolioHistory): Promise<void> {
    this.portfolioHistoryCache = history;
    return this.storage.storePortfolioHistory(history);
  }


  /**
   * Check if portfolio is stored is in an old format and upgrade if necessary
   * @param cfg stored portfolio configuration
   */
  async upgradePortfolioVersion(cfg: PortfolioConfig): Promise<PortfolioConfig> {
    if (!cfg.version || cfg.version < 2) {
      // Version 2 modified how deposit fund transactions are viewed (transfer instead of debit)
      const transactions = await this.storage.getAllTransactions();
      const promises: Promise<Transaction>[] = [];
      for (const tx of transactions) {
        if (tx.type === TransactionType.DebitCash && tx.description.startsWith('Fund deposit:')) {
          const txData: TransferTransactionData = {
            id: tx.id,
            asset: {
              accountDescription: tx.asset.accountDescription,
              accountId: tx.asset.accountId,
              currency: tx.asset.currency,
            },
            otherAsset: {
              accountDescription: tx.asset.accountDescription,
              accountId: tx.asset.accountId,
              id: tx.asset.id,
              description: tx.asset.description,
              currency: tx.asset.currency,
            },
            date: tx.date,
            description: tx.description,
            type: TransactionType.CashTransfer,
            fee: tx.fee,
            value: tx.value,
          };
          const newTx = new TransferTransaction(txData);
          const promise = this.updateTransaction(newTx);
          promises.push(promise);
        } else if (tx.type ===  TransactionType.Transfer && tx.description.startsWith('Liquidated ')) {
          tx.type = TransactionType.CashTransfer;
          const promise = this.updateTransaction(tx);
          promises.push(promise);
        }
      }
      await Promise.all(promises);

      cfg.version = PORTFOLIO_VERSION;
      await this.saveConfig(cfg);
    }
    return cfg;
  }

  /**
   * Read the portfolio config. If no config is stored, create a default one.
   * @returns Promise that resolves with the portfolio configuration.
   */
  async readConfig(): Promise<PortfolioConfig> {
    let cfg = await this.storage.readConfig();
    if (!cfg) {
      cfg = {
        baseCurrency: 'EUR',
        lastQuotesUpdate: '',
        hideCapitalGainsWarning: false,
        withdrawalRate: 0.04,
        dashboardGridVisibility: null,
        loanToValueRatio: 0,
        portfolioAllocation: [
          { assetType: AssetType.Stock, allocation: 0.6 },
          { assetType: AssetType.Bond, allocation: 0.4 },
        ],
        goals: [
          { title: 'Financial Independence', value: 1000000 },
        ],
        hideBondAndDepositsRecurringTxs: false,
        version: PORTFOLIO_VERSION,
      };
    } else {

    }

    // upgrade old portfolio version if needed
    if (!cfg.version || cfg.version < PORTFOLIO_VERSION) {
      cfg = await this.upgradePortfolioVersion(cfg);
    }
    return cfg;
  }

  saveConfig(cfg: PortfolioConfig): Promise<void> {
    return this.storage.saveConfig(cfg);
  }

  private invalidateAccountsCache() {
    this.accountsCache = null;
    this.accountsMapCache = null;
  }

  private invalidateNotificationsCache() {
    this.notificationsCache = null;
  }

  private invalidateTxCache() {
    this.txCache = null;
    this.txMapCache = null;
  }

  private invalidateRecTxCache() {
    this.recTxCache = null;
    this.recTxMapCache = null;
  }

  private invalidatePortfolioHistoryCache() {
    this.portfolioHistoryCache = null;
  }

  private invalidateEntireCache() {
    this.invalidateAccountsCache();
    this.invalidateNotificationsCache();
    this.invalidatePortfolioHistoryCache();
    this.invalidateRecTxCache();
    this.invalidateTxCache();
  }

  /**
   * Listen for events and handle the ones specific to accounts, notifications, transactions and recurring
   * transactions. Used to clear the in-memory cache.
   * @param event event that was triggered
   */
  private handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.STORAGE_WIPED:
        this.invalidateEntireCache();
        break;
    }
  }

  /**
   * Initialize the storage module and add a listener for changes in storage.
   * Listen for remote changes on this module and emit events when they happen.
   */
  private initStorage() {
    const self = this;
    this.storage.setChangeListener(async (event: StorageChangeEvent) => {
      if (event.origin === StorageChangeOrigin.remote || event.origin === StorageChangeOrigin.conflict) {
        if (event.newValue === null && event.oldValue === null) {
          // data is encrypted with unknown password. we need to reload page
          self.eventsService.encryptionStateChangedRemotely();
        } else {
          let action: ChangeAction;
          if (event.oldValue && !event.newValue) {
            action = ChangeAction.REMOVED;
          } else if (!event.oldValue && event.newValue) {
            action = ChangeAction.ADDED;
          } else {
            action = ChangeAction.MODIFIED;
          }

          if (event.relativePath.startsWith(ASSETS_PATH)) {
            this.invalidateAccountsCache();
            const oldAsset: Asset = event.oldValue;
            const newAsset: Asset = event.newValue;
            // delay notifications until sync is complete
            await self.storageService.waitForSync();
            if (action === ChangeAction.ADDED) {
              self.eventsService.assetAdded(newAsset.id);
            } else if (action === ChangeAction.REMOVED) {
              self.eventsService.assetRemoved(oldAsset.id);
            } else {
              self.eventsService.assetUpdated(newAsset.id);
            }
          } else if (event.relativePath.startsWith(ACCOUNTS_PATH)) {
            self.invalidateAccountsCache();
            const oldAccount: PortfolioAccount = event.oldValue;
            const newAccount: PortfolioAccount = event.newValue;
            // delay notifications until sync is complete
            await self.storageService.waitForSync();
            if (action === ChangeAction.ADDED) {
              self.eventsService.accountAdded(newAccount.id);
            } else if (action === ChangeAction.REMOVED) {
              self.eventsService.accountRemoved(oldAccount.id);
            } else {
              self.eventsService.accountUpdated(newAccount.id);
            }
          } else if (event.relativePath.startsWith(TRANSACTIONS_PATH)) {
            self.invalidateTxCache();
            const oldTransaction: Transaction = event.oldValue;
            const newTransaction: Transaction = event.newValue;
            // delay notifications until sync is complete
            await self.storageService.waitForSync();
            if (action === ChangeAction.ADDED) {
              self.eventsService.transactionAdded(newTransaction.id);
            } else if (action === ChangeAction.REMOVED) {
              self.eventsService.transactionRemoved(oldTransaction.id);
            } else {
              self.eventsService.transactionUpdated(newTransaction.id);
            }
          } else if (event.relativePath.startsWith(RECURRING_TRANSACTIONS_PATH)) {
            self.invalidateRecTxCache();
            const oldTransaction: RecurringTransaction = event.oldValue;
            const newTransaction: RecurringTransaction = event.newValue;
            // delay notifications until sync is complete
            await self.storageService.waitForSync();
            if (action === ChangeAction.ADDED) {
              self.eventsService.recurringTransactionAdded(newTransaction.id);
            } else if (action === ChangeAction.REMOVED) {
              self.eventsService.recurringTransactionRemoved(oldTransaction.id);
            } else {
              self.eventsService.recurringTransactionUpdated(newTransaction.id);
            }
          } else if (event.relativePath.startsWith(NOTIFICATIONS_PATH)) {
            self.invalidateNotificationsCache();
            const oldNotif: AppNotification = event.oldValue;
            const newNotif: AppNotification = event.newValue;
            // delay notifications until sync is complete
            await self.storageService.waitForSync();
            if (action === ChangeAction.ADDED) {
              self.eventsService.notificationAdded(newNotif.id);
            } else if (action === ChangeAction.REMOVED) {
              self.eventsService.notificationRemoved(oldNotif.id);
            } else {
              self.eventsService.notificationUpdated(newNotif.id);
            }
          } else if (event.relativePath === CONFIG_PATH) {
            // delay notifications until sync is complete
            await self.storageService.waitForSync();
            self.eventsService.configUpdatedRemotely(self.storage.getId());
          } else if (event.relativePath === PORTFOLIO_HISTORY_PATH) {
            this.invalidatePortfolioHistoryCache();
          }
        }
      }
    });
  }
}
