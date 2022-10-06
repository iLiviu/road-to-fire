import { AssetType, Asset, AssetData } from './asset';
import { DepositAsset } from './deposit-asset';
import { BondAsset } from './bond-asset';
import { TradeableAsset } from './tradeable-asset';
import { ForexAsset } from './forex-asset';

export class AssetFactory {

  static newInstance(assetType: AssetType, source?: AssetData) {
    let result: Asset;
    if (assetType === AssetType.Deposit) {
      result = new DepositAsset(source);
    } else if (assetType === AssetType.Bond || assetType === AssetType.P2P) {
      result = new BondAsset(source);
    } else if (assetType === AssetType.Forex) {
      result = new ForexAsset(source);
    } else if (Asset.isTradeable(assetType)) {
      result = new TradeableAsset(source);
    } else {
      result = new Asset(source);
    }
    return result;
  }
}
