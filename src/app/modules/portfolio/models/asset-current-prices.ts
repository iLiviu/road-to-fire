import { Dictionary } from 'src/app/shared/models/dictionary';

export interface AssetPriceEntry {
  price: number;
  lastQuoteUpdate: string;
}

/**
 * Centralized store for all tradeable asset current prices.
 * Stored as a single file to minimise cloud sync HTTP requests when prices are updated.
 * Key is the asset id (as a string).
 */
export interface AssetCurrentPrices {
  prices: Dictionary<AssetPriceEntry>;
}
