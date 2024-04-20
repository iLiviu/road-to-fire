import { Asset, AssetType } from './asset';
import { TradeableAsset } from './tradeable-asset';

export class AccountNotFoundError extends Error {
  constructor(accId: number) {
    super('Invalid account id: ' + accId);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AccountNotFoundError.prototype);
  }
}

export interface PortfolioAccountData {
  assets: Asset[];
  id: number;
  description: string;
}


export class PortfolioAccount implements PortfolioAccount {
  assets: Asset[];
  id: number;
  description: string;

  constructor(source?: PortfolioAccountData) {
    if (source) {
      Object.assign(this, source);
    } else {
      this.assets = [];
    }
  }

  /**
   * Find an asset in account that matches a given symbol, type and currency.
   * If no asset is found, return `undefined`.
   * @param symbol symbol to match
   * @param type type of asset to match
   * @param currency currency of the asset to match
   */
  findAssetBySymbol(symbol: string, type: AssetType, currency: string) {
    if (!Asset.isTradeable(type)) {
      // can only look through tradeable assets
      return false;
    }
    symbol = symbol.toUpperCase();
    const asset = this.assets.find((curAsset) => {
      if ((type === null || type === curAsset.type) && currency === curAsset.currency) {
        const trAsset = <TradeableAsset>curAsset;
        if (trAsset.symbol.toUpperCase() === symbol) {
          return true;
        }
      }
      return false;
    });
    return asset;
  }

  /**
   * Find an asset in account that matches a given short symbol (without market Identifier) , type and currency.
   * If no asset is found, return `undefined`.
   * @param symbol symbol to match
   * @param type type of asset to match
   * @param currency currency of the asset to match
   */
  findAssetByShortSymbol(shortSymbol: string, type: AssetType, currency: string) {
    shortSymbol = shortSymbol.toUpperCase();
    const asset = this.assets.find((curAsset) => {
      if (((type === null && curAsset.isTradeable()) || type === curAsset.type) && currency === curAsset.currency) {
        const trAsset = <TradeableAsset>curAsset;
        if (trAsset.parseSymbol().shortSymbol.toUpperCase() === shortSymbol) {
          return true;
        }
      }
      return false;
    });
    return asset;
  }  

  /**
   * Find an asset in account that matches a given description (case-sensitive), type and currency.
   * If no asset is found, return `undefined`.
   * @param requiredDescription description to match
   * @param type type of asset to match
   * @param currency currency of the asset to match
   */
  findAssetByDescription(requiredDescription: string, type: AssetType, currency: string) {
    const asset = this.assets.find((curAsset) => {
      if (type === curAsset.type && currency === curAsset.currency && curAsset.description === requiredDescription) {
        return true;
      } else {
        return false;
      }
    });
    return asset;
  }

  /**
   * Return the account's asset that has the given id or `undefined` if
   * no asset was found.
   * @param assetId id of asset
   */
  getAssetById(assetId: number): Asset {
    if (assetId) {
      for (const asset of this.assets) {
        if (asset.id === assetId) {
          return asset;
        }
      }
    }

    return undefined;
  }
}
