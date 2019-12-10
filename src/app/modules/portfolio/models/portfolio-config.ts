import { AssetType } from './asset';
import { Dictionary } from 'src/app/shared/models/dictionary';

export interface Goal {
  title: string;
  value: number;
}

export interface AssetAllocation {
  allocation: number;
  assetType: AssetType;
}

export interface PortfolioConfig {
  baseCurrency: string;
  goals: Goal[];
  lastQuotesUpdate: string;
  hideCapitalGainsWarning: boolean;
  portfolioAllocation: AssetAllocation[];
  withdrawalRate: number;
  dashboardGridVisibility: Dictionary<boolean>;
  loanToValueRatio: number;
}
