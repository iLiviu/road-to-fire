import { Asset, AssetType, AssetData } from '../models/asset';
import { NumKeyDictionary, Dictionary } from 'src/app/shared/models/dictionary';
import { FloatingMath } from 'src/app/shared/util';
import { AssetRegion, AssetRegionWeight, ASSET_REGION_LABELS, AssetRegionHelper, ASSET_INDEX_REGION_ALLOCATIONS } from './asset-region';


export interface TradePosition {
  id?: number;
  buyPrice: number;
  grossBuyPrice: number;
  buyDate: string;
  amount: number;
}

export interface SymbolParts {
  marketCode: string;
  shortSymbol: string;
}




export interface TradeableAssetData extends AssetData {
  buyPrice: number;
  grossBuyPrice: number;
  currentPrice: number;
  symbol: string;
  lastQuoteUpdate: string;
  region: AssetRegion;
  customRegions: AssetRegionWeight[];
  positions: TradePosition[];
}

export class TradeableAsset extends Asset implements TradeableAssetData {
  buyPrice: number;
  grossBuyPrice: number;
  currentPrice: number;
  symbol: string;
  lastQuoteUpdate: string;
  region: AssetRegion;
  customRegions: AssetRegionWeight[];
  positions: TradePosition[];

  constructor(source?: AssetData) {
    super(source);
    this.calculateAveragePositionValues();
  }

  /**
   * Checks if an asset type is a mutual fund
   */
  static isMutualFund(type: AssetType) {
    return (type & AssetType.MutualFund) !== 0;
  }

  /**
   * Adds a new position for the asset, and computes total positions stats
   */
  addPosition(position: TradePosition) {
    if (!this.positions) {
      this.positions = [];
    }
    position.id = new Date().getTime() * 1000 + Math.floor(Math.random() * 999);
    this.positions.push(position);
    this.calculateAveragePositionValues();
  }

  findPosition(id: number) {
    return this.positions.find((pos) => pos.id === id);
  }

  /**
   * Get the human readable geographic region of the asset
   */
  getRegionString() {
    return ASSET_REGION_LABELS[this.region];
  }

  /**
   * Get the weight of each geographic region in the asset's portfolio
   */
  getRegionWeights(): AssetRegionWeight[] {
    if (this.region === AssetRegion.Custom) {
      return this.customRegions;
    } else if (AssetRegionHelper.isIndex(this.region)) {
      return ASSET_INDEX_REGION_ALLOCATIONS[this.region];
    } else {
      const region: AssetRegionWeight = {
        region: this.region,
        weight: 1,
      };
      return [region];
    }
  }

  /**
   * Checks if asset is a mutual fund
   */
  isMutualFund() {
    return TradeableAsset.isMutualFund(this.type);
  }


  /**
   * Parses the asset's full symbol value, and returns the market identifier
   * and short symbol.
   */
  static parseSymbol(symbol: string): SymbolParts {
    const symbolParts = symbol.split(':');
    const marketId: string = (symbolParts.length > 1) ? symbolParts[0] : '';
    const shortSymbol: string = (symbolParts.length > 1) ? symbolParts[1] : symbol;
    return {
      marketCode: marketId,
      shortSymbol: shortSymbol,
    };
  }

  parseSymbol(): SymbolParts {
    return TradeableAsset.parseSymbol(this.symbol);
  }

  /**
   * Removes a position at a given index
   * @param idx index of position to remove
   */
  removePosition(idx: number) {
    this.positions.splice(idx, 1);
    this.calculateAveragePositionValues();
  }

  /**
   * Sets a new value for a position and computes total positions stats
   * @param idx index of position
   * @param newValue new value for the position
   */
  updatePosition(idx: number, newValue: TradePosition) {
    this.positions[idx] = newValue;
    this.calculateAveragePositionValues();
  }

  updateStats() {
    this.calculateAveragePositionValues();
  }

  getCurrentValue() {
    return this.amount * this.currentPrice;
  }

  getBuyFees() {
    return (this.grossBuyPrice - this.buyPrice) * this.amount;
  }

  getBuyCost() {
    return this.amount * this.buyPrice + this.getBuyFees();
  }

  getProfitLoss() {
    return this.getCurrentValue() - this.getBuyCost();
  }


  /**
   * Computes the average buyPrice and total amount of assets held in all positions.
   */
  private calculateAveragePositionValues() {
    this.amount = 0;
    this.buyPrice = 0;
    this.grossBuyPrice = 0;
    let value = 0;
    let grossValue = 0;
    if (this.positions) {
      for (const pos of this.positions) {
        value = FloatingMath.fixRoundingError(value + pos.amount * pos.buyPrice);
        grossValue = FloatingMath.fixRoundingError(grossValue + pos.amount * pos.grossBuyPrice);
        this.amount = FloatingMath.fixRoundingError(this.amount + pos.amount);
      }
      if (this.amount) {
        this.buyPrice = FloatingMath.fixRoundingError(value / this.amount);
        this.grossBuyPrice = FloatingMath.fixRoundingError(grossValue / this.amount);
      }
    }
  }

}
