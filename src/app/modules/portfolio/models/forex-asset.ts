import { TradeableAsset, TradeableAssetData } from './tradeable-asset';
import { AssetData } from './asset';




export class ForexAsset extends TradeableAsset {

  constructor(source?: AssetData) {
    super(source);
  }

  /**
   * Checks if the asset is virtual (does not have an impact in portfolio value)
   */
  isVirtualAsset() {
    return true;
  }

}
