import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { AssetType } from '../../models/asset';
import { GlobalAssetsComponent } from '../../components/global-assets/global-assets.component';
import { CurrencyBalance } from '../../models/currency-balance';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { EventsService } from 'src/app/core/services/events.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { ViewAsset } from '../../models/view-asset';
import { NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { StorageService } from 'src/app/core/services/storage.service';
import { TradeableAsset } from '../../models/tradeable-asset';



enum AssetGroupBy {
  None = '0',
  Account = '1',
  Currency = '2'
}

/**
 * Component to display a UI with a summary of all cash assets (including deposits) and a list of them
 */
@Component({
  selector: 'app-cash',
  templateUrl: './cash.component.html',
  styleUrls: ['../../components/assets/assets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashComponent extends GlobalAssetsComponent implements OnInit {

  readonly AssetGroupBy = AssetGroupBy;

  private cashBalances: CurrencyBalance[];
  private currencyBalances: NumKeyDictionary<number> = {};
  private cashAssets: ViewAsset[];
  private deposits: ViewAsset[];
  public mmAssets: ViewAsset[];

  constructor(protected portfolioService: PortfolioService, protected eventsService: EventsService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef) {
    super(portfolioService, eventsService, logger, dialogService, router, storageService, cdr);
  }


  ngOnInit() {
    this.assetTypes = AssetType.Cash | AssetType.Deposit;
    super.ngOnInit();
  }

  async buildAssetsList() {
    this.currencyBalances = [];
    this.cashAssets = [];
    this.deposits = [];
    this.mmAssets = [];

    await super.buildAssetsList();

    for (const viewAsset of this.viewAssets) {
      if (viewAsset.asset.type === AssetType.Cash) {
        this.cashAssets.push(viewAsset);
      } else if (viewAsset.asset.type === AssetType.Deposit) {
        this.deposits.push(viewAsset);
      } else {
        this.mmAssets.push(viewAsset);
      }
    }

    // cash balances grouped by currency are needed for cash page
    this.cashBalances = [];
    for (const currency of Object.keys(this.currencyBalances)) {
      this.cashBalances.push({
        currency: currency,
        balance: this.currencyBalances[currency]
      });
    }
    this.cashBalances.sort((a, b) => {
      return a.currency < b.currency ? -1 : 1;
    });
  }

  updateViewAssetData(viewAsset: ViewAsset) {
    super.updateViewAssetData(viewAsset);

    if (!this.currencyBalances[viewAsset.asset.currency]) {
      this.currencyBalances[viewAsset.asset.currency] = 0;
    }
    let assetValue = 0;
    if (viewAsset.asset.isTradeable()) {
      const trAsset = <TradeableAsset>viewAsset.asset;
      assetValue = trAsset.getCurrentValue();
    } else {
      assetValue = viewAsset.asset.amount;
    }
    this.currencyBalances[viewAsset.asset.currency] += assetValue;
  }

}


