import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';

import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioService } from '../../services/portfolio.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { ManualQuoteComponent } from '../manual-quote/manual-quote.component';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { EventsService, AppEventType, AppEvent } from 'src/app/core/services/events.service';
import { TradeableAsset } from '../../models/tradeable-asset';
import { APP_CONSTS } from 'src/app/config/app.constants';
import { AccountAsset } from '../../models/account-asset';


/**
 * Component to display a "refresh" button, allowing user to request a refresh for the quotes of his assets.
*/
@Component({
  selector: 'app-refresh-quotes-button',
  templateUrl: './refresh-quotes-button.component.html',
  styleUrls: ['./refresh-quotes-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('rotatedState', [
      state('default', style({ transform: 'rotate(-360000deg)' })),
      state('rotated', style({ transform: 'rotate(0)' })),
      transition('default => rotated', animate('500000ms'))
    ])
  ]

})
export class RefreshQuotesButtonComponent implements OnInit, OnDestroy {

  assetPricesUpdating: boolean;
  buttonState = 'default';

  private eventSubscription: Subscription;

  constructor(private logger: LoggerService, private portfolioService: PortfolioService, private dialogService: DialogsService,
    private eventsService: EventsService, private cdr: ChangeDetectorRef) { }


  ngOnInit() {
    this.eventSubscription = this.eventsService.events$.subscribe((event) => {
      this.handleEvents(event);
    });
  }

  /**
   * Listen for "quotes updated" events
   * @param event event that was triggered
   */
  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.QUOTES_UPDATE_STARTED:
        this.assetPricesUpdating = true;
        this.rotateButton();
        this.cdr.markForCheck();
        break;
      case AppEventType.QUOTES_UPDATED:
        this.resetRotation();
        this.assetPricesUpdating = false;
        this.cdr.markForCheck();
        break;
    }
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }


  resetRotation() {
    this.buttonState = 'default';
  }

  rotateButton() {
    this.buttonState = 'rotated';
  }

  /**
   * Automatically get quotes for user's assets. For assets for which quotes couldn't be retrieved automatically,
   * offer the user the option to enter them manually.
   */
  async refreshAssetPrices() {

    try {
      const allAssetsUpdated = await this.portfolioService.updateAssetQuotes();
      this.logger.info('Quotes updated!');
      if (!allAssetsUpdated) {
        const response = await this.dialogService.confirm(`Could not get quotes for all assets.
        \nWould you like to manually update the quotes for the remaining assets?`);

        if (response) {
          await this.updatePricesManually();
        }
      }
    } catch (err) {
      this.logger.error('Could not update asset quotes: ' + err.message, err);
    }
  }

  /**
   * Request user to manually enter new quotes for assets that couldn't be updated automatically
   */
  async updatePricesManually() {
    const assets = await this.getNonUpdatedTradeableAssets();

    const quotesUpdated = await this.dialogService.showModal(ManualQuoteComponent, assets);
    if (quotesUpdated) {
      const promises = [];
      for (let i = 0; i < assets.length; i++) {
        const accountAsset = assets[i];
        const promise = this.portfolioService.updateAsset(accountAsset.asset, accountAsset.account);
        promises.push(promise);
      }
      await Promise.all(promises);

      this.logger.info('Quotes updated manually!');
    }
  }

  /**
  * Go through all accounts, identify assets that didn't have their quotes updated and return them
  */
  private async getNonUpdatedTradeableAssets() {
    const assets: AccountAsset[] = [];
    const accounts = await this.portfolioService.getAccounts();
    for (const account of accounts) {
      for (const asset of account.assets) {

        if (asset.isTradeable()) {
          let quoteNeeded = false;

          const tradeableAsset = <TradeableAsset>asset;
          if (tradeableAsset.lastQuoteUpdate) {
            const timePassed = (new Date().getTime() - new Date(tradeableAsset.lastQuoteUpdate).getTime()) / 1000;
            if (timePassed >= APP_CONSTS.QUOTE_CACHE_TIMEOUT) {
              quoteNeeded = true;
            }
          } else {
            quoteNeeded = true;
          }
          if (quoteNeeded) {

            assets.push({
              account: account,
              asset: tradeableAsset,
            });
          }
        }
      }
    }
    return assets;
  }
}
