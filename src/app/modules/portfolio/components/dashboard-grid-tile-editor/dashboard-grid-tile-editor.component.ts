import { Component, OnInit, OnDestroy, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Dictionary } from 'src/app/shared/models/dictionary';
import { DashboardGridTiles, LABEL_CATEGORY_TILE_PREFIX } from '../../models/dashboard-grid-tiles';
import { PortfolioService } from '../../services/portfolio.service';

export interface TileItem {
  id: string | number;
  label: string;
  icon?: string;
  svgIcon?: string;
}

export interface TileCategory {
  id: string;
  title: string;
  icon: string;
  items: TileItem[];
}

/**
 * A dialog allowing the user to select which dashboard charts should be visible,
 * organized by logical categories with quick-search and batch actions.
 * Supports full-screen presentation on handset / mobile screens.
 */
@Component({
  selector: 'app-dashboard-grid-tile-editor',
  templateUrl: './dashboard-grid-tile-editor.component.html',
  styleUrls: ['./dashboard-grid-tile-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardGridTileEditorComponent implements OnInit, OnDestroy {

  searchQuery = '';
  categories: TileCategory[] = [];
  isHandset = false;
  private destroyed$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<DashboardGridTileEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public gridVisibility: Dictionary<boolean>,
    private portfolioService: PortfolioService,
    private breakpointObserver: BreakpointObserver,
    public cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Small, Breakpoints.XSmall])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(state => {
        this.isHandset = state.matches;
        this.cdr.markForCheck();
      });

    this.initCategories();
    await this.loadLabelCategories();
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private initCategories() {
    this.categories = [
      {
        id: 'overview',
        title: 'Summary & Overview',
        icon: 'dashboard',
        items: [
          {
            id: DashboardGridTiles.Stats,
            label: 'Portfolio Summary',
            icon: 'account_balance_wallet',
          },
          {
            id: DashboardGridTiles.Goals,
            label: 'Goals Progress',
            icon: 'flag',
          }
        ]
      },
      {
        id: 'performance',
        title: 'Performance & History',
        icon: 'show_chart',
        items: [
          {
            id: DashboardGridTiles.PortfolioHistory,
            label: 'Portfolio History',
            icon: 'trending_up',
          },
          {
            id: DashboardGridTiles.PerformanceBenchmark,
            label: 'Performance Benchmark',
            icon: 'compare_arrows',
          },
          {
            id: DashboardGridTiles.UnrealizedPLHistory,
            label: 'Unrealized P/L History',
            icon: 'insights',
          }
        ]
      },
      {
        id: 'allocations',
        title: 'Asset Allocations & Holdings',
        icon: 'pie_chart',
        items: [
          {
            id: DashboardGridTiles.PortfolioAllocation,
            label: 'Portfolio Allocation',
            icon: 'pie_chart',
          },
          {
            id: DashboardGridTiles.PortfolioTopHoldings,
            label: 'Top Portfolio Holdings',
            icon: 'format_list_numbered',
          },
          {
            id: DashboardGridTiles.StocksAllocation,
            label: 'Top Stock Holdings',
            icon: 'candlestick_chart',
          },
          {
            id: DashboardGridTiles.BondsAllocation,
            label: 'Top Bond Holdings',
            svgIcon: 'certificate',
          },
          {
            id: DashboardGridTiles.CryptoAllocation,
            label: 'Cryptocurrency Allocation',
            icon: 'currency_bitcoin',
          },
          {
            id: DashboardGridTiles.CommodityAllocation,
            label: 'Commodity Allocation',
            svgIcon: 'commodity',
          },
          {
            id: DashboardGridTiles.P2PAllocation,
            label: 'Top P2P Holdings',
            icon: 'handshake',
          },
          {
            id: DashboardGridTiles.CashAllocation,
            label: 'Cash Allocation',
            icon: 'payments',
          },
          {
            id: DashboardGridTiles.DebtAllocation,
            label: 'Debt Allocation',
            icon: 'credit_card',
          }
        ]
      },
      {
        id: 'exposure',
        title: 'Geographic & Currency Exposure',
        icon: 'public',
        items: [
          {
            id: DashboardGridTiles.StocksGeoAllocation,
            label: 'Stocks Geographic Allocation',
            icon: 'public',
          },
          {
            id: DashboardGridTiles.BondsGeoAllocation,
            label: 'Bonds Geographic Allocation',
            icon: 'public',
          },
          {
            id: DashboardGridTiles.P2PGeoAllocation,
            label: 'P2P Geographic Allocation',
            icon: 'public',
          },
          {
            id: DashboardGridTiles.CurrencyAllocation,
            label: 'Total Currency Allocation',
            icon: 'monetization_on',
          },
          {
            id: DashboardGridTiles.StockCurrencyAllocation,
            label: 'Stock Currency Allocation',
            icon: 'paid',
          },
          {
            id: DashboardGridTiles.BondCurrencyAllocation,
            label: 'Bond Currency Allocation',
            icon: 'paid',
          },
          {
            id: DashboardGridTiles.P2PCurrencyAllocation,
            label: 'P2P Currency Allocation',
            icon: 'paid',
          }
        ]
      },
      {
        id: 'strategy',
        title: 'Strategy & Rebalancing',
        icon: 'balance',
        items: [
          {
            id: DashboardGridTiles.Rebalancing,
            label: 'Portfolio Rebalancing',
            icon: 'balance',
          }
        ]
      }
    ];
  }

  private async loadLabelCategories() {
    try {
      const categories = await this.portfolioService.getLabelCategories();
      if (categories && categories.length > 0) {
        const labelItems: TileItem[] = categories.map(cat => ({
          id: LABEL_CATEGORY_TILE_PREFIX + cat.id,
          label: `${cat.name} Allocation`,
          icon: 'label',
        }));
        this.categories.splice(this.categories.length - 1, 0, {
          id: 'labels',
          title: 'Custom Label Categories',
          icon: 'label',
          items: labelItems
        });
      }
    } catch {
      // ignore
    }
  }

  getFilteredItems(category: TileCategory): TileItem[] {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return category.items;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return category.items.filter(item =>
      item.label.toLowerCase().includes(q)
    );
  }

  isCategoryVisible(category: TileCategory): boolean {
    return this.getFilteredItems(category).length > 0;
  }

  isSearchEmpty(): boolean {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return false;
    }
    return !this.categories.some(cat => this.isCategoryVisible(cat));
  }

  clearSearch() {
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  toggleTile(item: TileItem) {
    this.gridVisibility[item.id] = !this.gridVisibility[item.id];
    this.cdr.markForCheck();
  }

  onToggleChange(item: TileItem, checked: boolean) {
    this.gridVisibility[item.id] = checked;
    this.cdr.markForCheck();
  }

  toggleCategory(category: TileCategory) {
    const allActive = this.isCategoryAllActive(category);
    for (const item of category.items) {
      this.gridVisibility[item.id] = !allActive;
    }
    this.cdr.markForCheck();
  }

  isCategoryAllActive(category: TileCategory): boolean {
    return category.items.length > 0 && category.items.every(item => !!this.gridVisibility[item.id]);
  }

  getCategoryActiveCount(category: TileCategory): number {
    return category.items.filter(item => !!this.gridVisibility[item.id]).length;
  }

  getTotalActiveCount(): number {
    let count = 0;
    for (const cat of this.categories) {
      for (const item of cat.items) {
        if (this.gridVisibility[item.id]) {
          count++;
        }
      }
    }
    return count;
  }

  getTotalTilesCount(): number {
    let count = 0;
    for (const cat of this.categories) {
      count += cat.items.length;
    }
    return count;
  }

  selectAll() {
    for (const cat of this.categories) {
      for (const item of cat.items) {
        this.gridVisibility[item.id] = true;
      }
    }
    this.cdr.markForCheck();
  }

  clearAll() {
    for (const cat of this.categories) {
      for (const item of cat.items) {
        this.gridVisibility[item.id] = false;
      }
    }
    this.cdr.markForCheck();
  }

  resetDefaults() {
    this.selectAll();
  }
}
