import { StorageModule } from 'src/app/core/services/storage.service';
import { PortfolioAccount } from './portfolio-account';
import { Asset } from './asset';
import { Transaction } from './transaction';
import { PortfolioConfig } from './portfolio-config';
import { StoredQuotes } from './asset-quote';
import { AppNotification } from './notification';
import { RecurringTransaction } from './recurring-transaction';
import { PortfolioHistory } from './portfolio-history';
import { TransactionsImportTemplate } from './transactions-import-template';

export interface PortfolioStorage extends StorageModule {
  addAccount(account: PortfolioAccount): Promise<PortfolioAccount>;
  getAccount(id: number): Promise<PortfolioAccount>;
  getAllAccounts(loadAssets: boolean): Promise<PortfolioAccount[]>;
  updateAccount(account: PortfolioAccount): Promise<PortfolioAccount>;
  removeAccount(account: PortfolioAccount): Promise<void>;
  addAsset(asset: Asset): Promise<Asset>;
  getAsset(id: number): Promise<Asset>;
  getAllAssets(): Promise<Asset[]>;
  updateAsset(asset: Asset): Promise<Asset>;
  removeAsset(asset: Asset): Promise<void>;
  addTransaction(tx: Transaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction>;
  getAllTransactions(): Promise<Transaction[]>;
  updateTransaction(tx: Transaction): Promise<Transaction>;
  removeTransaction(tx: Transaction): Promise<void>;
  addRecurringTransaction(tx: RecurringTransaction): Promise<RecurringTransaction>;
  getRecurringTransaction(id: number): Promise<RecurringTransaction>;
  getAllRecurringTransactions(): Promise<RecurringTransaction[]>;
  updateRecurringTransaction(tx: RecurringTransaction): Promise<RecurringTransaction>;
  removeRecurringTransaction(tx: RecurringTransaction): Promise<void>;
  addNotification(notification: AppNotification): Promise<AppNotification>;
  updateNotification(notification: AppNotification): Promise<AppNotification>;
  removeNotification(notification: AppNotification): Promise<void>;
  getNotification(id: number): Promise<AppNotification>;
  getNotifications(): Promise<AppNotification[]>;
  clearNotifications(): Promise<void>;
  readConfig(): Promise<PortfolioConfig>;
  saveConfig(cfg: PortfolioConfig): Promise<void>;
  getStoredForexRates(): Promise<StoredQuotes>;
  storeForexRates(quotes: StoredQuotes): Promise<void>;
  getPortfolioHistory(): Promise<PortfolioHistory>;
  storePortfolioHistory(history: PortfolioHistory): Promise<void>;
  getTransactionsImportTemplates(): Promise<TransactionsImportTemplate[]>;
  addTransactionsImportTemplate(template: TransactionsImportTemplate): Promise<TransactionsImportTemplate>;
  updateTransactionsImportTemplate(template: TransactionsImportTemplate): Promise<TransactionsImportTemplate>;
  removeTransactionsImportTemplate(template: TransactionsImportTemplate): Promise<void>;
}
