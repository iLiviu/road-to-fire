import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import 'chartjs-adapter-moment';

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
import { Label } from '../../models/label';
import { LabelCategory } from '../../models/label-category';
import { StorageService } from 'src/app/core/services/storage.service';
import { TradeableAsset } from '../../models/tradeable-asset';
import { DashboardGridTileEditorComponent } from '../../components/dashboard-grid-tile-editor/dashboard-grid-tile-editor.component';
import { DashboardGridTiles, LABEL_CATEGORY_TILE_PREFIX } from '../../models/dashboard-grid-tiles';
import { PortfolioHistoryEntry, PortfolioAssetValue, PortfolioHistory, PortfolioHistoryDataField } from '../../models/portfolio-history';
import { getCurrencySymbol } from '@angular/common';
import {
  PortfolioHistoryAddComponent, PortfolioHistoryAddComponentInput
} from '../../components/portfolio-history-add/portfolio-history-add.component';
import { FloatingMath, binarySearch, DateUtils } from 'src/app/shared/util';
import { ASSET_REGION_LABELS, AssetRegionHelper } from '../../models/asset-region';
import moment from 'moment';
import { ThemeService } from 'ng2-charts';
import { ChartOptions, TooltipItem } from 'chart.js';
import { APP_THEMES, ConfigService } from 'src/app/core/services/config.service';
import { TransactionType } from '../../models/transaction';
import { debounce } from 'src/app/shared/decorators/debounce.decorator';
import { BenchmarkService } from '../../services/benchmark.service';
import { BENCHMARK_CURRENCIES, BenchmarkDefinition, TWRDataPoint } from '../../models/benchmark';

const MULTI_COL_GRID_ROW_HEIGHT = '2:1.6';
const SINGLE_COL_GRID_ROW_HEIGHT = '1:1.1';

const LOCALE_NUMBER_OPTIONS = {
  maximumFractionDigits: 2
};

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
  AssetType.Stock,
  AssetType.Forex];

export interface BenchmarkAnnualizedStat {
  id: string;
  name: string;
  twr: number;
}

interface ChartDataSet {
  label?: string;
  data: number[];
  backgroundColor?: any;
  borderColor?: any;
  borderWidth?: number;
  lineTension?: number;
}

interface ChartContext {
  labels: string[];
  datasets: ChartDataSet[];
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

interface DatasetEntries {
  empty: boolean;
  data: number[];
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
  dataLoading = false;
  debtAllocationPercentage: number;
  debtToAcquire: number;
  hasDebt: boolean;
  goals: ChartDataSet[] = [];
  goalsDatasets: ChartDataSet[] = [];
  gridVisibility: Dictionary<boolean>;
  mainGridRowHeight = MULTI_COL_GRID_ROW_HEIGHT;
  monthlySpendLimit: number;
  phTimeFrame = 'Max';
  plhTimeFrame = 'Max';
  portfolioUnrealizedPL: number;
  portfolioValue: number;
  rebalancingSetup: boolean;
  rebalancingSteps: RebalanceStep[] = [];
  assetAllocationChart: ChartContext = { datasets: [], labels: [] };
  bondAllocationChart: ChartContext = { datasets: [], labels: [] };
  bondCurrencyAllocationChart: ChartContext = { datasets: [], labels: [] };
  bondGeoAllocationChart: ChartContext = { datasets: [], labels: [] };
  cashAllocationChart: ChartContext = { datasets: [], labels: [] };
  commodityAllocationChart: ChartContext = { datasets: [], labels: [] };
  cryptoAllocationChart: ChartContext = { datasets: [], labels: [] };
  currencyAllocationChart: ChartContext = { datasets: [], labels: [] };
  debtAllocationChart: ChartContext = { datasets: [], labels: [] };
  p2pAllocationChart: ChartContext = { datasets: [], labels: [] };
  p2pCurrencyAllocationChart: ChartContext = { datasets: [], labels: [] };
  p2pGeoAllocationChart: ChartContext = { datasets: [], labels: [] };
  stockAllocationChart: ChartContext = { datasets: [], labels: [] };
  topPortfolioHoldingsChart: ChartContext = { datasets: [], labels: [] };
  stockCurrencyAllocationChart: ChartContext = { datasets: [], labels: [] };
  stockGeoAllocationChart: ChartContext = { datasets: [], labels: [] };
  portfolioHistoryChart: ChartContext = { datasets: [{ label: '', data: [] }], labels: [] };
  unrealizedPLHistoryChart: ChartContext = { datasets: [{ label: '', data: [] }], labels: [] };
  benchmarkChart: ChartContext = { datasets: [], labels: [] };
  benchmarkTimeFrame = 'Max';
  availableBenchmarks: BenchmarkDefinition[] = [];
  selectedBenchmarkIds: string[] = [];
  benchmarkDataLoading = false;
  portfolioAnnualizedTWR: number = null;
  benchmarkAnnualizedStats: BenchmarkAnnualizedStat[] = [];
  private fullPortfolioTWR: TWRDataPoint[] = [];
  private fullBenchmarkTWR: { [benchmarkId: string]: TWRDataPoint[] } = {};
  timeFrameIRR: number;
  timeFrameTotalReturn: number;
  inaccurateIRR: boolean;
  inaccurateTWR: boolean;
  labelCategoriesAllocationCharts: { [categoryId: number]: ChartContext } = {};
  labelCategories: LabelCategory[] = [];
  LABEL_CATEGORY_TILE_PREFIX = LABEL_CATEGORY_TILE_PREFIX;
  BENCHMARK_CURRENCIES = BENCHMARK_CURRENCIES;

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
  readonly PERCENT_TOOLTIPS = {
    callbacks: {
      label: (tooltipItem: TooltipItem<any>) => {
        let label = '';
        if (tooltipItem.label) {
          label += tooltipItem.label + ': ';
        }
        label += (<number>tooltipItem.raw).toLocaleString(this.locale, LOCALE_NUMBER_OPTIONS) + '%';
        return label;
      }
    }
  };
  readonly goalChartOptions: ChartOptions<'doughnut'> = {
    aspectRatio: 2,
    circumference: 180,
    rotation: -90,
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<any>) => {
            let label = '';
            if (tooltipItem.dataset.label) {
              label += tooltipItem.dataset.label + ' ';
            }
            if (tooltipItem.label) {
              label += tooltipItem.label + ': ';
            }
            label += (<number>tooltipItem.raw).toLocaleString(this.locale, LOCALE_NUMBER_OPTIONS) + '%';
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        display: false,
        grid: { display: false },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
  };
  pieChartOptions: ChartOptions = {
    plugins: {
      tooltip: this.PERCENT_TOOLTIPS,
      legend: this.legendOptions,
    },
    scales: {
      x: {
        display: false,
        grid: { display: false },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
    maintainAspectRatio: false,
  };
  readonly portfolioHistoryChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max',
      },
      legend: this.legendOptions,
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (tooltipItem: TooltipItem<any>) => {
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }

            label += this.baseCurrencySymbol + (<number>tooltipItem.raw).toLocaleString(this.locale, LOCALE_NUMBER_OPTIONS);
            return label;
          },
          footer: (tooltipItems: TooltipItem<any>[]) => {
            let totalValue = 0;
            for (const tooltipItem of tooltipItems) {
              totalValue += <number>tooltipItem.raw;
            }
            return 'Total: ' + this.baseCurrencySymbol + totalValue.toLocaleString(this.locale, LOCALE_NUMBER_OPTIONS);
          }
        }
      },
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        fill: true,
      }
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: moment.localeData().longDateFormat('LL'),
        }
      },
      y: {
        stacked: true,
        ticks: {
          callback: (value: any, index: any, values: any) => {
            return this.baseCurrencySymbol + value.toLocaleString(this.locale, LOCALE_NUMBER_OPTIONS);
          }
        }
      }
    },
  };

  private allPortfolioHistory: PortfolioHistory;
  private baseCurrencySymbol: string;
  private labelAllocations: { [categoryId: number]: { [labelId: number]: { label: Label, value: number } } } = {};

  readonly benchmarkChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: this.legendOptions,
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (tooltipItem: TooltipItem<any>) => {
            const rawLabel = tooltipItem.dataset.label || '';
            const match = rawLabel.match(/^(.*?)\s*(\([+-]?\d+.*% p\.a\.\))$/);
            const rawVal = <number>tooltipItem.raw;
            const sign = rawVal >= 0 ? '+' : '';
            const valueStr = sign + rawVal.toLocaleString(this.locale, LOCALE_NUMBER_OPTIONS) + '%';
            if (match) {
              return `${match[1]}: ${valueStr} ${match[2]}`;
            }
            return `${rawLabel ? rawLabel + ': ' : ''}${valueStr}`;
          },
        }
      },
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        fill: false,
      }
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: moment.localeData().longDateFormat('LL'),
        }
      },
      y: {
        ticks: {
          callback: (value: any, index: any, values: any) => {
            return value.toLocaleString(this.locale, LOCALE_NUMBER_OPTIONS) + '%';
          }
        }
      }
    },
  };

  constructor(protected eventsService: EventsService, protected portfolioService: PortfolioService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected assetManagementService: AssetManagementService,
    protected storageService: StorageService, private cdr: ChangeDetectorRef, private route: ActivatedRoute,
    @Inject(LOCALE_ID) public locale: string, private chartsThemeService: ThemeService,
    private configService: ConfigService, private benchmarkService: BenchmarkService) {
    super(logger, portfolioService, dialogService, eventsService, router, storageService);
    this.assetTypeLabels[AssetType.Cash] = 'Cash & Equivalents';
  }

  ngOnInit() {
    super.ngOnInit();
    this.themeChanged(this.configService.getStoredTheme());
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
    const newEntry = await this.addPortfolioHistoryEntry(PortfolioHistoryDataField.Assets);
    if (newEntry) {
      this.logger.info('Edited portfolio history entry!');
      this.displayPortfolioHistory();
    }
  }

  /**
   * Prompt user to manually add the value of the unrealized P/L for a given date and store the result.
   */
  async addUnrealizedPLHistory() {
    const newEntry = await this.addPortfolioHistoryEntry(PortfolioHistoryDataField.UnrealizedPL);
    if (newEntry) {
      this.logger.info('Edited unrealized P/L entry!');
      this.displayUnrealizedPLHistory();
    }
  }

  /**
   * Prompt user to manually add the value of the portfolio or unrealized P/L for a given date and store the result.
   */
  async addPortfolioHistoryEntry(field: PortfolioHistoryDataField) {
    const history = await this.portfolioService.getPortfolioHistory();
    const data: PortfolioHistoryAddComponentInput = {
      baseCurrency: this.baseCurrency,
      portfolioHistoryEntries: history.entries,
      fieldToEdit: field,
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
    }
    return newEntry;
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
    this.portfolioConfig.phTimeFrame = this.phTimeFrame;
    this.portfolioService.saveConfig(this.portfolioConfig);
  }

  /**
   * Fired when user changes the benchmark chart time frame.
   * Instantaneous re-normalization from cached cumulative series (< 0.1ms).
   * @param newTimeFrame new chart display time frame
   */
  onBenchmarkTimeFrameChanged(newTimeFrame: string) {
    this.benchmarkTimeFrame = newTimeFrame;
    this.updateBenchmarkChartDisplay();
    this.portfolioConfig.benchmarkTimeFrame = this.benchmarkTimeFrame;
    this.portfolioService.saveConfig(this.portfolioConfig);
  }

  /**
   * Toggle a benchmark on/off in the chart.
   * If benchmark data is already cached, updates the display instantaneously in 0ms.
   * @param benchmarkId the id of the benchmark to toggle
   */
  toggleBenchmark(benchmarkId: string) {
    const idx = this.selectedBenchmarkIds.indexOf(benchmarkId);
    if (idx >= 0) {
      this.selectedBenchmarkIds.splice(idx, 1);
    } else {
      this.selectedBenchmarkIds.push(benchmarkId);
    }
    // Persist selection
    this.portfolioConfig.selectedBenchmarks = [...this.selectedBenchmarkIds];
    this.portfolioService.saveConfig(this.portfolioConfig);

    if (this.fullBenchmarkTWR[benchmarkId] || !this.selectedBenchmarkIds.includes(benchmarkId)) {
      this.updateBenchmarkChartDisplay();
    } else {
      this.computeBenchmarkChart();
    }
  }

  /**
   * Check if a benchmark is currently selected
   */
  isBenchmarkSelected(benchmarkId: string): boolean {
    return this.selectedBenchmarkIds.includes(benchmarkId);
  }

  /**
   * Fired when user changes the unrealized P/L history chart time frame
   * @param newTimeFrame new chart display time frame
   */
  onPLHTimeFrameChanged(newTimeFrame: string) {
    this.plhTimeFrame = newTimeFrame;
    this.displayUnrealizedPLHistory();
    this.portfolioConfig.plhTimeFrame = this.plhTimeFrame;
    this.portfolioService.saveConfig(this.portfolioConfig);
  }

  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.ACCOUNT_ADDED:
      case AppEventType.ACCOUNT_REMOVED:
      case AppEventType.ACCOUNT_UPDATED:
      case AppEventType.ASSET_ADDED:
      case AppEventType.ASSET_REMOVED:
      case AppEventType.ASSET_UPDATED:
      case AppEventType.LABEL_ADDED:
      case AppEventType.LABEL_REMOVED:
      case AppEventType.LABEL_UPDATED:
      case AppEventType.LABEL_CATEGORY_ADDED:
      case AppEventType.LABEL_CATEGORY_REMOVED:
      case AppEventType.LABEL_CATEGORY_UPDATED:
      case AppEventType.ASSET_PRICES_UPDATED:
        this.onDataUpdated();
        break;
      case AppEventType.THEME_CHANGED:
        this.themeChanged(event.data);
        break;
      default:
        super.handleEvents(event);
    }
  }

  /**
   * Triggered when an update in an asset or account occurs, and data needs to be reloaded
   */
  @debounce(1000)
  private onDataUpdated() {
    if (this.isConfigLoaded()) {
      this.loadData();
    }
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
    const chartCtx: ChartContext = { datasets: [{ data: [] }], labels: [] };
    let assetsTotalValue = this.assetsTotalValue;

    // do not count debt as an asset type, so remove it
    if (assetsTotalValue[AssetType.Debt] < 0) {
      assetsTotalValue = Object.assign({}, assetsTotalValue);
      delete assetsTotalValue[AssetType.Debt];
    }

    const assetAllocations = this.sortNumDict(assetsTotalValue);

    for (const [assetType, value] of assetAllocations) {
      chartCtx.labels.push(this.assetTypeLabels[assetType]);
      chartCtx.datasets[0].data.push(this.toPercentage(value, this.assetsValue));
    }
    return chartCtx;
  }

  /**
   * Build the chart data for the allocation percentage of each currency out of the total portfolio value
   */
  private computeCurrenciesAllocationData() {
    const chartCtx: ChartContext = { datasets: [{ data: [] }], labels: [] };
    const currencyAllocations = this.sortNumDict(this.currenciesTotalValue);
    // we need the absolute portfolio value to better represent negative constituents
    const absPortfolioValue = this.getAbsTotalAllocationValue(currencyAllocations);
    for (const [currency, value] of currencyAllocations) {
      chartCtx.labels.push(currency);
      chartCtx.datasets[0].data.push(this.toPercentage(Math.abs(value), absPortfolioValue));
    }
    return chartCtx;
  }

  /**
   * Build the chart data for the currency allocation of a specific asset type.
   * @param assetType asset type
   */
  private computeAssetCurrencyAllocationData(assetType: AssetType) {
    const chartCtx: ChartContext = { datasets: [{ data: [] }], labels: [] };
    const assetCurrenciesValue = this.assetCurrenciesValue[assetType];
    if (assetCurrenciesValue) {
      const currencyAllocations = this.sortNumDict(assetCurrenciesValue);
      // we need the absolute portfolio value to better represent negative constituents
      const totalValue = this.getAbsTotalAllocationValue(currencyAllocations);

      for (const [currency, value] of currencyAllocations) {
        chartCtx.labels.push(currency);
        chartCtx.datasets[0].data.push(this.toPercentage(Math.abs(value), totalValue));
      }
    }
    return chartCtx;
  }

  /**
   * Build the chart data for the allocation of a specific asset type.
   * @param assetType asset type
   * @param maxItems if provided, the max number of items to include in the chart
   */
  private computeAssetTypeAllocationData(assetType: AssetType, maxItems: number = 0) {
    const chartCtx: ChartContext = { datasets: [{ data: [] }], labels: [] };
    if (this.assetTypeAllocationMap[assetType]) {
      const allocation = this.sortNumDict(this.assetTypeAllocationMap[assetType]);
      // we need the absolute portfolio value to better represent negative constituents
      const totalValue = this.getAbsTotalAllocationValue(allocation);

      let includedValue = 0;
      for (const [assetId, value] of allocation) {
        includedValue += value;
        chartCtx.labels.push(this.assetDescriptions[assetId]);
        chartCtx.datasets[0].data.push(this.toPercentage(Math.abs(value), totalValue));
        if (maxItems && chartCtx.datasets[0].data.length >= maxItems) {
          break;
        }
      }

      // if we don't include all the items, add an "Other" item with the rest of the allocation as value
      if (chartCtx.datasets[0].data.length < allocation.length) {
        chartCtx.datasets[0].data.push(this.toPercentage(Math.abs(totalValue) - Math.abs(includedValue), totalValue));
        chartCtx.labels.push('Other');
      }
    }
    return chartCtx;
  }

  private computeLabelCategoriesAllocationData() {
    this.labelCategoriesAllocationCharts = {};
    for (const category of this.labelCategories) {
      const labelsDict = this.labelAllocations[category.id];
      if (labelsDict) {
        const chartCtx: ChartContext = { datasets: [{ data: [] }], labels: [] };

        let totalValue = 0;
        const labelsArr = Object.values(labelsDict);
        labelsArr.sort((a, b) => b.value - a.value);

        for (const item of labelsArr) {
          totalValue += item.value;
        }

        for (const item of labelsArr) {
          chartCtx.labels.push(item.label.name);
          chartCtx.datasets[0].data.push(this.toPercentage(item.value, totalValue));
          if (item.label.color) {
            chartCtx.datasets[0].backgroundColor.push(item.label.color);
          }
        }
        this.labelCategoriesAllocationCharts[category.id] = chartCtx;
      }
    }
  }

  /**
   * Build the chart data for the geographic allocation of a specific asset type
   * @param assetType asset type
   */
  private computeAssetGeoAllocationData(assetType: AssetType) {
    const chartCtx: ChartContext = { datasets: [{ data: [] }], labels: [] };
    const regionsValues = this.assetRegions[assetType];
    if (regionsValues) {
      const regionArr = this.sortNumDict(regionsValues);
      for (const [regionId, value] of regionArr) {
        chartCtx.labels.push(ASSET_REGION_LABELS[regionId]);
        chartCtx.datasets[0].data.push(this.toPercentage(value, this.assetsTotalValue[assetType]));
      }
    }
    return chartCtx;
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
    this.assetsTotalValue = {};
    this.currenciesTotalValue = {};
    this.assetCurrenciesValue = {};
    this.assetRegions = {};
    this.assetTypeAllocationMap = {};
    this.assetTypeAllocationMap[AssetType.All] = {};
    this.assetDescriptions = {};
    this.assetsUnrealizedPL = {};
    this.labelAllocations = {};

    // check for any foreign currencies and get updated quotes for them
    const requiredCurrencies: string[] = [];
    for (const account of this.accounts) {
      for (const asset of account.assets) {
        requiredCurrencies.push(asset.currency);
      }
    }
    await this.updateForexRates(requiredCurrencies);

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
          const profitLoss = tradeableAsset.getProfitLoss();
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
        assetIdKey = asset.type + '_' + assetIdKey;

        if (!asset.isVirtualAsset()) {

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
          // ignore liabilities for overall asset allocation
          if (assetBaseCurrencyValue > 0) {
            this.assetTypeAllocationMap[AssetType.All][assetIdKey] = (this.assetTypeAllocationMap[AssetType.All][assetIdKey] ?? 0) + assetBaseCurrencyValue;

            if (asset.labels) {
              for (const label of asset.labels) {
                if (label.category) {
                  const catId = label.category.id;
                  if (!this.labelAllocations[catId]) {
                    this.labelAllocations[catId] = {};
                  }
                  if (!this.labelAllocations[catId][label.id]) {
                    this.labelAllocations[catId][label.id] = { label: label, value: 0 };
                  }
                  this.labelAllocations[catId][label.id].value += assetBaseCurrencyValue;
                }
              }
            }
          }

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
    this.assetAllocationChart = this.computeAssetAllocationData();
    this.currencyAllocationChart = this.computeCurrenciesAllocationData();
    this.stockCurrencyAllocationChart = this.computeAssetCurrencyAllocationData(AssetType.Stock);
    this.bondCurrencyAllocationChart = this.computeAssetCurrencyAllocationData(AssetType.Bond);
    this.p2pCurrencyAllocationChart = this.computeAssetCurrencyAllocationData(AssetType.P2P);
    this.stockGeoAllocationChart = this.computeAssetGeoAllocationData(AssetType.Stock);
    this.bondGeoAllocationChart = this.computeAssetGeoAllocationData(AssetType.Bond);
    this.p2pGeoAllocationChart = this.computeAssetGeoAllocationData(AssetType.P2P);
    this.cryptoAllocationChart = this.computeAssetTypeAllocationData(AssetType.Cryptocurrency);
    this.commodityAllocationChart = this.computeAssetTypeAllocationData(AssetType.Commodity);
    this.debtAllocationChart = this.computeAssetTypeAllocationData(AssetType.Debt);
    this.cashAllocationChart = this.computeAssetCurrencyAllocationData(AssetType.Cash);
    this.bondAllocationChart = this.computeAssetTypeAllocationData(AssetType.Bond, 10);
    this.p2pAllocationChart = this.computeAssetTypeAllocationData(AssetType.P2P, 10);
    this.stockAllocationChart = this.computeAssetTypeAllocationData(AssetType.Stock, 10);
    this.topPortfolioHoldingsChart = this.computeAssetTypeAllocationData(AssetType.All, 10);
    this.computeLabelCategoriesAllocationData();
    this.computeRebalanceSteps();
    await this.computePortfolioHistory();
    this.displayPortfolioHistory();
    this.displayUnrealizedPLHistory();
    this.computeBenchmarkChart();
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
  private async displayPortfolioHistory() {
    this.updateHistoryChart(this.allPortfolioHistory, this.phTimeFrame, this.portfolioHistoryChart, PortfolioHistoryDataField.Assets);
    await this.computePortfolioPerformance(this.phTimeFrame);
  }

  /**
   * Compute IRR and Total Return of the portfolio for a given time frame
   * @param timeFrame time frame to calculate IRR & Total Return for
   */
  private async computePortfolioPerformance(timeFrame: string) {
    const minDate = this.getStartDateFromTimeFrame(timeFrame);
    const transactions = await this.portfolioService.getTransactions();

    const result = await this.benchmarkService.computePortfolioIRR(
      this.allPortfolioHistory,
      transactions,
      this.baseCurrency,
      minDate,
      (currency) => {
        try {
          return this.getCurrencyRate(currency);
        } catch {
          return 1;
        }
      }
    );

    this.timeFrameIRR = result.irr;
    this.timeFrameTotalReturn = result.totalReturn;
    this.inaccurateIRR = result.inaccurateIRR;
  }

  /**
   * Get the start date for a given time frame
   * @param timeFrame a string representing the time frame
   * @returns the start date for the given time frame
   */
  private getStartDateFromTimeFrame(timeFrame: string) {
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
      case '3Y':
        minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 3);
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
    return minDate;
  }

  /**
   * Update the unrealized P/L history chart data
   */
  private displayUnrealizedPLHistory() {
    this.updateHistoryChart(this.allPortfolioHistory, this.plhTimeFrame, this.unrealizedPLHistoryChart,
      PortfolioHistoryDataField.UnrealizedPL);
  }

  /**
   * Compute full benchmark and portfolio TWR data.
   * Leverages caching, fingerprinting, and incremental computation in BenchmarkService.
   */
  private async computeBenchmarkChart() {
    if (!this.allPortfolioHistory || !this.allPortfolioHistory.entries.length) {
      this.benchmarkChart = { datasets: [], labels: [] };
      this.portfolioAnnualizedTWR = null;
      this.benchmarkAnnualizedStats = [];
      return;
    }

    this.benchmarkDataLoading = true;
    this.cdr.markForCheck();

    try {
      const transactions = await this.portfolioService.getTransactions();

      // 1. Compute full portfolio TWR from inception (cached / incremental / O(N+M) < 1ms)
      this.fullPortfolioTWR = await this.benchmarkService.computePortfolioFullTWR(
        this.allPortfolioHistory,
        transactions,
        this.baseCurrency,
        (currency) => this.getCurrencyRate(currency)
      );

      this.inaccurateTWR = transactions.some(tx =>
        (tx.type === TransactionType.CreditCash || tx.type === TransactionType.DebitCash) &&
        tx.asset && tx.asset.currency && tx.asset.currency.toUpperCase() !== this.baseCurrency.toUpperCase() &&
        this.benchmarkService.getHistoricalForexRate(tx.asset.currency, this.baseCurrency, tx.date) == null
      );

      if (this.fullPortfolioTWR.length === 0) {
        this.benchmarkChart = { datasets: [], labels: [] };
        this.portfolioAnnualizedTWR = null;
        this.benchmarkAnnualizedStats = [];
        return;
      }

      // 2. Fetch and compute benchmark series for selected benchmarks if not already cached
      const selectedBenchmarks = this.availableBenchmarks.filter(
        b => this.selectedBenchmarkIds.includes(b.id)
      );

      const missingSymbols = selectedBenchmarks
        .filter(b => !this.fullBenchmarkTWR[b.id])
        .map(b => b.symbol);

      if (missingSymbols.length > 0) {
        const historyStartDate = new Date(this.allPortfolioHistory.entries[0].date);
        const historicalData = await this.benchmarkService.getHistoricalPrices(
          missingSymbols,
          historyStartDate,
          undefined,
          this.baseCurrency
        );

        const portfolioDates = this.fullPortfolioTWR.map(p => ({
          date: p.date,
          time: new Date(p.date).getTime()
        }));

        for (const benchmark of selectedBenchmarks) {
          if (!this.fullBenchmarkTWR[benchmark.id]) {
            const histData = historicalData.find(d => d.symbol === benchmark.symbol);
            if (histData && histData.history && histData.history.length > 0) {
              this.fullBenchmarkTWR[benchmark.id] = this.benchmarkService.computeBenchmarkFullTWR(
                benchmark.symbol,
                histData.history,
                portfolioDates
              );
            }
          }
        }
      }

      // 3. Render chart display for current timeframe
      this.updateBenchmarkChartDisplay();
    } catch (err) {
      this.logger.error('Error computing benchmark chart', err);
    } finally {
      this.benchmarkDataLoading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Updates the benchmark chart display synchronously based on the current
   * benchmarkTimeFrame and selectedBenchmarkIds. Runs purely in memory in < 0.1ms.
   */
  private updateBenchmarkChartDisplay() {
    if (!this.fullPortfolioTWR || this.fullPortfolioTWR.length === 0) {
      this.benchmarkChart = { datasets: [], labels: [] };
      this.portfolioAnnualizedTWR = null;
      this.benchmarkAnnualizedStats = [];
      this.cdr.markForCheck();
      return;
    }

    const minDate = this.getStartDateFromTimeFrame(this.benchmarkTimeFrame);

    // Normalize portfolio series to time frame
    const normPortfolio = this.benchmarkService.normalizeToTimeFrame(this.fullPortfolioTWR, minDate);
    if (normPortfolio.length === 0) {
      this.benchmarkChart = { datasets: [], labels: [] };
      this.portfolioAnnualizedTWR = null;
      this.benchmarkAnnualizedStats = [];
      this.cdr.markForCheck();
      return;
    }

    this.portfolioAnnualizedTWR = this.benchmarkService.calculateAnnualizedTWR(normPortfolio);
    this.benchmarkAnnualizedStats = [];


    const chartLabels = normPortfolio.map(p => p.date);
    const datasets: ChartDataSet[] = [{
      label: 'My Portfolio',
      data: normPortfolio.map(p => p.twr),
      lineTension: 0,
      borderWidth: 1,
    }];

    // Add selected benchmarks
    const selectedBenchmarks = this.availableBenchmarks.filter(
      b => this.selectedBenchmarkIds.includes(b.id)
    );

    let bmColorIdx = 0;
    for (const benchmark of selectedBenchmarks) {
      const fullSeries = this.fullBenchmarkTWR[benchmark.id];
      if (fullSeries && fullSeries.length > 0) {
        const normBenchmark = this.benchmarkService.normalizeToTimeFrame(fullSeries, minDate);
        if (normBenchmark.length > 0) {
          bmColorIdx++;

          const bmAnnTWR = this.benchmarkService.calculateAnnualizedTWR(normBenchmark);
          if (bmAnnTWR !== null) {
            this.benchmarkAnnualizedStats.push({
              id: benchmark.id,
              name: benchmark.name,
              twr: bmAnnTWR,
            });
          }

          const dataMap: { [date: string]: number } = {};
          for (const point of normBenchmark) {
            dataMap[point.date] = point.twr;
          }
          const alignedData: number[] = [];
          for (const label of chartLabels) {
            alignedData.push(dataMap[label] ?? null);
          }

          datasets.push({
            label: benchmark.name,
            data: alignedData,
            lineTension: 0,
            borderWidth: 1,
          });
        }
      }
    }

    this.benchmarkChart = { datasets, labels: chartLabels };
    this.cdr.markForCheck();
  }

  /**
   * Update the data for a  history type chart
   *
   * @param history portfolio history data
   * @param timeFrame time frame to display data for
   * @param chart chart to update data for
   */
  private updateHistoryChart(history: PortfolioHistory, timeFrame: string, chart: ChartContext,
    dataField: PortfolioHistoryDataField) {

    const chartLabels: string[] = [];
    chart.datasets = [];
    const dataSets: NumKeyDictionary<DatasetEntries> = {};
    for (const assetType of Object.keys(this.assetTypeLabels)) {
      dataSets[assetType] = {
        empty: true,
        data: [],
      };
    }

    const minDate = this.getStartDateFromTimeFrame(timeFrame);

    for (const entry of history.entries) {
      const entryDate = new Date(entry.date);
      let assets: PortfolioAssetValue[];
      if (dataField === PortfolioHistoryDataField.Assets) {
        assets = entry.assets;
      } else {
        assets = entry.assetsUnrealizedPL;
      }
      // skip dates not in our time frame or without any data
      if (assets && assets.length > 0 && (!minDate || minDate.getTime() <= entryDate.getTime())) {
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
        chart.datasets.push({
          data: dataSets[assetType].data,
          label: this.assetTypeLabels[assetType],
          lineTension: 0,
          borderWidth: 1,

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
    if (!this.dataLoading) {
      this.dataLoading = true;
      try {
        this.labelCategories = await this.portfolioService.getLabelCategories();
        for (const cat of this.labelCategories) {
          const key = this.LABEL_CATEGORY_TILE_PREFIX + cat.id;
          if (this.gridVisibility[key] === undefined) {
            this.gridVisibility[key] = true;
          }
        }

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
      this.dataLoading = false;
    } else {
      // postpone reload until current load is finished
      this.onDataUpdated();
    }
  }

  protected onConfigLoaded() {
    super.onConfigLoaded();
    this.baseCurrency = this.portfolioConfig.baseCurrency;
    this.baseCurrencySymbol = getCurrencySymbol(this.baseCurrency, 'wide');
    this.rebalancingSetup = this.portfolioConfig.portfolioAllocation.length > 0;
    this.gridVisibility = this.portfolioConfig.dashboardGridVisibility;
    this.phTimeFrame = this.portfolioConfig.phTimeFrame || this.phTimeFrame;
    this.benchmarkTimeFrame = this.portfolioConfig.benchmarkTimeFrame || this.benchmarkTimeFrame;
    this.plhTimeFrame = this.portfolioConfig.plhTimeFrame || this.plhTimeFrame;
    if (!this.gridVisibility) {
      this.gridVisibility = {};
    }
    // always display new tiles that didn't exist in earlier save
    for (const tile of Object.keys(DashboardGridTiles)) {
      if (this.gridVisibility[tile] === undefined) {
        this.gridVisibility[tile] = true;
      }
    }
    // Initialize benchmark selections
    this.fullBenchmarkTWR = {};
    this.availableBenchmarks = this.benchmarkService.getAvailableBenchmarks(this.baseCurrency);
    if (this.portfolioConfig.selectedBenchmarks && this.portfolioConfig.selectedBenchmarks.length > 0) {
      this.selectedBenchmarkIds = [...this.portfolioConfig.selectedBenchmarks];
    } else if (this.availableBenchmarks.length > 0) {
      this.selectedBenchmarkIds = [this.availableBenchmarks[0].id];
    } else {
      this.selectedBenchmarkIds = [];
    }
    this.loadData();
  }

  /**
   * Fired when theme changes. Adjusts chart colors to fit current theme
   * @param newTheme the new theme id
   */
  private themeChanged(newTheme: string) {
    let overrides: ChartOptions;
    if (newTheme === APP_THEMES.DARK) {
      overrides = {
        plugins: {
          legend: {
            labels: { color: 'white' },
          },
        },
        scales: {
          x: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      };
    } else {
      overrides = {};
    }
    this.chartsThemeService.setColorschemesOptions(overrides);
  }
}
