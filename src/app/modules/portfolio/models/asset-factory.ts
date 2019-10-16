import { AssetType, Asset, AssetData } from './asset';
import { DepositAsset } from './deposit-asset';
import { BondAsset } from './bond-asset';
import { TradeableAsset } from './tradeable-asset';

export class AssetFactory {

  static newInstance(assetType: AssetType, source?: AssetData) {
    let result: Asset;
    if (assetType === AssetType.Deposit) {
      result = new DepositAsset(source);
    } else if (assetType === AssetType.Bond) {
      result = new BondAsset(source);
    } else if (Asset.isTradeable(assetType)) {
      result = new TradeableAsset(source);
    } else {
      result = new Asset(source);
    }
    return result;
  }
}
