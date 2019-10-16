import { PortfolioAccount } from './portfolio-account';
import { Asset } from './asset';

export interface AccountAsset {
  account: PortfolioAccount;
  asset: Asset;
}
