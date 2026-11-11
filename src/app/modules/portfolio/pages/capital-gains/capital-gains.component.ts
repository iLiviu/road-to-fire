import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';

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
  grossTotalProfitLoss: number;
  grossTotalProfitLossPercent: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  totalFees: number;
  years: number[] = [];
  currentYear: number;
  salesGroupBy: SalesGroupBy = SalesGroupBy.Asset;
  yearAssetsCapitalGains: AssetCapitalGains[] = [];

  @ViewChild(MatSort) sort: MatSort;

  readonly displayedColumns: string[] = ['description', 'amount', 'buyDate', 'buyPrice', 'sellPrice', 'Fees', 'PL', 'PLPercent'];
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
    this.grossTotalProfitLoss = 0;
    this.grossTotalProfitLossPercent = 0;
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
          let fees = (sellTx.fee || 0);
          if (sellTx.grossBuyPrice > sellTx.buyPrice) {
            fees += (sellTx.grossBuyPrice - sellTx.buyPrice) * sellTx.amount;
          }
          const profitLoss = sellTx.rate * sellTx.amount - sellTx.buyPrice * sellTx.amount - fees;
          const rate: number = this.getCurrencyRate(sellTx.asset.currency);
          this.totalCost += sellTx.buyPrice * sellTx.amount * rate;
          this.totalProfitLoss += profitLoss * rate;
          this.totalFees += fees * rate;

          let assetCapitalGains: AssetCapitalGains;
          if (this.salesGroupBy === SalesGroupBy.Asset) {
            assetCapitalGains = assetCapitalGainsMap[sellTx.asset.description];
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
              assetCapitalGains.fees += fees;
              assetCapitalGains.profitLossPercent = (assetCapitalGains.sellPrice - assetCapitalGains.buyPrice -
                assetCapitalGains.fees / assetCapitalGains.amount) / assetCapitalGains.buyPrice;
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
              profitLossPercent: (sellTx.rate - sellTx.buyPrice - fees / sellTx.amount) / sellTx.buyPrice,
              fees: fees,
            };
            this.yearAssetsCapitalGains.push(assetCapitalGains);
            assetCapitalGainsMap[sellTx.asset.description] = assetCapitalGains;

          }
        }
      }

    } catch (err) {
      this.logger.error('Could not compute capital gains: ' + err, err);
    }
    this.sortData();
    this.totalProfitLossPercent = (this.totalCost > 0) ? this.totalProfitLoss / this.totalCost : 0;
    this.grossTotalProfitLoss = this.totalProfitLoss + this.totalFees;
    this.grossTotalProfitLossPercent = (this.totalCost > 0) ? this.grossTotalProfitLoss / this.totalCost : 0;

    this.dataLoaded = true;
    this.cdr.markForCheck();
  }

  /**
   * Sort the yearAssetsCapitalGains table by the selected column
   */
  sortData(sort?: Sort) {
    const active = sort ? sort.active : (this.sort?.active || 'description');
    const direction = sort ? sort.direction : (this.sort?.direction || 'asc');
    const isAsc = direction === 'asc';

    this.yearAssetsCapitalGains = [...this.yearAssetsCapitalGains].sort((a, b) => {
      let res = 0;
      switch (active) {
        case 'description':
          res = compare(a.description?.toLowerCase() || '', b.description?.toLowerCase() || '', isAsc);
          break;
        case 'amount':
          res = compare(a.amount || 0, b.amount || 0, isAsc);
          break;
        case 'buyDate': {
          const timeA = a.buyDate ? new Date(a.buyDate).getTime() : 0;
          const timeB = b.buyDate ? new Date(b.buyDate).getTime() : 0;
          res = compare(timeA, timeB, isAsc);
          break;
        }
        case 'buyPrice':
          res = compare(a.buyPrice || 0, b.buyPrice || 0, isAsc);
          break;
        case 'sellPrice':
          res = compare(a.sellPrice || 0, b.sellPrice || 0, isAsc);
          break;
        case 'Fees':
          res = compare(a.fees || 0, b.fees || 0, isAsc);
          break;
        case 'PL':
          res = compare(a.profitLoss || 0, b.profitLoss || 0, isAsc);
          break;
        case 'PLPercent':
          res = compare(a.profitLossPercent || 0, b.profitLossPercent || 0, isAsc);
          break;
        default:
          res = compare(a.description?.toLowerCase() || '', b.description?.toLowerCase() || '', isAsc);
      }
      if (res === 0) {
        res = (a.description?.toLowerCase() || '').localeCompare(b.description?.toLowerCase() || '');
      }
      return res;
    });

    this.cdr.markForCheck();
  }

  onYearChanged() {
    this.computeCapitalGains();
  }
}

/** Simple sort comparator */
function compare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : a > b ? 1 : 0) * (isAsc ? 1 : -1);
}
