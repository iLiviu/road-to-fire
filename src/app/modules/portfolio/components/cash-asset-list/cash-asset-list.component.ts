import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AssetType } from '../../models/asset';
import { ViewAsset } from '../../models/view-asset';
import { Dictionary } from 'src/app/shared/models/dictionary';

export enum AssetGroupBy {
  None = '0',
  Account = '1',
  Currency = '2'
}

/**
 * Component to display a list of cash or deposit assets.
 * The list can be grouped by asset's currency or parent account
 */
@Component({
  selector: 'app-cash-asset-list',
  templateUrl: './cash-asset-list.component.html',
  styleUrls: ['../../components/assets/assets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashAssetListComponent implements OnInit, OnChanges {

  @Input() multiAccount = true;
  @Input() assets: ViewAsset[];
  groupBy: AssetGroupBy = AssetGroupBy.Currency;
  groups: Dictionary<ViewAsset[]>;

  readonly AssetGroupBy = AssetGroupBy;
  readonly AssetType = AssetType;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.assetsRefreshed();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.assets) {
      this.assetsRefreshed();
    }
  }

  /**
   * Called when assets need to be grouped by a different property
   */
  groupByChanged() {
    this.assetsRefreshed();
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

  /**
   * Add an asset to it's group
   */
  private addGroupItem(viewAsset: ViewAsset, items: Dictionary<ViewAsset[]>, groupBy: AssetGroupBy) {
    const key: string = (groupBy === AssetGroupBy.Account) ? viewAsset.account.description : viewAsset.asset.currency;
    if (!items[key]) {
      items[key] = [];
    }
    items[key].push(viewAsset);

  }

  /**
   * Actions to take when a change occurred  in the assets
   */
  private assetsRefreshed() {
    this.buildGroups(this.groupBy);
  }

  /**
   * Group assets of a specific type
   * @param assetType Can be Cash or Deposit
   * @param groupBy group by a given property
   */
  private buildGroups(groupBy: AssetGroupBy) {
    this.assets.sort((a, b) => {
      return a.asset.amount > b.asset.amount ? -1 : 1;
    });


    const groups: Dictionary<ViewAsset[]> = {};
    for (const asset of this.assets) {
      this.addGroupItem(asset, groups, groupBy);
    }
    this.sortGroups(groups, (groupBy === AssetGroupBy.Currency) ? 'amount' : 'currency');

    this.groups = groups;
    this.cdr.markForCheck();
  }

  /**
   * Sort items of each group by given key
   * @param groups groups for which items need sorting
   * @param sortKey ViewAsset property to sort by
   */
  private sortGroups(groups: Dictionary<ViewAsset[]>, sortKey: string) {
    for (const groupId of Object.keys(groups)) {
      const group = groups[groupId];
      group.sort((a, b) => {
        return a[sortKey] < b[sortKey] ? -1 : 1;
      });
    }
  }
}
