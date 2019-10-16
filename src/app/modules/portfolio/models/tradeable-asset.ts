import { Asset, AssetType, AssetData } from '../models/asset';
import { NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { FloatingMath } from 'src/app/shared/util';


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

export enum AssetRegion {
  Unspecified = 0,
  NorthAmerica = 1,
  LatinAmerica = 2,
  DevelopedEurope = 4,
  EmergingEurope = 8,
  Pacific = 16,
  Asia = 32,
  Africa = 64,
  EmergingGlobal = Africa | Asia | EmergingEurope | LatinAmerica,
  All = Africa | Asia | Pacific | EmergingEurope | DevelopedEurope | LatinAmerica | NorthAmerica,
}

export const ASSET_REGION_LABELS: NumKeyDictionary<string> = {};
ASSET_REGION_LABELS[AssetRegion.Unspecified] = 'Unspecified';
ASSET_REGION_LABELS[AssetRegion.NorthAmerica] = 'North America';
ASSET_REGION_LABELS[AssetRegion.LatinAmerica] = 'Latin America';
ASSET_REGION_LABELS[AssetRegion.DevelopedEurope] = 'Developed Europe';
ASSET_REGION_LABELS[AssetRegion.EmergingEurope] = 'Emerging Europe';
ASSET_REGION_LABELS[AssetRegion.Pacific] = 'Pacific';
ASSET_REGION_LABELS[AssetRegion.Asia] = 'Asia';
ASSET_REGION_LABELS[AssetRegion.Africa] = 'Africa';
ASSET_REGION_LABELS[AssetRegion.EmergingGlobal] = 'Emerging Global';
ASSET_REGION_LABELS[AssetRegion.All] = 'Global';

export interface TradeableAssetData extends AssetData {
  buyPrice: number;
  grossBuyPrice: number;
  currentPrice: number;
  symbol: string;
  lastQuoteUpdate: string;
  region: AssetRegion;
  positions: TradePosition[];
}

export class TradeableAsset extends Asset implements TradeableAssetData {
  buyPrice: number;
  grossBuyPrice: number;
  currentPrice: number;
  symbol: string;
  lastQuoteUpdate: string;
  region: AssetRegion;
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
   * Checks if asset is a mutual fund
   */
  isMutualFund() {
    return TradeableAsset.isMutualFund(this.type);
  }


  /**
   * Parses the asset's full symbol value, and returns the market identifier
   * and short symbol.
   */
  parseSymbol(): SymbolParts {
    const symbolParts = this.symbol.split(':');
    const marketId: string = (symbolParts.length > 1) ? symbolParts[0] : '';
    const shortSymbol: string = (symbolParts.length > 1) ? symbolParts[1] : this.symbol;
    return {
      marketCode: marketId,
      shortSymbol: shortSymbol,
    };
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
