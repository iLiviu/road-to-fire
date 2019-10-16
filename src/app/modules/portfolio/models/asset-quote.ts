export interface AssetQuote {
  symbol: string;
  price: number;
  currency: string;
  percentPrice: boolean;
}

export interface StoredAssetQuote extends AssetQuote {
  timestamp: string;
}

export interface StoredQuotes {
  quotes: StoredAssetQuote[];
}
