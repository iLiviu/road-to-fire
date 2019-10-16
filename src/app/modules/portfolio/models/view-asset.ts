import { PortfolioAccount } from './portfolio-account';
import { Asset } from './asset';
import { TradePosition } from './tradeable-asset';

interface AccountAsset {
  asset: Asset;
  account: PortfolioAccount;
}

/**
 * Holds data for an asset that is to be displayed in the UI. If the asset is a tradeable asset,
 * the data is for a single trading position only.
 */
export class ViewAsset {
  children: ViewAsset[];
  currentValue: number;
  initialValue: number;
  currentValueBaseCurrency: number;
  initialValueBaseCurrency: number;
  position: TradePosition;

  profitLoss: number;
  profitLossPercent: number;

  private _accAsset: AccountAsset;

  constructor(asset: Asset, account: PortfolioAccount) {
    this.children = null;
    this._accAsset = {
      account: account,
      asset: asset,
    };
    this.currentValue = asset.amount;
    this.initialValue = asset.amount;
    this.currentValueBaseCurrency = 0;
    this.initialValueBaseCurrency = 0;
    this.profitLoss = 0;
    this.profitLossPercent = 0;
  }

  /**
   * Add an asset as a child of this one. Used if there are multiple positions opened
   * for an asset
   * @param position position to display details for
   * @param asset asset to add
   * @param account account of asset
   */
  addChildAsset(position: TradePosition, asset: Asset, account: PortfolioAccount) {
    if (!this.children) {
      this.children = [];
    }
    const child = new ViewAsset(asset, account);
    child.position = position;
    this.children.push(child);
  }

  get asset() {
    return this._accAsset.asset;
  }

  get account() {
    return this._accAsset.account;
  }
}
