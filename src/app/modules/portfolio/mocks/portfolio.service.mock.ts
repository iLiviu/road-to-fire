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
    dashboardGridVisibility: {},
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

  savePortfolioHistory(history: PortfolioHistory): Promise<void> {
    return Promise.resolve();
  }

}
