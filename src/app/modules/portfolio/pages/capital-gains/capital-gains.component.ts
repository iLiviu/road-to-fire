import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { PortfolioPageComponent } from '../../components/portfolio-page/portfolio-page.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioService } from '../../services/portfolio.service';
import { EventsService } from 'src/app/core/services/events.service';
import { Transaction } from '../../models/transaction';
import { StorageService } from 'src/app/core/services/storage.service';
import { TradeTransaction } from '../../models/trade-transaction';
import { SellTransaction } from '../../models/sell-transaction';
import { Dictionary } from 'src/app/shared/models/dictionary';

enum SalesGroupBy {
  None,
  Asset,
}

interface AssetCapitalGains {
  assetId: number;
  description: string;
  amount: number;
  buyPrice: number;
  buyDate: Date;
  sellPrice: number;
  profitLoss: number;
  profitLossPercent: number;
  currency: string;
  fees: number;
}

/**
 * Component to display a UI for viewing trades that were closed in a user selected year, and
 * calculate the capital gains/losses for them.
 */
@Component({
  selector: 'app-capital-gains',
  templateUrl: './capital-gains.component.html',
  styleUrls: ['./capital-gains.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CapitalGainsComponent extends PortfolioPageComponent implements OnInit {

  dataLoaded = false;
  netTotalProfitLoss: number;
  netTotalProfitLossPercent: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  totalFees: number;
  years: number[] = [];
  currentYear: number;
  salesGroupBy: SalesGroupBy = SalesGroupBy.Asset;
  yearAssetsCapitalGains: AssetCapitalGains[] = [];

  readonly displayedColumns: string[] = ['description', 'amount', 'buyDate', 'buyPrice', 'sellPrice', 'PL', 'PLPercent', 'Fees'];
  readonly SalesGroupBy = SalesGroupBy;

  private transactions: Transaction[] = [];


  constructor(protected logger: LoggerService, protected portfolioService: PortfolioService,
    protected dialogService: DialogsService, protected eventsService: EventsService, protected router: Router,
    protected storageService: StorageService, private cdr: ChangeDetectorRef) {
    super(logger, portfolioService, dialogService, eventsService, router, storageService);
  }

  populateYears() {
    this.years = [];
    this.currentYear = new Date().getFullYear();
    for (let i = this.currentYear; i >= this.currentYear - 10; i--) {
      this.years.push(i);
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.populateYears();
  }

  async onConfigLoaded() {
    if (!this.portfolioConfig.hideCapitalGainsWarning) {
      const dontShowAgain = await this.dialogService.warn(`Do not use this data to calculate your actual taxes.\n` +
        `The data displayed here may be inaccurate, incomplete or may not apply to your legislation!`, '', true);
      if (dontShowAgain) {
        this.portfolioConfig.hideCapitalGainsWarning = true;
        this.portfolioService.saveConfig(this.portfolioConfig);
      }
    }
    super.onConfigLoaded();
    try {
      this.transactions = await this.portfolioService.getTransactions();
      this.computeCapitalGains();
    } catch (err) {
      this.logger.error('Could not compute capital gains: ' + err, err);
    }
  }


  /**
   * Find all trades that were closed in a year and calculate capital gains/losses for them.
   * Trades in foreign currencies are converted to base currency at current forex rate.
   */
  async computeCapitalGains() {
    const assetCapitalGainsMap: Dictionary<AssetCapitalGains> = {};
    this.dataLoaded = false;
    this.yearAssetsCapitalGains = [];
    this.totalProfitLoss = 0;
    this.totalProfitLossPercent = 0;
    this.netTotalProfitLoss = 0;
    this.netTotalProfitLossPercent = 0;
    this.totalCost = 0;
    this.totalFees = 0;

    // check for any foreign currencies and get their quotes
    const requiredCurrencies: string[] = [];
    for (const tx of this.transactions) {
      const txDate = new Date(tx.date);
      if (tx.isSellTrade() && txDate.getFullYear() === this.currentYear) {
        const sellTx: TradeTransaction = <TradeTransaction>tx;
        requiredCurrencies.push(sellTx.asset.currency);
      }
    }
    await this.updateForexRates(requiredCurrencies);

    try {
      for (const tx of this.transactions) {
        const txDate = new Date(tx.date);
        if (tx.isSellTrade() && txDate.getFullYear() === this.currentYear) {
          const sellTx = <SellTransaction>tx;
          const profitLoss = sellTx.rate * sellTx.amount - sellTx.buyPrice * sellTx.amount;
          let fees = (sellTx.fee || 0);
          if (sellTx.grossBuyPrice > sellTx.buyPrice) {
             fees += (sellTx.grossBuyPrice - sellTx.buyPrice) * sellTx.amount;
          }
          const rate: number = this.getCurrencyRate(sellTx.asset.currency);
          this.totalCost += sellTx.buyPrice * sellTx.amount * rate;
          this.totalProfitLoss += profitLoss * rate;
          this.totalFees += fees * rate;

          let assetCapitalGains: AssetCapitalGains;
          if (this.salesGroupBy === SalesGroupBy.Asset) {
            assetCapitalGains = assetCapitalGainsMap[sellTx.asset.id];
            if (assetCapitalGains) {
              if (new Date(sellTx.buyDate).toDateString() !== new Date(assetCapitalGains.buyDate).toDateString()) {
                // if dates are different, do not show any date
                assetCapitalGains.buyDate = null;
              }
              assetCapitalGains.buyPrice = (assetCapitalGains.amount * assetCapitalGains.buyPrice + sellTx.amount * sellTx.buyPrice) /
                (assetCapitalGains.amount + sellTx.amount);
              assetCapitalGains.sellPrice = (assetCapitalGains.amount * assetCapitalGains.sellPrice + sellTx.amount * sellTx.rate) /
                (assetCapitalGains.amount + sellTx.amount);

              assetCapitalGains.amount += sellTx.amount;
              assetCapitalGains.profitLoss += profitLoss;
              assetCapitalGains.profitLossPercent = (assetCapitalGains.sellPrice - assetCapitalGains.buyPrice) / assetCapitalGains.buyPrice;
              assetCapitalGains.fees += fees;
            }
          }

          if (!assetCapitalGains) {
            assetCapitalGains = {
              assetId: sellTx.asset.id,
              currency: sellTx.asset.currency,
              description: sellTx.asset.description,
              amount: sellTx.amount,
              buyDate: new Date(sellTx.buyDate),
              buyPrice: sellTx.buyPrice,
              sellPrice: sellTx.rate,
              profitLoss: profitLoss,
              profitLossPercent: (sellTx.rate - sellTx.buyPrice) / sellTx.buyPrice,
              fees: fees,
            };
            this.yearAssetsCapitalGains.push(assetCapitalGains);
            assetCapitalGainsMap[sellTx.asset.id] = assetCapitalGains;

          }
        }
      }

    } catch (err) {
      this.logger.error('Could not compute capital gains: ' + err, err);
    }
    this.yearAssetsCapitalGains.sort((a, b) => a.description.toLowerCase() < b.description.toLowerCase() ? -1 : 1);
    this.totalProfitLossPercent = (this.totalCost > 0) ? this.totalProfitLoss / this.totalCost : 0;
    this.netTotalProfitLoss = this.totalProfitLoss - this.totalFees;
    this.netTotalProfitLossPercent = (this.totalCost > 0) ? this.netTotalProfitLoss / this.totalCost : 0;

    this.dataLoaded = true;
    this.cdr.markForCheck();
  }

  onYearChanged() {
    this.computeCapitalGains();
  }
}
