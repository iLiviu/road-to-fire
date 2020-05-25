import { OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { AssetType, Asset } from '../../models/asset';
import { PortfolioService } from '../../services/portfolio.service';
import { PortfolioAccount } from '../../models/portfolio-account';
import { EventsService, AppEvent } from 'src/app/core/services/events.service';
import { AssetOverview } from '../../models/asset-overview';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioPageComponent } from '../portfolio-page/portfolio-page.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { ViewAsset } from '../../models/view-asset';
import { Dictionary } from 'src/app/shared/models/dictionary';
import { StorageService } from 'src/app/core/services/storage.service';
import { TradeableAsset } from '../../models/tradeable-asset';
import { BondAsset } from '../../models/bond-asset';

/**
 * Base Component for a UI that displays information about a group of assets
 */
export abstract class AssetsComponent extends PortfolioPageComponent implements OnInit {

  assetsLoaded = false;
  assetsOverview: AssetOverview;
  totalAssetsValue: number;
  totalLiabilitiesValue: number;
  totalPortfolioValue: number;
  viewAssets: ViewAsset[];

  readonly AssetType = AssetType;

  protected assetTypes: AssetType;
  protected strictAssetTypesCheck = false;
  protected viewAssetsMap: Dictionary<ViewAsset>;

  constructor(protected portfolioService: PortfolioService, protected eventsService: EventsService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef) {
    super(logger, portfolioService, dialogService, eventsService, router, storageService);

  }

  ngOnInit() {
    this.forexRates = {};
    this.clearAssetData();

    super.ngOnInit();
  }

  protected onAssetsLoaded() {
    this.assetsLoaded = true;
    this.cdr.markForCheck();
  }

  protected onConfigLoaded() {
    super.onConfigLoaded();
  }

  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      default:
        super.handleEvents(event);
    }
  }

  /**
   * clear any data specific to the current loaded assets
   */
  protected clearAssetData() {
    this.totalAssetsValue = 0;
    this.totalLiabilitiesValue = 0;
    this.totalPortfolioValue = 0;
    this.viewAssets = [];
    this.viewAssetsMap = {};
    this.assetsOverview = new AssetOverview();
  }

  /**
   * creates a new asset needed for the component view
   */
  protected createViewAsset(asset: Asset, account: PortfolioAccount): ViewAsset {

    const newAsset = new ViewAsset(asset, account);
    return newAsset;
  }

  /**
   * creates the list of assets needed for the component view
   */
  protected abstract createViewAssets(): ViewAsset[];

  /**
   * Add an asset to the list of assets. Tradeable assets with multiple positions open,
   * are created as expandable elements, with each position as a child element.
   * @param asset asset to add
   * @param account account of asset
   * @param list the list to add the asset to
   */
  protected addViewAsset(asset: Asset, account: PortfolioAccount, list: ViewAsset[], ) {
    let viewAsset: ViewAsset;
    let tradeableAsset: TradeableAsset;
    viewAsset = this.createViewAsset(asset, account);
    if (asset.isTradeable()) {
      tradeableAsset = <TradeableAsset>asset;
      if (tradeableAsset.positions.length > 1) {
        for (const position of tradeableAsset.positions) {
          viewAsset.addChildAsset(position, asset, account);
        }
      } else if (tradeableAsset.positions.length > 0) {
        viewAsset.position = tradeableAsset.positions[0];
      } else {
        // we don't display tradeable assets without any open positions
        return;
      }
    }
    list.push(viewAsset);
  }

  /**
   * Compute the current value for an asset and add the value to
   * the total portfolio's value
   * @param viewAsset the assets to compute data for
   */
  private computeAssetValue(viewAsset: ViewAsset) {
    const rate: number = this.getCurrencyRate(viewAsset.asset.currency);
    viewAsset.currentValue = viewAsset.asset.getCurrentValue();
    const baseCurrencyValue = viewAsset.currentValue * rate;
    this.totalPortfolioValue += baseCurrencyValue;
    if (baseCurrencyValue > 0) {
      this.totalAssetsValue += baseCurrencyValue;
    } else {
      this.totalLiabilitiesValue += baseCurrencyValue;
    }
  }

  /**
   * Check if an asset meets the criteria to be included in the list
   * @param asset asset to check
   */
  protected canIncludeAsset(asset: Asset) {
    if (this.strictAssetTypesCheck) {
      return asset.isOfStrictType(this.assetTypes);
    } else {
      return asset.isOfRelatedType(this.assetTypes);
    }
  }

  /**
   * Build the list of assets that will be displayed in the view
   */
  protected async buildAssetsList() {
    this.clearAssetData();

    const viewAssets = this.createViewAssets();

    // check for any foreign currencies and get their quotes
    const requiredCurrencies: string[] = [];
    for (const viewAsset of viewAssets) {
      requiredCurrencies.push(viewAsset.asset.currency);
    }
    await this.updateForexRates(requiredCurrencies);

    for (const viewAsset of viewAssets) {
      this.computeAssetValue(viewAsset);

      if (this.canIncludeAsset(viewAsset.asset)) {
        if (viewAsset.children) {
          // the viewAsset will actually contain aggregate stats from all it's children
          // we only calculate the stats that are currently displayed in views
          viewAsset.initialValue = 0;
          viewAsset.currentValue = 0;
          viewAsset.initialValueBaseCurrency = 0;
          viewAsset.currentValueBaseCurrency = 0;
          viewAsset.profitLoss = 0;
          viewAsset.profitLossPercent = 0;
          for (const child of viewAsset.children) {
            this.updateViewAssetData(child);
            viewAsset.initialValue += child.initialValue;
            viewAsset.currentValue += child.currentValue;
            viewAsset.initialValueBaseCurrency += child.initialValueBaseCurrency;
            viewAsset.currentValueBaseCurrency += child.currentValueBaseCurrency;
          }
          viewAsset.profitLoss = viewAsset.currentValue - viewAsset.initialValue;
          viewAsset.profitLossPercent = (viewAsset.initialValue === 0) ?
            0 : (viewAsset.currentValue - viewAsset.initialValue) / viewAsset.initialValue;
        } else {
          this.updateViewAssetData(viewAsset);
        }
        this.viewAssets.push(viewAsset);
      }
    }

    this.assetsOverview.profitLoss = this.assetsOverview.currentUnrealizedValue - this.assetsOverview.initialUnrealizedValue;
    this.assetsOverview.profitLossPercent = (this.assetsOverview.initialUnrealizedValue === 0) ?
      0 : this.assetsOverview.profitLoss / this.assetsOverview.initialUnrealizedValue;
  }


  /**
   * Perform computations for asset's properties
   * @param asset asset to update data for
   */
  protected updateViewAssetData(viewAsset: ViewAsset) {
    const rate: number = this.getCurrencyRate(viewAsset.asset.currency);

    if (viewAsset.asset.isTradeable()) {
      const tradeableAsset = <TradeableAsset>viewAsset.asset;
      viewAsset.initialValue = viewAsset.position.amount * viewAsset.position.buyPrice;
      viewAsset.currentValue = viewAsset.position.amount * tradeableAsset.currentPrice;
      if (tradeableAsset.type === AssetType.Bond || tradeableAsset.type === AssetType.P2P) {
        // we need to add position accrued interest to current value for bonds
        const bond = <BondAsset>tradeableAsset;
        viewAsset.currentValue += bond.getUnitAccruedInterest() * viewAsset.position.amount;
      }

      this.assetsOverview.initialUnrealizedValue += viewAsset.initialValue * rate;
      this.assetsOverview.currentUnrealizedValue += viewAsset.currentValue * rate;

    }
    viewAsset.initialValueBaseCurrency = viewAsset.initialValue * rate;
    viewAsset.currentValueBaseCurrency = viewAsset.currentValue * rate;

    viewAsset.profitLoss = viewAsset.currentValue - viewAsset.initialValue;
    viewAsset.profitLossPercent = (viewAsset.initialValue === 0) ?
      0 : (viewAsset.currentValue - viewAsset.initialValue) / viewAsset.initialValue;

    this.assetsOverview.initialValue += viewAsset.initialValueBaseCurrency;
    this.assetsOverview.currentValue += viewAsset.currentValueBaseCurrency;
    if (viewAsset.asset.isDebt()) {
      this.assetsOverview.debtValue += viewAsset.currentValueBaseCurrency;
    }
  }


}
