import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { PortfolioService } from '../../services/portfolio.service';
import { PortfolioAccount } from '../../models/portfolio-account';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioPageComponent } from '../../components/portfolio-page/portfolio-page.component';
import {
  Asset, ASSET_TYPE_LABELS, AssetType
} from '../../models/asset';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { Dictionary, NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { AssetManagementService } from '../../services/asset-management.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { TradeableAsset } from '../../models/tradeable-asset';
import { DashboardGridTileEditorComponent } from '../../components/dashboard-grid-tile-editor/dashboard-grid-tile-editor.component';
import { DashboardGridTiles } from '../../models/dashboard-grid-tiles';
import { PortfolioHistoryEntry, PortfolioAssetValue, PortfolioHistory } from '../../models/portfolio-history';
import { getCurrencySymbol } from '@angular/common';
import {
  PortfolioHistoryAddComponent, PortfolioHistoryAddComponentInput
} from '../../components/portfolio-history-add/portfolio-history-add.component';
import { FloatingMath, binarySearch, DateUtils } from 'src/app/shared/util';
import { ASSET_REGION_LABELS, AssetRegionHelper } from '../../models/asset-region';

const MULTI_COL_GRID_ROW_HEIGHT = '2:1.6';
const SINGLE_COL_GRID_ROW_HEIGHT = '1:1.1';

/**
 * The order in which to place the assets in the portfolio history chart. We need
 * to place debt and cash first as these can have negative values.
 */
const HISTORY_ASSET_ORDER = [
  AssetType.Debt,
  AssetType.Cash,
  AssetType.Bond,
  AssetType.Commodity,
  AssetType.Cryptocurrency,
  AssetType.P2P,
  AssetType.RealEstate,
  AssetType.Stock];

interface ChartDataSets {
  label: string;
  data: number[];
  backgroundColor?: any;
  borderColor?: any;
  lineTension?: number;
}

interface ChartContext {
  labels: string[];
  data: number[];
}

interface MultiDatasetChartContext {
  labels: string[];
  data: ChartDataSets[];
}

interface RebalanceStep {
  percentage: number;
  value: number;
  assetName: string;
}

interface AssetRegionsValue {
  [id: number]: NumKeyDictionary<number>;
}

interface AssetValue {
  assetTitle: string;
  value: number;

}

interface AssetTypeAllocationMap {
  [id: number]: Dictionary<number>;
}

interface AssetCurrencyValueMap {
  [id: number]: Dictionary<number>;
}

const PERCENT_TOOLTIPS = {
  callbacks: {
    label: function (tooltipItem, data) {
      let label = '';
      if (data.labels[tooltipItem.index]) {
        label += data.labels[tooltipItem.index] + ': ';
      }
      label += data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + '%';
      return label;
    }
  }
};

interface DatasetEntries {
  empty: boolean;
  data: number[];
}

enum PortfolioHistoryDataField {
  Assets,
  UnrealizedPL,
}


/**
 * Component to display a page with a summary of the user's portfolio, including:
 * - percentage of goals completed
 * - portfolio allocation by assets
 * - portfolio history
 * - unrealized P/L history
 * - bonds geographic & currency allocation
 * - cryptocurrencies allocation
 * - commodities allocation
 * - cash allocation by currency
 * - debt allocation
 * - P2P geographic & currency allocation
 * - stocks geographic & currency allocation
 * - steps needed to be done to rebalance portfolio
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent extends PortfolioPageComponent implements OnInit {

  assetCurrenciesValue: AssetCurrencyValueMap = {};
  assetDescriptions: NumKeyDictionary<string>;
  assetRegions: AssetRegionsValue = {};
  assetsTotalValue: Dictionary<number> = {};
  assetsValue: number;
  liabilitiesValue: number;
  assetTypeAllocationMap: AssetTypeAllocationMap = {};
  assetsUnrealizedPL: Dictionary<number> = {};
  accounts: PortfolioAccount[];
  currenciesTotalValue: Dictionary<number> = {};
  currentDebtRatio: number;
  dataLoaded = false;
  debtAllocationPercentage: number;
  debtToAcquire: number;
  hasDebt: boolean;
  goals: ChartDataSets[] = [];
  goalsDatasets: ChartDataSets[] = [{ label: '1', data: [90, 10] }, { label: '2', data: [50, 50] }, { label: '2', data: [10, 90] }];
  gridVisibility: Dictionary<boolean>;
  mainGridRowHeight = MULTI_COL_GRID_ROW_HEIGHT;
  monthlySpendLimit: number;
  phTimeFrame = 'Max';
  plhTimeFrame = 'Max';
  portfolioUnrealizedPL: number;
  portfolioValue: number;
  rebalancingSetup: boolean;
  rebalancingSteps: RebalanceStep[] = [];
  assetAllocationChart: ChartContext = { data: [], labels: [] };
  bondCurrencyAllocationChart: ChartContext = { data: [], labels: [] };
  bondGeoAllocationChart: ChartContext = { data: [], labels: [] };
  cashAllocationChart: ChartContext = { data: [], labels: [] };
  commodityAllocationChart: ChartContext = { data: [], labels: [] };
  cryptoAllocationChart: ChartContext = { data: [], labels: [] };
  currencyAllocationChart: ChartContext = { data: [], labels: [] };
  debtAllocationChart: ChartContext = { data: [], labels: [] };
  p2pCurrencyAllocationChart: ChartContext = { data: [], labels: [] };
  p2pGeoAllocationChart: ChartContext = { data: [], labels: [] };
  stockCurrencyAllocationChart: ChartContext = { data: [], labels: [] };
  stockGeoAllocationChart: ChartContext = { data: [], labels: [] };
  portfolioHistoryChart: MultiDatasetChartContext = { data: [{ label: '', data: [] }], labels: [] };
  unrealizedPLHistoryChart: MultiDatasetChartContext = { data: [{ label: '', data: [] }], labels: [] };

  readonly assetTypeLabels = { ...ASSET_TYPE_LABELS };
  readonly goalChartColors: Array<any> = ['rgb(51, 160, 223)', 'rgba(214, 214, 214, 0.897)'];
  readonly goalChartLabels: string[] = ['Completed', 'Remaining'];
  readonly GridTiles = DashboardGridTiles;
  readonly legendOptions = {
    labels: {
      boxWidth: 12,
      padding: 6,
    }
  };
  readonly goalChartOptions = {
    legend: {
      display: false
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem, data) {
          let label = '';
          if (data.datasets[tooltipItem.datasetIndex].label) {
            label += data.datasets[tooltipItem.datasetIndex].label + ' ';
          }
          if (data.labels[tooltipItem.index]) {
            label += data.labels[tooltipItem.index] + ': ';
          }
          label += data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + '%';
          return label;
        }
      }
    },

    circumference: Math.PI,
    rotation: -Math.PI
  };
  pieChartOptions = {
    tooltips: PERCENT_TOOLTIPS,
    legend: this.legendOptions,
    maintainAspectRatio: false,
  };
  readonly portfolioHistoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: this.legendOptions,
    tooltips: {
      mode: 'index',
      callbacks: {
        label: (tooltipItem: any, data: any) => {
          let label = data.datasets[tooltipItem.datasetIndex].label || '';
          if (label) {
            label += ': ';
          }
          const value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
          label += this.baseCurrencySymbol + value.toLocaleString();
          return label;
        },
        footer: (tooltipItems: any, data: any) => {
          let totalValue = 0;
          for (const tooltipItem of tooltipItems) {
            totalValue += data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
          }
          return 'Total: ' + this.baseCurrencySymbol + totalValue.toLocaleString();
        }
      }
    },
    hover: {
      mode: 'index'
    },
    scales: {
      xAxes: [{
        type: 'time',
        distribution: 'linear',
        time: {
          tooltipFormat: 'MMM D YYYY',
        }
      }],
      yAxes: [{
        stacked: true,
        ticks: {
          callback: (value: any, index: any, values: any) => {
            return this.baseCurrencySymbol + value.toLocaleString();
          }
        }
      }]
    },
  };

  private allPortfolioHistory: PortfolioHistory;
  private refreshTimer: any;
  private baseCurrencySymbol: string;


  constructor(protected eventsService: EventsService, protected portfolioService: PortfolioService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected assetManagementService: AssetManagementService,
    protected storageService: StorageService, private cdr: ChangeDetectorRef, private route: ActivatedRoute) {
    super(logger, portfolioService, dialogService, eventsService, router, storageService);
    this.assetTypeLabels[AssetType.Cash] = 'Cash & Equivalents';
  }

  ngOnInit() {
    super.ngOnInit();
  }

  /**
   * Fired when the number of columns per row for the main grid changes.
   * The row height is adapted, depending on the number of columns.
   * @param colsNum new number of columns per row
   */
  gridColsChanged(colsNum: number) {
    if (colsNum === 1) {
      this.mainGridRowHeight = SINGLE_COL_GRID_ROW_HEIGHT;
    } else {
      this.mainGridRowHeight = MULTI_COL_GRID_ROW_HEIGHT;
    }
    this.cdr.markForCheck();
  }

  /**
   * Prompt user to manually add the value of the portfolio for a given date and store the result.
   */
  async addPortfolioHistory() {
    const history = await this.portfolioService.getPortfolioHistory();
    const data: PortfolioHistoryAddComponentInput = {
      baseCurrency: this.baseCurrency,
      portfolioHistoryEntries: history.entries,
    };
    const newEntry: PortfolioHistoryEntry = await this.dialogService.showAdaptableScreenModal(PortfolioHistoryAddComponent, data);
    if (newEntry) {
      // we keep the entries sorted by date, so we can do a binary search
      const insertIndex = binarySearch<PortfolioHistoryEntry>(history.entries, newEntry,
        (a: PortfolioHistoryEntry, b: PortfolioHistoryEntry) => {
          return DateUtils.compareDates(new Date(a.date), new Date(b.date));
        }, true);
      if (insertIndex >= history.entries.length) {
        history.entries.push(newEntry);
      } else if (history.entries[insertIndex].date === newEntry.date) {
        // replace entry
        history.entries[insertIndex] = newEntry;
      } else {
        // insert
        history.entries.splice(insertIndex, 0, newEntry);
      }
      // no need to wait for saving
      this.portfolioService.savePortfolioHistory(history);
      this.allPortfolioHistory = history;
      this.logger.info('Edited portfolio history entry!');
      this.displayPortfolioHistory();
    }
  }

  async changeDisplaySettings() {
    await this.dialogService.showModal(DashboardGridTileEditorComponent, this.gridVisibility, false);
    this.portfolioConfig.dashboardGridVisibility = this.gridVisibility;
    this.portfolioService.saveConfig(this.portfolioConfig);
    this.cdr.markForCheck();
  }

  /**
   * Fired when user changes the portfolio history chart time frame
   * @param newTimeFrame new chart display time frame
   */
  onPHTimeFrameChanged(newTimeFrame: string) {
    this.phTimeFrame = newTimeFrame;
    this.displayPortfolioHistory();
  }

  /**
   * Fired when user changes the unrealized P/L history chart time frame
   * @param newTimeFrame new chart display time frame
   */
  onPLHTimeFrameChanged(newTimeFrame: string) {
    this.plhTimeFrame = newTimeFrame;
    this.displayUnrealizedPLHistory();
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
   * Triggered when an update in an asset or account occurs, and data needs to be reloaded
   */
  private onDataUpdated() {
    // refresh data using a timer, so if multiple updates occur at once, only trigger reloading once
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      this.loadData();
    }, 1000);
  }

  /**
   * Calculate the completed percentage of each goal set.
   */
  private computeGoals() {
    this.goals = [];
    for (const goal of this.portfolioConfig.goals) {
      if (goal.value > 0) {
        const pDone = FloatingMath.round2Decimals(Math.min(100, this.portfolioValue / goal.value * 100));
        this.goals.push({
          label: goal.title,
          data: [pDone, FloatingMath.round2Decimals(100 - pDone)],
          backgroundColor: this.goalChartColors,
        });
      }
    }
  }

  /**
   * Return the percentage of a value from a total value
   */
  private toPercentage(value: number, totalValue: number) {
    return FloatingMath.round2Decimals(value / totalValue * 100);
  }

  /**
   * Takes a dictionary with numeric values and returns [key,value] tuple array sorted by absolute value in descending order
   * @param map a dictionary with numeric values
   */
  private sortNumDict(map: Dictionary<number> | NumKeyDictionary<number>): [string, number][] {
    const result: [string, number][] = [];
    for (const key of Object.keys(map)) {
      result.push([key, map[key]]);
    }
    result.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    return result;
  }

  /**
   * Returns the absolute sum of the values of a [key, value] tuple array
   * @param allocations a [string, number] tuple array
   */
  private getAbsTotalAllocationValue(allocations: [string, number][]) {
    let absPortfolioValue = 0;
    for (const [type, value] of allocations) {
      absPortfolioValue += Math.abs(value);
    }
    return absPortfolioValue;
  }

  /**
   * Build the chart data for the allocation percentage of each asset type out of the total assets value
   */
  private computeAssetAllocationData() {
    this.assetAllocationChart.data = [];
    this.assetAllocationChart.labels = [];
    let assetsTotalValue = this.assetsTotalValue;

    // do not count debt as an asset type, so remove it
    if (assetsTotalValue[AssetType.Debt] < 0) {
      assetsTotalValue = Object.assign({}, assetsTotalValue);
      delete assetsTotalValue[AssetType.Debt];
    }

    const assetAllocations = this.sortNumDict(assetsTotalValue);

    for (const [assetType, value] of assetAllocations) {
      this.assetAllocationChart.labels.push(this.assetTypeLabels[assetType]);
      this.assetAllocationChart.data.push(this.toPercentage(value, this.assetsValue));
    }
  }

  /**
   * Build the chart data for the allocation percentage of each currency out of the total portfolio value
   */
  private computeCurrenciesAllocationData() {
    this.currencyAllocationChart.data = [];
    this.currencyAllocationChart.labels = [];
    const currencyAllocations = this.sortNumDict(this.currenciesTotalValue);
    // we need the absolute portfolio value to better represent negative constituents
    const absPortfolioValue = this.getAbsTotalAllocationValue(currencyAllocations);
    for (const [currency, value] of currencyAllocations) {
      this.currencyAllocationChart.labels.push(currency);
      this.currencyAllocationChart.data.push(this.toPercentage(Math.abs(value), absPortfolioValue));
    }
  }

  /**
   * Build the chart data for the currency allocation of a specific asset type.
   * @param chart chart context
   * @param assetType asset type
   */
  private computeAssetCurrencyAllocationData(chart: ChartContext, assetType: AssetType) {
    chart.data = [];
    chart.labels = [];

    const assetCurrenciesValue = this.assetCurrenciesValue[assetType];
    if (assetCurrenciesValue) {
      const currencyAllocations = this.sortNumDict(assetCurrenciesValue);
      // we need the absolute portfolio value to better represent negative constituents
      const totalValue = this.getAbsTotalAllocationValue(currencyAllocations);

      for (const [currency, value] of currencyAllocations) {
        chart.labels.push(currency);
        chart.data.push(this.toPercentage(Math.abs(value), totalValue));
      }
    }
  }

  /**
   * Build the chart data for the allocation of a specific asset type.
   * @param chart chart context
   * @param assetType asset type
   */
  private computeAssetTypeAllocationData(chart: ChartContext, assetType: AssetType) {
    chart.data = [];
    chart.labels = [];
    if (this.assetTypeAllocationMap[assetType]) {
      const allocation = this.sortNumDict(this.assetTypeAllocationMap[assetType]);
      // we need the absolute portfolio value to better represent negative constituents
      const totalValue = this.getAbsTotalAllocationValue(allocation);

      for (const [assetId, value] of allocation) {
        chart.labels.push(this.assetDescriptions[assetId]);
        chart.data.push(this.toPercentage(Math.abs(value), totalValue));
      }
    }
  }

  /**
   * Build the chart data for the geographic allocation of a specific asset type
   * @param chart chart context
   * @param assetType asset type
   */
  private computeAssetGeoAllocationData(chart: ChartContext, assetType: AssetType) {
    chart.data = [];
    chart.labels = [];
    const regionsValues = this.assetRegions[assetType];
    if (regionsValues) {
      const regionArr = this.sortNumDict(regionsValues);
      for (const [regionId, value] of regionArr) {
        chart.labels.push(ASSET_REGION_LABELS[regionId]);
        chart.data.push(this.toPercentage(value, this.assetsTotalValue[assetType]));
      }
    }
  }

  /**
   * Go through entire asset allocation, and compute what assets need to be
   * bought/sold in order to have the desired portfolio allocation, and also
   * compute the current debt ratio and the amount required to get to
   * desired ratio.
   */
  private computeRebalanceSteps() {
    this.rebalancingSteps = [];
    if (!this.assetsValue) {
      return;
    }

    const desiredAllocations = {};
    const assetsTotalValue = Object.assign({}, this.assetsTotalValue);
    for (const allocation of this.portfolioConfig.portfolioAllocation) {
      desiredAllocations[allocation.assetType] = allocation.allocation;
      if (!assetsTotalValue[allocation.assetType]) {
        assetsTotalValue[allocation.assetType] = 0;
      }
    }
    for (const assetType in assetsTotalValue) {
      if (!Asset.isCashLike(+assetType) && !Asset.isDebt(+assetType)) { // we can't buy/sell cash
        const totalValue = Math.abs(assetsTotalValue[assetType]);
        const assetPercentageValue = totalValue / this.assetsValue;
        const dif = (desiredAllocations[assetType] || 0) - assetPercentageValue;
        if (dif !== 0) { // only add assets that need rebalancing
          const transactionValue = dif * this.assetsValue;
          this.rebalancingSteps.push({
            assetName: this.assetTypeLabels[assetType],
            percentage: transactionValue / totalValue,
            value: transactionValue
          });
        }
      }
    }
    this.rebalancingSteps.sort((a, b) => {
      return a.value < b.value ? -1 : 1;
    });

    // debt allocation
    const desiredDebt = this.portfolioConfig.loanToValueRatio * this.assetsValue;
    this.debtToAcquire = desiredDebt + this.liabilitiesValue;
    this.currentDebtRatio = Math.abs(this.liabilitiesValue) / this.assetsValue;
    if (this.debtToAcquire > 0) {
      // if we get into additional debt, assume the balance goes into the portfolio, increasing it's value
      // so we need to adjust the available debt accordingly
      this.debtToAcquire = this.debtToAcquire / (1 - this.portfolioConfig.loanToValueRatio);
    }
  }


  /**
   * Compute all stats required for the dashboard page
   */
  private async computeStats() {
    this.assetsValue = 0;
    this.liabilitiesValue = 0;
    this.portfolioValue = 0;
    this.portfolioUnrealizedPL = 0;
    this.requiredFXPairs = {};
    this.assetsTotalValue = {};
    this.currenciesTotalValue = {};
    this.assetCurrenciesValue = {};
    this.assetRegions = {};
    this.assetTypeAllocationMap = {};
    this.assetDescriptions = {};
    this.assetsUnrealizedPL = {};

    // check for any foreign currencies and queue them for quote update
    for (const account of this.accounts) {
      for (const asset of account.assets) {
        this.getCurrencyRate(asset.currency);
      }
    }
    await this.getForexRates();

    for (const account of this.accounts) {
      for (const asset of account.assets) {
        let assetIdKey = asset.description.toUpperCase();
        let assetDescription = asset.description;
        const rate: number = this.getCurrencyRate(asset.currency);
        const currentValue = asset.getCurrentValue();
        const broadAssetType = asset.getBroadAssetType();
        if (Asset.isCashLike(broadAssetType)) {
          assetIdKey = asset.currency;
          assetDescription = asset.currency;
        }

        if (asset.isTradeable()) {
          const tradeableAsset = <TradeableAsset><Asset>asset;
          const profitLoss = currentValue - tradeableAsset.getBuyCost();
          if (tradeableAsset.symbol) {
            const symbolParts = tradeableAsset.parseSymbol();
            assetIdKey = symbolParts.shortSymbol;
          }

          const assetBaseCurrencyProfitLoss = profitLoss * rate;
          this.portfolioUnrealizedPL += assetBaseCurrencyProfitLoss;
          if (!this.assetsUnrealizedPL[broadAssetType]) {
            this.assetsUnrealizedPL[broadAssetType] = 0;
          }
          this.assetsUnrealizedPL[broadAssetType] += assetBaseCurrencyProfitLoss;
        }
        const assetBaseCurrencyValue = currentValue * rate;
        this.portfolioValue += assetBaseCurrencyValue;

        if (assetBaseCurrencyValue > 0) {
          this.assetsValue += assetBaseCurrencyValue;

          if (!this.currenciesTotalValue[asset.currency]) {
            this.currenciesTotalValue[asset.currency] = 0;
          }
          this.currenciesTotalValue[asset.currency] += assetBaseCurrencyValue;

          if (!this.assetsTotalValue[broadAssetType]) {
            this.assetsTotalValue[broadAssetType] = 0;
          }
          this.assetsTotalValue[broadAssetType] += assetBaseCurrencyValue;

          if (!this.assetCurrenciesValue[broadAssetType]) {
            this.assetCurrenciesValue[broadAssetType] = {};
          }
          const assetCurrenciesValue = this.assetCurrenciesValue[broadAssetType];
          if (!assetCurrenciesValue[asset.currency]) {
            assetCurrenciesValue[asset.currency] = 0;
          }
          assetCurrenciesValue[asset.currency] += assetBaseCurrencyValue;


          // debt should never have a positive balance, but if it happens (some operations lead to that)
          // substract the positive balance from liabilities value
          if (asset.isDebt()) {
            this.liabilitiesValue += assetBaseCurrencyValue;
          }
        } else {
          this.liabilitiesValue += assetBaseCurrencyValue;
        }

        // total allocation for each asset grouped by asset type
        let assetTypeAllocation = this.assetTypeAllocationMap[broadAssetType];
        if (!assetTypeAllocation) {
          assetTypeAllocation = {};
          this.assetTypeAllocationMap[broadAssetType] = assetTypeAllocation;
        }
        if (!assetTypeAllocation[assetIdKey]) {
          assetTypeAllocation[assetIdKey] = 0;
          this.assetDescriptions[assetIdKey] = assetDescription;
        }
        assetTypeAllocation[assetIdKey] += assetBaseCurrencyValue;

        // tradeable assets can have a geographical region set, so group by that too
        if (asset.isTradeable()) {
          const regionWeights = (<TradeableAsset>asset).getRegionWeights();

          let assetRegionValues: NumKeyDictionary<number> = this.assetRegions[broadAssetType];
          if (!assetRegionValues) {
            assetRegionValues = {};
            this.assetRegions[broadAssetType] = assetRegionValues;
          }
          for (const regWeight of regionWeights) {
            const regionId = AssetRegionHelper.getClassificationRegion(regWeight.region);
            if (!assetRegionValues[regionId]) {
              assetRegionValues[regionId] = 0;
            }
            assetRegionValues[regionId] += assetBaseCurrencyValue * regWeight.weight;
          }
        }
      }
    }

    this.monthlySpendLimit = this.portfolioConfig.withdrawalRate * this.portfolioValue / 12;
    this.hasDebt = this.liabilitiesValue < 0;
    // debt "asset" needs to hold total liabilities (including cash debt)
    if (this.liabilitiesValue) {
      this.assetsTotalValue[AssetType.Debt] = this.liabilitiesValue;
    } else {
      // no liabilities, avoid displaying empty category
      delete this.assetsTotalValue[AssetType.Debt];
    }

    this.computeGoals();
    this.computeAssetAllocationData();
    this.computeCurrenciesAllocationData();
    this.computeAssetCurrencyAllocationData(this.stockCurrencyAllocationChart, AssetType.Stock);
    this.computeAssetCurrencyAllocationData(this.bondCurrencyAllocationChart, AssetType.Bond);
    this.computeAssetCurrencyAllocationData(this.p2pCurrencyAllocationChart, AssetType.P2P);
    this.computeAssetGeoAllocationData(this.stockGeoAllocationChart, AssetType.Stock);
    this.computeAssetGeoAllocationData(this.bondGeoAllocationChart, AssetType.Bond);
    this.computeAssetGeoAllocationData(this.p2pGeoAllocationChart, AssetType.P2P);
    this.computeAssetTypeAllocationData(this.cryptoAllocationChart, AssetType.Cryptocurrency);
    this.computeAssetTypeAllocationData(this.commodityAllocationChart, AssetType.Commodity);
    this.computeAssetTypeAllocationData(this.debtAllocationChart, AssetType.Debt);
    this.computeAssetCurrencyAllocationData(this.cashAllocationChart, AssetType.Cash);
    this.computeRebalanceSteps();
    await this.computePortfolioHistory();
    this.displayPortfolioHistory();
    this.displayUnrealizedPLHistory();
  }

  onDataLoaded() {
    this.dataLoaded = true;
    this.cdr.markForCheck();
  }

  /**
   * Compute and store today's current portfolio value in portfolio history data.
   * If we already have today's portfolio value, only update if value has changed.
   */
  private async computePortfolioHistory() {
    let history = await this.portfolioService.getPortfolioHistory();
    let updateEntries = true;
    let replaceToday = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (history) {
      // check if we need to add today's portfolio value
      if (history.entries.length > 0) {
        const latestEntry = history.entries[history.entries.length - 1];
        const entryDate = new Date(latestEntry.date);
        entryDate.setHours(0, 0, 0, 0);
        if (today.getTime() === entryDate.getTime()) {

          if (latestEntry.value !== this.portfolioValue || latestEntry.unrealizedPL !== this.portfolioUnrealizedPL) {
            replaceToday = true;
          } else {
            // same portfolio data for today, no need for update
            updateEntries = false;
          }
        }
      }
    } else {
      history = { entries: [] };
    }

    if (updateEntries) {
      // create new entry for the current day and add all asset types and their total values
      const entry: PortfolioHistoryEntry = {
        date: today.toISOString(),
        value: this.portfolioValue,
        unrealizedPL: this.portfolioUnrealizedPL,
        assets: [],
        assetsUnrealizedPL: [],
      };

      for (const assetType of Object.keys(this.assetsTotalValue)) {
        const value = this.assetsTotalValue[assetType];
        const asset: PortfolioAssetValue = {
          type: +assetType,
          value: value,
        };
        entry.assets.push(asset);
      }
      for (const assetType of Object.keys(this.assetsUnrealizedPL)) {
        const value = this.assetsUnrealizedPL[assetType];
        const asset: PortfolioAssetValue = {
          type: +assetType,
          value: value,
        };
        entry.assetsUnrealizedPL.push(asset);
      }

      if (replaceToday) {
        history.entries[history.entries.length - 1] = entry;
      } else {
        history.entries.push(entry);
      }

      // no need to wait for saving
      this.portfolioService.savePortfolioHistory(history);
    }
    this.allPortfolioHistory = history;
  }

  /**
   * Update the portfolio history chart data
   */
  private displayPortfolioHistory() {
    this.updateHistoryChart(this.allPortfolioHistory, this.phTimeFrame, this.portfolioHistoryChart, PortfolioHistoryDataField.Assets);
  }

  /**
   * Update the unrealized P/L history chart data
   */
  private displayUnrealizedPLHistory() {
    this.updateHistoryChart(this.allPortfolioHistory, this.plhTimeFrame, this.unrealizedPLHistoryChart,
      PortfolioHistoryDataField.UnrealizedPL);
  }

  /**
   * Update the data for a  history type chart
   *
   * @param history portfolio history data
   * @param timeFrame time frame to display data for
   * @param chart chart to update data for
   */
  private updateHistoryChart(history: PortfolioHistory, timeFrame: string, chart: MultiDatasetChartContext,
    dataField: PortfolioHistoryDataField) {

    const chartLabels: string[] = [];
    chart.data = [];
    const dataSets: NumKeyDictionary<DatasetEntries> = {};
    for (const assetType of Object.keys(this.assetTypeLabels)) {
      dataSets[assetType] = {
        empty: true,
        data: [],
      };
    }

    let minDate: Date;
    switch (timeFrame) {
      case 'YTD':
        minDate = new Date();
        minDate.setMonth(0, 1);
        break;
      case '1Y':
        minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 1);
        break;
      case '5Y':
        minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 5);
        break;
      case '10Y':
        minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 10);
        break;
    }
    if (minDate) {
      minDate.setHours(0, 0, 0, 0);
    }

    for (const entry of history.entries) {
      const entryDate = new Date(entry.date);
      let assets: PortfolioAssetValue[];
      if (dataField === PortfolioHistoryDataField.Assets) {
        assets = entry.assets;
      } else {
        assets = entry.assetsUnrealizedPL;
      }
      // skip dates not in our time frame or without any data
      if (assets && (!minDate || minDate.getTime() <= entryDate.getTime())) {
        for (const assetType of Object.keys(this.assetTypeLabels)) {
          dataSets[assetType].data.push(0); // initialize all asset portfolio values with 0 for the current entry day
        }
        for (const asset of assets) {
          dataSets[asset.type].empty = false; // we have data for this asset so we need to display it
          const data = dataSets[asset.type].data;
          data[data.length - 1] = asset.value;
        }
        const dateStr = entryDate.toISOString();
        chartLabels.push(dateStr);
      }
    }

    for (const assetType of HISTORY_ASSET_ORDER) {
      if (!dataSets[assetType].empty) {
        chart.data.push({
          data: dataSets[assetType].data,
          label: this.assetTypeLabels[assetType],
          lineTension: 0,
        });
      }
    }

    chart.labels = chartLabels;
    this.cdr.markForCheck();
  }

  /**
   * Loads the portfolio data and computes the stats
   */
  private async loadData() {
    try {
      const accounts = await this.portfolioService.getAccounts();
      this.accounts = accounts;
      await this.computeStats();
      this.onDataLoaded();

      if (accounts.length === 0) {
        const canAdd = await this.dialogService.confirm(`Looks like you don't have any accounts. Would you like to add one now?`);
        if (canAdd) {
          this.router.navigate(['../accounts/new'], { relativeTo: this.route });
        }
      }
    } catch (err) {
      this.onDataLoaded();
      this.logger.error('Could not retrieve accounts!', err);
    }
  }

  protected onConfigLoaded() {
    super.onConfigLoaded();
    this.baseCurrency = this.portfolioConfig.baseCurrency;
    this.baseCurrencySymbol = getCurrencySymbol(this.baseCurrency, 'wide');
    this.rebalancingSetup = this.portfolioConfig.portfolioAllocation.length > 0;
    this.gridVisibility = this.portfolioConfig.dashboardGridVisibility;
    if (!this.gridVisibility) {
      this.gridVisibility = {};
    }
    // always display new tiles that didn't exist in earlier save
    for (const tile of Object.keys(DashboardGridTiles)) {
      if (this.gridVisibility[tile] === undefined) {
        this.gridVisibility[tile] = true;
      }
    }
    this.loadData();
  }
}
