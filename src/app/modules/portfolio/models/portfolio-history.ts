import { AssetType } from './asset';

export interface PortfolioAssetValue {
  type: AssetType;
  value: number;
}

export interface PortfolioHistoryEntry {
  date: string;
  value: number;
  unrealizedPL: number;
  assets: PortfolioAssetValue[];
  assetsUnrealizedPL: PortfolioAssetValue[];
}

export interface PortfolioHistory {
  entries: PortfolioHistoryEntry[];
}
