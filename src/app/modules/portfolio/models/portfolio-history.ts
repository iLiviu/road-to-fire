import { AssetType } from './asset';

export interface PortfolioAssetValue {
  type: AssetType;
  value: number;
}

export interface PortfolioHistoryEntry {
  date: string;
  value: number;
  assets: PortfolioAssetValue[];
}

export interface PortfolioHistory {
  entries: PortfolioHistoryEntry[];
}
