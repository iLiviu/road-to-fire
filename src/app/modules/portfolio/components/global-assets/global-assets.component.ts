import { PortfolioAccount } from '../../models/portfolio-account';
import { AssetsComponent } from '../assets/assets.component';
import { AppEventType, AppEvent } from 'src/app/core/services/events.service';
import { ViewAsset } from '../../models/view-asset';
import { OnInit } from '@angular/core';


/**
 * Base component for displaying detailed information for a specific asset class.
 * This includes a summary of different statistics and the list of assets
 */
export class GlobalAssetsComponent extends AssetsComponent implements OnInit {

  pageTitle: string;

  private accounts: PortfolioAccount[];
  private refreshTimer: any;

  ngOnInit() {
    super.ngOnInit();
  }

  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.ACCOUNT_ADDED:
      case AppEventType.ACCOUNT_REMOVED:
      case AppEventType.ACCOUNT_UPDATED:
      case AppEventType.ASSET_ADDED:
      case AppEventType.ASSET_REMOVED:
      case AppEventType.ASSET_UPDATED:
        this.onDataUpdated();
        break;
      default:
        super.handleEvents(event);
    }
  }

  /**
   * Called when an asset or account has been added/modified/removed
   */
  onDataUpdated() {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      this.updateAccountsList();
    }, 100);


  }

  protected onConfigLoaded() {
    super.onConfigLoaded();
    this.updateAccountsList();
  }

  protected createViewAssets(): ViewAsset[] {
    const list: ViewAsset[] = [];
    for (const account of this.accounts) {
      for (const asset of account.assets) {
        this.addViewAsset(asset, account, list);
      }
    }
    return list;
  }

  private async updateAccountsList() {
    this.assetsLoaded = false;
    try {
      this.accounts = await this.portfolioService.getAccounts();
      await this.buildAssetsList();
    } catch (err) {
      this.logger.error('Could not retrieve accounts!', err);
    }
    this.onAssetsLoaded();
  }


}


