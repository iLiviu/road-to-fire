import { Injectable } from '@angular/core';

import {
  PortfolioStorageService, FOREXRATES_ALIAS, ACCOUNT_ALIAS, ASSET_ALIAS, TRANSACTION_ALIAS, NOTIFICATION_ALIAS,
  ACCOUNTS_PATH, TRANSACTIONS_PATH, NOTIFICATIONS_PATH, ASSETS_PATH, FOREXRATES_PATH, RECURRING_TRANSACTIONS_PATH,
  RECURRING_TRANSACTION_ALIAS,
  PORTFOLIO_HISTORY_ALIAS,
  PORTFOLIO_HISTORY_PATH,
  TX_IMPORT_TEMPLATES_PATH,
  TX_IMPORT_TEMPLATE_ALIAS
} from './portfolio-storage.service';
import { PortfolioStorage } from '../models/portfolio-storage';
import { BaseRemoteStorageModule, RSModuleObjectType } from 'src/app/core/models/remotestorage-module';
import { PortfolioAccount, PortfolioAccountData } from '../models/portfolio-account';
import { Asset, AssetNotFoundError, AssetData } from '../models/asset';
import { Transaction, TransactionData } from '../models/transaction';
import { PortfolioConfig } from '../models/portfolio-config';
import { StorageSerializer } from 'src/app/core/models/storage-serializer';
import { StoredQuotes } from '../models/asset-quote';
import { Dictionary } from 'src/app/shared/models/dictionary';
import { AppNotification } from '../models/notification';
import { StorageChangeEvent, StorageChangeOrigin } from 'src/app/core/services/storage.service';
import { CONFIG_ALIAS, CONFIG_PATH } from 'src/app/core/services/app-storage.service';
import { RecurringTransaction, RecurringTransactionData } from '../models/recurring-transaction';
import { TransactionFactory } from '../models/transaction-factory';
import { AssetFactory } from '../models/asset-factory';
import { PortfolioHistory } from '../models/portfolio-history';
import { TransactionsImportTemplate } from '../models/transactions-import-template';


const RSMODULE_NAME = 'asset-portfolio';


@Injectable()
export class RSPortfolioStorageService extends PortfolioStorageService {

  protected createStorageModule() {
    return createPortfolioRStorageModule(this.storageService.serializer);

  }
}




/**
 * Remote Storage Asset Portfolio Storage Module
 *
 * Stores configuration, portfolio accounts, assets, transactions, recurring transactions, notifications
 * and forex rates
 */
function createPortfolioRStorageModule(serializer: StorageSerializer) {
  return {
    name: RSMODULE_NAME,
    builder: function (privateClient, publicClient) {

      privateClient.declareType(FOREXRATES_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'quotes': {
            'type': 'array',
            'items': {
              'type': 'object',
              'properties': {
                'timestamp': {
                  'type': 'string',
                  'format': 'date'
                },
                'symbol': {
                  'type': 'string'
                },
                'price': {
                  'type': 'number',
                }
              },
            },
          },
        },
      });

      privateClient.declareType(CONFIG_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'baseCurrency': {
            'type': 'string'
          },
          'withdrawalRate': {
            'type': 'number'
          },
          'portfolioAllocation': {
            'type': 'array',
            'items': {
              'type': 'object',
              'properties': {
                'assetType': {
                  'type': 'number'
                },
                'allocation': {
                  'type': 'number'
                }
              }
            }
          },
          'goals': {
            'type': 'array',
            'items': {
              'type': 'object',
              'properties': {
                'title': {
                  'type': 'string'
                },
                'value': {
                  'type': 'number'
                }
              }
            }
          },

        },
      });

      privateClient.declareType(ACCOUNT_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'id': {
            'type': 'number'
          },
          'description': {
            'type': 'string'
          },
          'assets': {
            'type': 'array',
            'default': [],
            'items': {
              'type': 'number'
            }
          },
        },
      });

      privateClient.declareType(ASSET_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'id': {
            'type': 'number'
          },
          'amount': {
            'type': 'number'
          },
          'currency': {
            'type': 'string'
          },
          'description': {
            'type': 'string'
          },
          'type': {
            'type': 'number'
          },

          'interestRate': {
            'type': 'number'
          },

          'buyPrice': {
            'type': 'number'
          },
          'currentPrice': {
            'type': 'number'
          },
          'symbol': {
            'type': 'string'
          },
          'buyDate': {
            'type': 'string',
            'format': 'date'
          },
          'region': {
            'type': 'number'
          },


          'autoRenew': {
            'type': 'boolean'
          },
          'capitalize': {
            'type': 'boolean'
          },
          'creationDate': {
            'type': 'string',
            'format': 'date'
          },
          'maturityDate': {
            'type': 'string',
            'format': 'date'
          },
          'withholdInterestTax': {
            'type': 'boolean'
          },
          'interestTaxRate': {
            'type': ['number', 'null']
          },
          'cashAssetId': {
            'type': 'number'
          },

          'couponRate': {
            'type': 'number'
          },
          'principalAmount': {
            'type': 'number'
          },
          'interestPaymentSchedule': {
            'type': 'array',
            'default': [],
            'items': {
              'type': 'object',
              'properties': {
                'paymentDate': {
                  'type': 'string',
                  'format': 'date'
                },
                'couponRate': {
                  'type': ['number', 'null']
                }
              }
            }
          },
          'principalPaymentSchedule': {
            'type': 'array',
            'default': [],
            'items': {
              'type': 'object',
              'properties': {
                'date': {
                  'type': 'string',
                  'format': 'date'
                },
                'amount': {
                  'type': 'number'
                }
              }
            }
          },

        },
      });

      const transactionSchema = {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'id': {
            'type': 'number'
          },
          'value': {
            'type': 'number',
          },

          'type': {
            'type': 'number',
          },
          'description': {
            'type': 'string',
          },
          'date': {
            'type': 'string',
            'format': 'date'
          },
          'fee': {
            'type': ['number', 'null'],
          },

          'asset': {
            'type': 'object',
            'properties': {
              'id': {
                'type': 'number',
              },
              'currency': {
                'type': 'string',
              },
              'description': {
                'type': 'string',
              },
              'accountId': {
                'type': 'number',
              },
              'accountDescription': {
                'type': 'string',
              },

            }
          },

          'otherAsset': {
            'type': 'object',
            'properties': {
              'id': {
                'type': 'number',
              },
              'currency': {
                'type': 'string',
              },
              'description': {
                'type': 'string',
              },
              'accountId': {
                'type': 'number',
              },
              'accountDescription': {
                'type': 'string',
              },

            }
          },

          'rate': {
            'type': 'number',
          },
          'amount': {
            'type': 'number',
          },
        },
      };

      privateClient.declareType(TRANSACTION_ALIAS, transactionSchema);

      privateClient.declareType(RECURRING_TRANSACTION_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'id': {
            'type': 'number'
          },
          'tx': transactionSchema,
          'type': {
            'type': 'number',
          },
          'period': {
            'type': 'number',
          },
          'transactionsLeft': {
            'type': 'number',
          },
          'autoApprove': {
            'type': 'boolean',
          }
        }
      });

      privateClient.declareType(NOTIFICATION_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'title': {
            'type': 'string'
          },
          'date': {
            'type': 'string',
            'format': 'date'
          },
          'unread': {
            'type': 'boolean'
          },
          'type': {
            'type': 'number'
          },
        }
      });

      privateClient.declareType(PORTFOLIO_HISTORY_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string'
          },
          'entries': {
            'type': 'array',
            'default': [],
            'items': {
              'type': 'object',
              'properties': {
                'date': {
                  'type': 'string',
                  'format': 'date'
                },
                'assets': {
                  'type': 'array',
                  'default': [],
                  'items': {
                    'type': 'object',
                    'properties': {
                      'type': {
                        'type': 'number'
                      },
                      'value': {
                        'type': 'number'
                      }
                    }
                  }
                },
              }
            },
          }
        }
      });

      privateClient.declareType(TX_IMPORT_TEMPLATE_ALIAS, {
        'type': 'object',
        'properties': {
          'customDateFormat': {
            'type': 'string'
          },
          'decimalSeparator': {
            'type': 'string'
          },
          'exchangeCode': {
            'type': 'string'
          },
          'fieldSeparator': {
            'type': 'string'
          },
          'name': {
            'type': 'string'
          },
          'includeFirstRow': {
            'type': 'boolean'
          },
          'useCustomDateFormat': {
            'type': 'boolean'
          },
          'buyString': {
            'type': 'string'
          },
          'sellString': {
            'type': 'string'
          },
          'cashCreditString': {
            'type': 'string'
          },
          'cashDebitString': {
            'type': 'string'
          },
          'columns': {
            'type': 'array',
            'default': [],

          },
        }
      });

      return {
        exports: new class extends BaseRemoteStorageModule implements PortfolioStorage {
          private _accountIds: Dictionary<any> = null;
          private _assets: Dictionary<Asset> = null;
          private _transactionIds: Dictionary<any> = null;
          private _recurringTransactionIds: Dictionary<any> = null;
          private _notificationIds: Dictionary<any> = null;

          private newAccountInstance(obj: Object): PortfolioAccount {
            const acc = new PortfolioAccount();
            Object.assign(acc, obj);
            return acc;
          }

          private newAssetInstance(source: AssetData): Asset {
            if (!source) {
              return null;
            }

            const result = AssetFactory.newInstance(source.type, source);
            return result;
          }

          private newTxInstance(source: TransactionData) {
            if (source) {
              return TransactionFactory.newInstance(source.type, source);
            } else {
              return null;
            }
          }

          private newRecTxInstance(source: RecurringTransactionData) {
            if (source) {
              source.tx = this.newTxInstance(source.tx);
              const recTx = new RecurringTransaction(source);
              return recTx;
            } else {
              return null;
            }
          }

          /**
           * Generates a unique number from 1 to 999999999 that is not present in
           * a dictionary already
           * @param dictionary dictionary with already present numbers
           */
          private generateUniqueId(dictionary: Dictionary<any>): number {
            let id: number;
            do {
              id = Math.floor(Math.random() * 999999999) + 1;
            } while (dictionary[id]);
            return id;
          }


          private async generateUniqueAssetId(): Promise<number> {
            const assets = await this.getAssets();
            return this.generateUniqueId(assets);
          }

          private async generateUniqueAccountId(): Promise<number> {
            const accountIds = await this.getAccountIds();
            return this.generateUniqueId(accountIds);
          }

          private async generateUniqueTransactionId(): Promise<number> {
            const transactionIds = await this.getTransactionIds();
            return this.generateUniqueId(transactionIds);
          }

          private async generateUniqueRecurringTransactionId(): Promise<number> {
            const transactionIds = await this.getRecurringTransactionIds();
            return this.generateUniqueId(transactionIds);
          }


          private async generateUniqueNotificationId(): Promise<number> {
            const notifications = await this.getNotificationIds();
            return this.generateUniqueId(notifications);
          }

          private async getAccountIds(): Promise<Dictionary<any>> {
            if (!this._accountIds) {
              this._accountIds = await this.privateClient.getListing(ACCOUNTS_PATH);
            }
            return this._accountIds;
          }

          private async getAssets(): Promise<Dictionary<Asset>> {
            if (!this._assets) {
              await this.getAllAssets();
            }
            return this._assets;
          }


          private async getTransactionIds(): Promise<Dictionary<Transaction>> {
            if (!this._transactionIds) {
              this._transactionIds = await this.privateClient.getListing(TRANSACTIONS_PATH);
            }
            return this._transactionIds;
          }

          private async getRecurringTransactionIds(): Promise<Dictionary<RecurringTransaction>> {
            if (!this._recurringTransactionIds) {
              this._recurringTransactionIds = await this.privateClient.getListing(RECURRING_TRANSACTIONS_PATH);
            }
            return this._recurringTransactionIds;
          }


          private async getNotificationIds(): Promise<Dictionary<any>> {
            if (!this._notificationIds) {
              this._notificationIds = await this.privateClient.getListing(NOTIFICATIONS_PATH);
            }
            return this._notificationIds;
          }

          protected dataChanged(event: StorageChangeEvent): void {
            if (event.origin === StorageChangeOrigin.remote) {
              // clear cache if data changed remotely
              if (event.relativePath.startsWith(ASSETS_PATH)) {
                this._assets = null;
              } else if (event.relativePath.startsWith(TRANSACTIONS_PATH)) {
                this._transactionIds = null;
              } else if (event.relativePath.startsWith(ACCOUNTS_PATH)) {
                this._accountIds = null;
              } else if (event.relativePath.startsWith(NOTIFICATIONS_PATH)) {
                this._notificationIds = null;
              } else if (event.relativePath.startsWith(RECURRING_TRANSACTIONS_PATH)) {
                this._recurringTransactionIds = null;
              }
            }
          }


          getId() {
            return RSMODULE_NAME;
          }

          async addAccount(account: PortfolioAccount): Promise<PortfolioAccount> {
            account.id = await this.generateUniqueAccountId();
            await this.updateAccount(account);
            return account;
          }



          async getAccount(id: number): Promise<PortfolioAccount> {
            const path = ACCOUNTS_PATH + id; // use id as filename
            const accData = await this.getObject(path);
            if (accData) {
              const acc = this.newAccountInstance(accData);
              const assets = await this.getAssets();
              this.setAccountAssets(acc, assets);
              return acc;
            } else {
              return null;
            }
          }

          private setAccountAssets(account: PortfolioAccount, assets: Dictionary<Asset>) {
            const accAssets = [];

            for (const item of account.assets) {
              const assetId: number = +<any>item;

              const asset = assets[assetId];
              if (asset) {
                accAssets.push(asset);
              } else {
                throw new AssetNotFoundError(assetId);
              }
            }
            account.assets = accAssets;
          }

          async getAllAccounts(): Promise<PortfolioAccount[]> {
            const assets = await this.getAssets();
            const accts = await this.getAll(ACCOUNTS_PATH);
            const newAccounts = [];
            this._accountIds = {};
            if (accts) {
              for (const path of Object.keys(accts)) {
                const accData = <PortfolioAccountData>accts[path];
                if (accData && accData.id) {
                  const acc = this.newAccountInstance(accData);
                  if (acc.id) {
                    this.setAccountAssets(acc, assets);
                    this._accountIds[acc.id] = acc;
                    newAccounts.push(acc);
                  }
                }
              }
            }
            return newAccounts;
          }

          async updateAccount(account: PortfolioAccount): Promise<PortfolioAccount> {
            const path = ACCOUNTS_PATH + account.id; // use id as filename
            const accCopy = { ...account };
            const assetIds = [];
            for (const asset of account.assets) {
              assetIds.push(asset.id);
            }
            accCopy.assets = assetIds;
            await this.storeObject(ACCOUNT_ALIAS, path, accCopy);
            if (this._accountIds) {
              this._accountIds[account.id] = account;
            }
            return account; // return account
          }

          async removeAccount(account: PortfolioAccount): Promise<void> {
            const promises = [];
            for (const asset of account.assets) {
              const promise = this.removeAsset(asset);
              promises.push(promise);
            }
            // wait for all assets to be removed before deleting account
            await Promise.all(promises);

            await privateClient.remove(ACCOUNTS_PATH + account.id);
            if (this._accountIds) {
              delete this._accountIds[account.id];
            }
          }


          async addAsset(asset: Asset): Promise<Asset> {
            asset.id = await this.generateUniqueAssetId();
            await this.updateAsset(asset);
            return asset;
          }

          async getAsset(id: number): Promise<Asset> {
            const path = ASSETS_PATH + id; // use id as filename
            const assetData = await this.getObject(path);
            if (assetData) {
              const asset = this.newAssetInstance(assetData);
              return asset;
            } else {
              return null;
            }
          }

          async getAllAssets(): Promise<Asset[]> {
            const assets = await this.getAll(ASSETS_PATH);
            const newAssets = [];
            this._assets = {};
            if (assets) {
              for (const path of Object.keys(assets)) {
                const assetData = <AssetData>assets[path];
                if (assetData && assetData.id) {
                  const asset = this.newAssetInstance(assetData);
                  newAssets.push(asset);
                  this._assets[asset.id] = asset;
                }
              }
            }
            return newAssets;
          }

          async updateAsset(asset: Asset): Promise<Asset> {
            const path = ASSETS_PATH + asset.id; // use id as filename
            await this.storeObject(ASSET_ALIAS, path, asset);

            // update cache
            if (this._assets) {
              this._assets[asset.id] = asset;
            }
            return asset; // return asset

          }

          async removeAsset(asset: Asset) {
            await privateClient.remove(ASSETS_PATH + asset.id);
            if (this._assets) {
              delete this._assets[asset.id];
            }
          }

          async addTransaction(tx: Transaction): Promise<Transaction> {
            tx.id = await this.generateUniqueTransactionId();
            tx = await this.updateTransaction(tx);
            return tx;
          }

          async getTransaction(id: number): Promise<Transaction> {
            const path = TRANSACTIONS_PATH + id; // use id as filename
            const txData = await this.getObject(path);
            if (txData) {
              const tx = this.newTxInstance(txData);
              return tx;
            } else {
              return null;
            }
          }

          async getAllTransactions(): Promise<Transaction[]> {
            const txs = await this.getAll(TRANSACTIONS_PATH);
            const newTransactions = [];
            this._transactionIds = {};
            if (txs) {
              for (const path of Object.keys(txs)) {
                const txData = <TransactionData>txs[path];
                if (txData && txData.id) {
                  const tx = this.newTxInstance(txs[path]);
                  newTransactions.push(tx);
                  this._transactionIds[tx.id] = tx;
                }
              }
            }
            return newTransactions;
          }

          async updateTransaction(tx: Transaction): Promise<Transaction> {
            const path = TRANSACTIONS_PATH + tx.id; // use id as filename
            await this.storeObject(TRANSACTION_ALIAS, path, tx);
            if (this._transactionIds) {
              this._transactionIds[tx.id] = tx;
            }
            return tx; // return transaction
          }

          async removeTransaction(tx: Transaction): Promise<void> {
            const path = TRANSACTIONS_PATH + tx.id; // use id as filename
            await privateClient.remove(path);
            if (this._transactionIds) {
              delete this._transactionIds[tx.id];
            }
          }

          async addRecurringTransaction(tx: RecurringTransaction): Promise<RecurringTransaction> {
            tx.id = await this.generateUniqueRecurringTransactionId();
            tx = await this.updateRecurringTransaction(tx);
            return tx;
          }

          async getRecurringTransaction(id: number): Promise<RecurringTransaction> {
            const path = RECURRING_TRANSACTIONS_PATH + id; // use id as filename
            const txData = await this.getObject(path);
            if (txData) {
              const tx = this.newRecTxInstance(txData);
              return tx;
            } else {
              return null;
            }
          }

          async getAllRecurringTransactions(): Promise<RecurringTransaction[]> {
            const txs = await this.getAll(RECURRING_TRANSACTIONS_PATH);
            const newTransactions = [];
            this._recurringTransactionIds = {};
            if (txs) {
              for (const path of Object.keys(txs)) {
                const recTxData = <RecurringTransactionData>txs[path];
                if (recTxData && recTxData.id) {
                  const tx = this.newRecTxInstance(recTxData);
                  newTransactions.push(tx);
                  this._recurringTransactionIds[tx.id] = tx;
                }
              }
            }
            return newTransactions;
          }

          async updateRecurringTransaction(tx: RecurringTransaction): Promise<RecurringTransaction> {
            const path = RECURRING_TRANSACTIONS_PATH + tx.id; // use id as filename
            await this.storeObject(RECURRING_TRANSACTION_ALIAS, path, tx);
            if (this._recurringTransactionIds) {
              this._recurringTransactionIds[tx.id] = tx;
            }
            return tx; // return transaction
          }

          async removeRecurringTransaction(tx: RecurringTransaction): Promise<void> {
            const path = RECURRING_TRANSACTIONS_PATH + tx.id; // use id as filename
            await privateClient.remove(path);
            if (this._recurringTransactionIds) {
              delete this._recurringTransactionIds[tx.id];
            }
          }

          async addNotification(notification: AppNotification): Promise<AppNotification> {
            notification.id = await this.generateUniqueNotificationId();
            await this.updateNotification(notification);
            if (this._notificationIds) {
              this._notificationIds[notification.id] = notification;
            }
            return notification;
          }

          async updateNotification(notification: AppNotification): Promise<AppNotification> {
            const path = NOTIFICATIONS_PATH + notification.id; // use id as filename
            await this.storeObject(NOTIFICATION_ALIAS, path, notification);
            if (this._notificationIds) {
              this._notificationIds[notification.id] = notification;
            }
            return notification; // return transaction
          }

          async removeNotification(notification: AppNotification): Promise<void> {
            const path = NOTIFICATIONS_PATH + notification.id; // use id as filename
            await privateClient.remove(path);
            if (this._notificationIds) {
              delete this._notificationIds[notification.id];
            }
          }

          async getNotification(id: number): Promise<AppNotification> {
            const path = NOTIFICATIONS_PATH + id; // use id as filename
            const notification = await this.getObject(path);
            return notification;
          }

          async getNotifications(): Promise<AppNotification[]> {
            const notificationPaths = await this.getAll(NOTIFICATIONS_PATH);
            const newNotifications: AppNotification[] = [];
            this._notificationIds = {};
            if (notificationPaths) {
              for (const path of Object.keys(notificationPaths)) {
                const notification = <AppNotification>notificationPaths[path];
                if (notification && notification.id) {
                  newNotifications.push(notification);
                  this._notificationIds[notification.id] = notification;
                }
              }
            }
            return newNotifications;
          }

          async clearNotifications(): Promise<void> {
            const items = await this.privateClient.getListing(NOTIFICATIONS_PATH);
            const promises = [];
            if (items) {
              for (const path of Object.keys(items)) {
                promises.push(this.privateClient.remove(NOTIFICATIONS_PATH + path));
              }
            }
            await Promise.all(promises);
          }


          readConfig(): Promise<PortfolioConfig> {
            return this.getObject(CONFIG_PATH);
          }

          saveConfig(cfg: PortfolioConfig): Promise<void> {
            return this.storeObject(CONFIG_ALIAS, CONFIG_PATH, cfg);
          }

          getStoredForexRates(): Promise<StoredQuotes> {
            return this.getObject(FOREXRATES_PATH);
          }

          storeForexRates(quotes: StoredQuotes): Promise<void> {
            return this.storeObject(FOREXRATES_ALIAS, FOREXRATES_PATH, quotes);
          }

          getPortfolioHistory(): Promise<PortfolioHistory> {
            return this.getObject(PORTFOLIO_HISTORY_PATH);
          }

          storePortfolioHistory(history: PortfolioHistory): Promise<void> {
            return this.storeObject(PORTFOLIO_HISTORY_ALIAS, PORTFOLIO_HISTORY_PATH, history);
          }

          async getTransactionsImportTemplates(): Promise<TransactionsImportTemplate[]> {
            const paths = await this.getAll(TX_IMPORT_TEMPLATES_PATH);
            const templates: TransactionsImportTemplate[] = [];
            if (paths) {
              for (const path of Object.keys(paths)) {
                const tpl = <TransactionsImportTemplate>paths[path];
                if (tpl) {
                  templates.push(tpl);
                }
              }
            }
            return templates;
          }
          async addTransactionsImportTemplate(template: TransactionsImportTemplate): Promise<TransactionsImportTemplate> {
            await this.updateTransactionsImportTemplate(template);
            return template;
          }

          async updateTransactionsImportTemplate(template: TransactionsImportTemplate): Promise<TransactionsImportTemplate> {
            const path = TX_IMPORT_TEMPLATES_PATH + template.name;
            await this.storeObject(TX_IMPORT_TEMPLATE_ALIAS, path, template);
            return template;
          }

          async removeTransactionsImportTemplate(template: TransactionsImportTemplate): Promise<void> {
            const path = TX_IMPORT_TEMPLATES_PATH + template.name;
            await privateClient.remove(path);
          }

          getObjectTypes(): RSModuleObjectType[] {
            return this.getSerializableObjectTypes();
          }

          getSerializableObjectTypes(): RSModuleObjectType[] {
            return [
              { path: TRANSACTIONS_PATH, alias: TRANSACTION_ALIAS, collectionType: true },
              { path: RECURRING_TRANSACTIONS_PATH, alias: RECURRING_TRANSACTION_ALIAS, collectionType: true },
              { path: ASSETS_PATH, alias: ASSET_ALIAS, collectionType: true },
              { path: ACCOUNTS_PATH, alias: ACCOUNT_ALIAS, collectionType: true },
              { path: CONFIG_PATH, alias: CONFIG_ALIAS, collectionType: false },
              { path: FOREXRATES_PATH, alias: FOREXRATES_ALIAS, collectionType: false },
              { path: NOTIFICATIONS_PATH, alias: NOTIFICATION_ALIAS, collectionType: true },
              { path: PORTFOLIO_HISTORY_PATH, alias: PORTFOLIO_HISTORY_ALIAS, collectionType: false },
              { path: TX_IMPORT_TEMPLATES_PATH, alias: TX_IMPORT_TEMPLATE_ALIAS, collectionType: true },
            ];
          }

          /**
           * Wipe entire portfolio data (assets, accounts, transactions, config, etc)
           */
          async wipeStorage(): Promise<void> {
            await super.wipeStorage();
            this._accountIds = null;
            this._assets = null;
            this._transactionIds = null;
            this._recurringTransactionIds = null;
            this._notificationIds = null;
          }

        }(privateClient, publicClient, serializer)
      };
    }
  };
}
