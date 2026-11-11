import { Component, Input, ViewChild, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';

import { ViewAsset } from '../../models/view-asset';
import { BondAsset } from '../../models/bond-asset';
import { AssetType } from '../../models/asset';

export interface SortOption {
  key: string;
  label: string;
}

/**
 * Component to display a list of tradeable assets.
 * The list can be sorted by certain properties
 */
@Component({
  selector: 'app-tradeable-asset-list',
  templateUrl: './tradeable-asset-list.component.html',
  styleUrls: ['./tradeable-asset-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeableAssetListComponent implements OnInit, OnChanges {

  @Input() assets: ViewAsset[];
  @Input() assetTypes: AssetType;
  @Input() dataLoaded = true;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  hasYTM: boolean;
  activeSort = 'description';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortOptions: SortOption[] = [];

  readonly sortLabels: { [key: string]: string } = {
    description: 'Description',
    currentValue: 'Current Value',
    initialValue: 'Initial Cost',
    profitLossPercent: 'P/L %',
    account: 'Account',
    ytm: 'YTM'
  };

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.updateSortOptions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.assetTypes || changes.assets) {
      this.updateSortOptions();
    }
    if (changes.assets) {
      this.sortData();
    }
  }

  updateSortOptions() {
    this.hasYTM = this.assetTypes === AssetType.Bond || this.assetTypes === AssetType.P2P;
    const options: SortOption[] = [
      { key: 'description', label: 'Description' },
      { key: 'currentValue', label: 'Current Value' },
      { key: 'initialValue', label: 'Initial Cost' },
      { key: 'profitLossPercent', label: 'Profit / Loss %' },
      { key: 'account', label: 'Account' }
    ];
    if (this.hasYTM) {
      options.push({ key: 'ytm', label: 'Yield to Maturity (YTM)' });
    }
    this.sortOptions = options;
  }

  trackByKey(index: number, item: SortOption) {
    return item ? item.key : index;
  }

  /**
   * Set active sort field. Toggles direction if already active.
   */
  selectSort(key: string) {
    if (this.activeSort === key) {
      this.toggleSortDirection();
    } else {
      this.activeSort = key;
      this.sortData();
    }
  }

  /**
   * Toggle sort direction between ascending and descending
   */
  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortData();
  }

  /**
   * Sort the assets by the selected property
   */
  sortData() {
    if (!this.assets || this.assets.length === 0) {
      return;
    }

    if (this.sort) {
      this.sort.active = this.activeSort;
      this.sort.direction = this.sortDirection;
    }

    const isAsc = this.sortDirection === 'asc';
    this.assets.sort((a, b) => {
      switch (this.activeSort) {
        case 'account': return compare(a.account ? a.account.description : '', b.account ? b.account.description : '', isAsc);
        case 'description': return compare(a.asset ? a.asset.description : '', b.asset ? b.asset.description : '', isAsc);
        case 'ytm': return compare((<BondAsset>a.asset)?.ytm || 0, (<BondAsset>b.asset)?.ytm || 0, isAsc);
        default: return compare(a[this.activeSort], b[this.activeSort], isAsc);
      }
    });

    // Re-create reference and trigger OnPush change detection
    this.assets = [...this.assets];
    this.cdRef.markForCheck();
  }

  /**
   * Used for ngFor trackBy. Returns the item's asset id
   */
  assetIdTrackFn(index: number, item: ViewAsset) {
    if (item && item.asset.id) {
      return item.asset.id;
    }
    return null;
  }
}

/** Simple sort comparator with string and numeric support */
function compare(a: any, b: any, isAsc: boolean) {
  if (a == null && b == null) return 0;
  if (a == null) return isAsc ? -1 : 1;
  if (b == null) return isAsc ? 1 : -1;
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }) * (isAsc ? 1 : -1);
  }
  return (a < b ? -1 : a > b ? 1 : 0) * (isAsc ? 1 : -1);
}
