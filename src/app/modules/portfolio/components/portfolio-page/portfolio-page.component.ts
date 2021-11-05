import { OnInit, OnDestroy, Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { Dictionary } from 'src/app/shared/models/dictionary';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioService } from '../../services/portfolio.service';
import { AppEvent, AppEventType, EventsService } from 'src/app/core/services/events.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { PortfolioConfig } from '../../models/portfolio-config';
import { StorageService } from 'src/app/core/services/storage.service';

/**
 * Base component inherited by components that display an entire page
 *
 */
@Injectable()
export class PortfolioPageComponent implements OnInit, OnDestroy {

  baseCurrency: string;
  portfolioConfig: PortfolioConfig;

  protected forexRates: Dictionary<number> = {};

  private eventSubscription: Subscription;
  private configLoaded: boolean;

  constructor(protected logger: LoggerService, protected portfolioService: PortfolioService,
    protected dialogService: DialogsService, protected eventsService: EventsService, protected router: Router,
    protected storageService: StorageService) {

  }


  ngOnInit() {
    this.eventSubscription = this.eventsService.events$
      .subscribe(event => {
        this.handleEvents(event);
      });
    this.readConfig();
  }

  /**
   * Read portfolio configuration and notify when the configuration
   * was loaded
   */
  async readConfig() {
    this.configLoaded = false;
    try {
      await this.doReadConfig();
      this.onConfigLoaded();
      this.configLoaded = true;
    } catch (err) {
      this.logger.error('Could not read config!', err);
    }
  }

  /**
   * Perform actual action to read config
   */
  protected async doReadConfig() {
    const cfg = await this.portfolioService.readConfig();
    this.portfolioConfig = cfg;
  }

  ngOnDestroy(): void {
    this.eventSubscription.unsubscribe();
  }


  /**
   * Actions to take after the portfolio config has been loaded
   */
  protected onConfigLoaded() {
    this.baseCurrency = this.portfolioConfig.baseCurrency;
    this.eventsService.portfolioModuleLoaded();
  }

  protected isConfigLoaded() {
    return this.configLoaded;
  }

  /**
   * Listen for events and handle the ones specific to this component
   * @param event event that was triggered
   */
  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.CONFIG_REMOTE_UPDATE:
        if (event.data === this.portfolioService.storage.getId()) {
          this.dialogService.confirm('Config changed remotely. Do you want to reload the page to apply changes?')
            .then((response) => {
              if (response) {
                this.readConfig();
              }
            });
        }
        break;
    }
  }

  /**
   * Get the conversion rate between a currency and base currency.
   * If forex rate is not available, throw an error
   * @param currency currency to get the rate for
   */
  protected getCurrencyRate(currency: string): number {
    let rate = 1;
    if (currency !== this.baseCurrency) {
      const currencyPair: string = currency + this.baseCurrency;
      if (this.forexRates[currencyPair]) {
        // we already have the forex rates
        rate = this.forexRates[currencyPair];
      } else {
        throw new Error('Forex rate not available for currency: ' + currency);
      }
    }
    return rate;
  }

  /**
   * Update the exchange rates for a list of currencies and store the result for
   * later use
   */
  protected async updateForexRates(currencies: string[]): Promise<boolean> {
    const fxPairs: Dictionary<boolean> = {};
    for (const currency of currencies) {
      if (currency !== this.baseCurrency) {
        fxPairs[currency + this.baseCurrency] = true;
      }
    }
    const requiredFXPairs: string[] = Object.keys(fxPairs);
    if (requiredFXPairs.length > 0) {
      try {
        const rates = await this.portfolioService.getForexRates(requiredFXPairs);
        for (const quote of rates) {
          this.forexRates[quote.symbol] = quote.price;
        }
        return true;
      } catch (e) {
        const errMsg = 'An error occurred while retrieving forex rates!';
        this.logger.error(errMsg, e);
        return Promise.reject(errMsg);
      }
    }
    return false;
  }
}
