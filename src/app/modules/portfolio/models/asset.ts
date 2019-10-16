import { NumKeyDictionary } from 'src/app/shared/models/dictionary';

export class AssetNotFoundError extends Error {
  constructor(assetId: number) {
    super('Invalid asset id: ' + assetId);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AssetNotFoundError.prototype);
  }
}

export enum AssetType {
  Cash = 1,
  Deposit = 2,
  CashLike = Deposit | Cash,
  Bond = 4,
  Stock = 8,
  Commodity = 16,
  Cryptocurrency = 32,
  RealEstate = 64,
  TradeableAsset = RealEstate | Cryptocurrency | Commodity | Stock | Bond,
  ETF = 128,
  StockETF = Stock | ETF,
  BondETF = Stock | ETF | Bond,
  MoneyMarket = Stock | Cash,
  MoneyMarketETF = MoneyMarket | ETF,
  CommodityETF = Stock | ETF | Commodity,
  MutualFund = 256,
  StockMutualFund = Stock | MutualFund,
  BondMutualFund = Stock | MutualFund | Bond,
  MoneyMarketMutualFund = MoneyMarket | MutualFund,
  CommodityMutualFund = Stock | MutualFund | Commodity,

  All = MutualFund | ETF | TradeableAsset | Deposit | Cash,
}

export const ASSET_TYPE_LABELS: NumKeyDictionary<string> = {};
ASSET_TYPE_LABELS[AssetType.Cash] = 'Cash';
ASSET_TYPE_LABELS[AssetType.Deposit] = 'Deposits';
ASSET_TYPE_LABELS[AssetType.CashLike] = 'Cash/Deposits';
ASSET_TYPE_LABELS[AssetType.Bond] = 'Bonds';
ASSET_TYPE_LABELS[AssetType.Stock] = 'Stocks';
ASSET_TYPE_LABELS[AssetType.Commodity] = 'Commodities';
ASSET_TYPE_LABELS[AssetType.Cryptocurrency] = 'Cryptocurrencies';
ASSET_TYPE_LABELS[AssetType.RealEstate] = 'Real Estate';
ASSET_TYPE_LABELS[AssetType.StockETF] = 'Stock ETF';
ASSET_TYPE_LABELS[AssetType.BondETF] = 'Bond ETF';
ASSET_TYPE_LABELS[AssetType.MoneyMarketETF] = 'Money Market ETF';
ASSET_TYPE_LABELS[AssetType.CommodityETF] = 'Commodity ETF';
ASSET_TYPE_LABELS[AssetType.StockMutualFund] = 'Stock Mutual Fund';
ASSET_TYPE_LABELS[AssetType.BondMutualFund] = 'Bond Mutual Fund';
ASSET_TYPE_LABELS[AssetType.CommodityMutualFund] = 'Commodity Mutual Fund';
ASSET_TYPE_LABELS[AssetType.MoneyMarketMutualFund] = 'Money Market Mutual Fund';

export interface AssetData {
  id?: number;
  amount: number;
  currency: string;
  description: string;
  type: AssetType;
  cashAssetId?: number;
  pendingDelete?: boolean;
}

export class Asset implements AssetData {
  id?: number;
  amount: number;
  currency: string;
  description: string;
  type: AssetType;
  cashAssetId?: number;
  pendingDelete?: boolean;

  /**
   * Checks wherever an asset type is a bond or a fund holding bonds
   */
  static isBondLike(type: AssetType) {
    return (type & AssetType.Bond) !== 0;
  }

  /**
   * Checks wherever an asset type is a cash or deposit asset
   */
  static isCashLike(type: AssetType) {
    return (type & AssetType.CashLike) !== 0;
  }

  /**
   * Checks wherever an asset type is a money market asset
   */
  static isMoneyMarket(type: AssetType) {
    return (type & AssetType.MoneyMarket) === AssetType.MoneyMarket;
  }

  /**
   * Checks wherever an asset type is a commodity or a fund holding commodities
   */
  static isCommodityLike(type: AssetType) {
    return (type & AssetType.Commodity) !== 0;
  }

  /**
   * Checks wherever an asset type is a stock or a fund
   */
  static isStockLike(type: AssetType) {
    return (type & AssetType.Stock) !== 0;
  }

  /**
   * Checks wherever an asset type is a commodity or a fund holding commodities
   */
  static isTradeable(type: AssetType) {
    return (type & AssetType.TradeableAsset) !== 0;
  }

  constructor(source?: AssetData) {
    if (source) {
      Object.assign(this, source);
    }
  }

  /**
   * Updates any properties that need to be calculated.
   * Can be overridden by in classes that extend this class.
   */
  updateStats() {

  }

  /**
   * Returns a new instance of the asset, shallow copying all it's properties.
   */
  clone() {
    const obj = Object.create(Object.getPrototypeOf(this));
    obj.constructor(this);
    return obj;
  }

  /**
   * Get the underlying type of an asset. Funds holding a specific asset type will
   * return the underlying asset's type. (ex: Bond funds wil return Bond as their
   * broad type).
   */
  getBroadAssetType() {
    if (Asset.isCashLike(this.type)) { // include deposits & Money Market ETFs as cash
      return AssetType.Cash;
    } else if (Asset.isBondLike(this.type)) { // include Bond ETFs
      return AssetType.Bond;
    } else if (Asset.isCommodityLike(this.type)) { // include Commodity ETFs
      return AssetType.Commodity;
    } else if (Asset.isStockLike(this.type)) { // include Stock ETFs
      return AssetType.Stock;
    } else {
      return this.type;
    }
  }

  /**
   * Checks wherever asset is a bond or a fund holding bonds
   */
  isBondLike() {
    return Asset.isBondLike(this.type);
  }

  /**
   * Checks wherever asset is a cash or deposit asset
   */
  isCashLike() {
    return Asset.isCashLike(this.type);
  }

  /**
   * Checks wherever asset is a money market asset
   */
  isMoneyMarket() {
    return Asset.isMoneyMarket(this.type);
  }

  /**
   * Checks wherever asset is a commodity or a fund holding commodities
   */
  isCommodityLike() {
    return Asset.isCommodityLike(this.type);
  }

  /**
   * Checks if the type of the asset is related with one of the valid types
   * (ex: bond ETF is related with bond type)
   * @param typeMask a mask of all valid types
   */
  isOfRelatedType(typeMask: AssetType) {
    return (this.type & typeMask) !== 0;
  }

  /**
   * Checks if the type of the asset matches exactly one of the valid types
   * @param typeMask a mask of all valid types
   */
  isOfStrictType(typeMask: AssetType) {
    return (this.type & typeMask) === this.type;
  }

  /**
   * Checks wherever asset is a tradeable asset
   */
  isTradeable() {
    return Asset.isTradeable(this.type);
  }

  /**
   * Checks wherever asset is a a stock of a company or a fund
   */
  isStockLike() {
    return Asset.isStockLike(this.type);
  }

  /**
   * Return the current value of the asset
   */
  getCurrentValue() {
    return this.amount;
  }
}
