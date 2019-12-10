import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { AssetType, Asset } from '../../models/asset';
import { GlobalAssetsComponent } from '../../components/global-assets/global-assets.component';
import { CurrencyBalance } from '../../models/currency-balance';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { EventsService } from 'src/app/core/services/events.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { ViewAsset } from '../../models/view-asset';
import { NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { StorageService } from 'src/app/core/services/storage.service';



enum AssetGroupBy {
  None = '0',
  Account = '1',
  Currency = '2'
}

/**
 * Component to display a UI with a summary of all debt assets and a list of them
 */
@Component({
  selector: 'app-debt',
  templateUrl: './debt.component.html',
  styleUrls: ['../../components/assets/assets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DebtComponent extends GlobalAssetsComponent implements OnInit {

  currentDebtRatio: number;

  readonly AssetGroupBy = AssetGroupBy;

  private balances: CurrencyBalance[];
  private currencyBalances: NumKeyDictionary<number> = {};

  constructor(protected portfolioService: PortfolioService, protected eventsService: EventsService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef) {
    super(portfolioService, eventsService, logger, dialogService, router, storageService, cdr);
  }


  ngOnInit() {
    this.assetTypes = AssetType.Debt;
    super.ngOnInit();
  }

  protected canIncludeAsset(asset: Asset) {
    if (super.canIncludeAsset(asset)) {
      return true;
    }
    // we also add cash assets with negative balance to the list of liabilities
    return asset.isCash() && asset.amount < 0;
  }

  async buildAssetsList() {
    this.currencyBalances = [];

    await super.buildAssetsList();

    const grossPortfolioValue = this.totalPortfolioValue - this.assetsOverview.currentValue;
    if (grossPortfolioValue !== 0) {
      this.currentDebtRatio = Math.abs(this.assetsOverview.currentValue) / grossPortfolioValue;
    }

    // balances grouped by currency are needed
    this.balances = [];
    for (const currency of Object.keys(this.currencyBalances)) {
      this.balances.push({
        currency: currency,
        balance: this.currencyBalances[currency]
      });
    }
    this.balances.sort((a, b) => {
      return a.currency < b.currency ? -1 : 1;
    });
  }

  updateViewAssetData(viewAsset: ViewAsset) {
    super.updateViewAssetData(viewAsset);

    if (!this.currencyBalances[viewAsset.asset.currency]) {
      this.currencyBalances[viewAsset.asset.currency] = 0;
    }
    this.currencyBalances[viewAsset.asset.currency] += viewAsset.currentValue;
  }

}


