import { PortfolioAccount } from '../models/portfolio-account';
import { SAMPLE_ACCOUNTS } from './sample-accounts.mock';
import { AppNotification } from '../models/notification';
import { PortfolioConfig } from '../models/portfolio-config';
import { AssetType } from '../models/asset';
import { PortfolioHistory } from '../models/portfolio-history';

export class MockPortfolioService {

  config: PortfolioConfig = {
    baseCurrency: 'EUR',
    goals: [{ title: 'RE', value: 1000000 }],
    hideCapitalGainsWarning: false,
    lastQuotesUpdate: new Date().toISOString(),
    loanToValueRatio: 0,
    portfolioAllocation: [{ assetType: AssetType.Cash, allocation: 1 }],
    withdrawalRate: 0.04,
    selectedBenchmarks: [],
    dashboardGridVisibility: {},
    phTimeFrame: '',
    benchmarkTimeFrame: '',
    plhTimeFrame: '',
    version: 1,
  };
  notifications: AppNotification[] = [];
  accounts = Object.values(SAMPLE_ACCOUNTS);
  portfolioHistory: PortfolioHistory = {
    entries: [],
  };

  getAccount(id: number): Promise<PortfolioAccount> {
    const account = this.accounts.find((acc) => acc.id === id);
    return Promise.resolve(account);
  }

  getNotification(id: number): Promise<AppNotification> {
    const notification = this.notifications.find((notif) => notif.id === id);
    return Promise.resolve(notification);
  }

  getTransaction(id: number): Promise<any> {
    return Promise.resolve(null);
  }

  getRecurringTransaction(id: number): Promise<any> {
    return Promise.resolve(null);
  }

  getAccounts(): Promise<PortfolioAccount[]> {
    return Promise.resolve(this.accounts);
  }

  getNotifications(): Promise<AppNotification[]> {
    return Promise.resolve(this.notifications);
  }

  readConfig(): Promise<PortfolioConfig> {
    return Promise.resolve(this.config);
  }

  getPortfolioHistory(): Promise<PortfolioHistory> {
    return Promise.resolve(this.portfolioHistory);
  }

  getTransactions(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getLabelCategories(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getLabels(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getRecurringTransactions(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getForexRates(symbols: string[]): Promise<any[]> {
    return Promise.resolve([]);
  }

  saveConfig(config: PortfolioConfig): Promise<void> {
    this.config = config;
    return Promise.resolve();
  }

  updateAsset(asset: any, account: any): Promise<void> {
    return Promise.resolve();
  }

  updateAssetQuotes(): Promise<boolean> {
    return Promise.resolve(true);
  }

  markNotificationAsRead(notification: AppNotification): Promise<void> {
    notification.unread = false;
    return Promise.resolve();
  }

  deleteNotification(notification: AppNotification): Promise<void> {
    return Promise.resolve();
  }

  savePortfolioHistory(history: PortfolioHistory): Promise<void> {
    return Promise.resolve();
  }

  benchmarksCache: any = null;
  getBenchmarksCache(): Promise<any> {
    return Promise.resolve(this.benchmarksCache);
  }
  saveBenchmarksCache(cache: any): Promise<void> {
    this.benchmarksCache = cache;
    return Promise.resolve();
  }
  invalidateBenchmarksCache(): void {
    this.benchmarksCache = null;
  }

}
