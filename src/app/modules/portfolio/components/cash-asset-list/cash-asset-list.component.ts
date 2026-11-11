import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ASSET_ICONS, AssetType } from '../../models/asset';
import { ViewAsset } from '../../models/view-asset';
import { DepositAsset } from '../../models/deposit-asset';
import { AssetManagementService } from '../../services/asset-management.service';

export enum AssetGroupBy {
  None = '0',
  Account = '1',
  Currency = '2'
}

/**
 * Component to display individual cash, deposit, or debt assets as modern interactive cards
 * in a responsive multi-column grid, with currency filter chips and sorting controls.
 */
@Component({
  selector: 'app-cash-asset-list',
  templateUrl: './cash-asset-list.component.html',
  styleUrls: ['./cash-asset-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashAssetListComponent implements OnInit, OnChanges {

  @Input() multiAccount = true;
  @Input() assets: ViewAsset[] = [];

  readonly AssetType = AssetType;
  readonly AssetGroupBy = AssetGroupBy;

  currencies: string[] = [];
  currencyCounts: { [currency: string]: number } = {};
  selectedCurrency = 'ALL';

  ASSET_ICONS = ASSET_ICONS;

  sortCriterion: 'value' | 'name' | 'account' = 'value';
  sortDirection: 'asc' | 'desc' = 'desc';

  filteredAssets: ViewAsset[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private assetManagementService: AssetManagementService
  ) { }

  ngOnInit() {
    this.applyFilterAndSort();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.assets) {
      this.applyFilterAndSort();
    }
  }

  selectCurrency(curr: string) {
    this.selectedCurrency = curr;
    this.applyFilterAndSort();
  }

  setSort(criterion: 'value' | 'name' | 'account') {
    if (this.sortCriterion === criterion) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCriterion = criterion;
      this.sortDirection = criterion === 'name' || criterion === 'account' ? 'asc' : 'desc';
    }
    this.applyFilterAndSort();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilterAndSort();
  }

  assetIdTrackFn(index: number, item: ViewAsset) {
    if (item && item.asset && item.asset.id) {
      return item.asset.id;
    }
    return index;
  }

  get singleCurrencyTotal(): number | null {
    if (!this.filteredAssets || this.filteredAssets.length === 0) {
      return null;
    }
    if (this.selectedCurrency !== 'ALL') {
      return this.filteredAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    }
    if (this.currencies.length === 1) {
      return this.filteredAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    }
    return null;
  }

  get activeCurrencyCode(): string {
    if (this.selectedCurrency !== 'ALL') {
      return this.selectedCurrency;
    }
    if (this.currencies.length === 1) {
      return this.currencies[0];
    }
    return '';
  }


  getAssetBadgeClass(viewAsset: ViewAsset): string {
    if (viewAsset.asset.type === AssetType.Deposit) {
      return 'deposit-badge';
    }
    if (viewAsset.asset.type === AssetType.Debt) {
      return 'debt-badge';
    }
    return 'cash-badge';
  }

  asDeposit(asset: any): DepositAsset {
    return asset as DepositAsset;
  }

  view(viewAsset: ViewAsset) {
    this.assetManagementService.viewAsset(viewAsset);
  }

  creditAccount(viewAsset: ViewAsset) {
    this.assetManagementService.creditCashAsset(viewAsset.asset, viewAsset.account);
  }

  debitAccount(viewAsset: ViewAsset) {
    this.assetManagementService.debitCashAsset(viewAsset.asset, viewAsset.account);
  }

  exchange(viewAsset: ViewAsset) {
    this.assetManagementService.exchangeCash(viewAsset.asset, viewAsset.account);
  }

  transfer(viewAsset: ViewAsset) {
    this.assetManagementService.transferAsset(viewAsset);
  }

  liquidate(viewAsset: ViewAsset) {
    this.assetManagementService.liquidateDeposit(<DepositAsset>viewAsset.asset, viewAsset.account);
  }

  edit(viewAsset: ViewAsset) {
    this.assetManagementService.editAsset(viewAsset);
  }

  delete(viewAsset: ViewAsset) {
    this.assetManagementService.deleteAsset(viewAsset);
  }

  onItemMenu(event: Event) {
    event.stopPropagation();
  }

  private applyFilterAndSort() {
    if (!this.assets || this.assets.length === 0) {
      this.filteredAssets = [];
      this.currencies = [];
      this.currencyCounts = {};
      this.cdr.markForCheck();
      return;
    }

    const counts: { [key: string]: number } = {};
    for (const item of this.assets) {
      const c = item.asset?.currency || 'Unknown';
      counts[c] = (counts[c] || 0) + 1;
    }
    this.currencyCounts = counts;
    this.currencies = Object.keys(counts).sort();

    if (this.selectedCurrency !== 'ALL' && !counts[this.selectedCurrency]) {
      this.selectedCurrency = 'ALL';
    }

    let items = this.assets;
    if (this.selectedCurrency !== 'ALL') {
      items = items.filter(a => a.asset?.currency === this.selectedCurrency);
    } else {
      items = [...items];
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (this.sortCriterion === 'value') {
        const valA = a.currentValue !== undefined && a.currentValue !== null ? a.currentValue : (a.asset?.amount || 0);
        const valB = b.currentValue !== undefined && b.currentValue !== null ? b.currentValue : (b.asset?.amount || 0);
        cmp = valA - valB;
      } else if (this.sortCriterion === 'name') {
        const nameA = a.asset?.description || a.asset?.currency || '';
        const nameB = b.asset?.description || b.asset?.currency || '';
        cmp = nameA.localeCompare(nameB);
      } else if (this.sortCriterion === 'account') {
        const accA = a.account?.description || '';
        const accB = b.account?.description || '';
        cmp = accA.localeCompare(accB);
      }
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredAssets = items;
    this.cdr.markForCheck();
  }
}
