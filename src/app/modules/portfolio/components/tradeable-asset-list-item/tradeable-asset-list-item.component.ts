import { Component, OnInit, Input, HostBinding, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { ViewAsset } from '../../models/view-asset';
import { AssetManagementService } from '../../services/asset-management.service';
import { AssetType } from '../../models/asset';
import { TradeableAsset } from '../../models/tradeable-asset';


/**
 * Component to display a list item with details about a tradeable asset.
 * Assets with the same symbol will be grouped into a single item
 * @see TradeableAssetListComponent
 */
@Component({
  selector: 'app-tradeable-asset-list-item',
  templateUrl: './tradeable-asset-list-item.component.html',
  styleUrls: ['./tradeable-asset-list-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ])
  ]
})
export class TradeableAssetListItemComponent implements OnInit {

  @Input() depth: number;
  @Input() viewAsset: ViewAsset;
  expanded: boolean;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  isStockLike: boolean;
  isRentable: boolean;
  isInterestPayer: boolean;

  constructor(private assetManagementService: AssetManagementService) { }

  ngOnInit() {
    this.isStockLike = this.viewAsset.asset.isStockLike();
    this.isRentable = this.viewAsset.asset.type === AssetType.RealEstate;
    this.isInterestPayer = (this.viewAsset.asset.type === AssetType.Bond || this.viewAsset.asset.type === AssetType.Deposit);
  }

  delete() {
    this.assetManagementService.deleteAsset(this.viewAsset);
  }

  buy() {
    this.assetManagementService.buyTradeableAsset(this.viewAsset.asset.type, this.viewAsset.account, <TradeableAsset>this.viewAsset.asset);
  }

  sell() {
    this.assetManagementService.sellTradeableAsset(this.viewAsset.position, <TradeableAsset>this.viewAsset.asset, this.viewAsset.account);
  }

  transfer() {
    this.assetManagementService.transferAsset(this.viewAsset);
  }

  edit() {
    this.assetManagementService.editAsset(this.viewAsset);
  }

  payDividend() {
    this.assetManagementService.addDividendPayment(this.viewAsset.asset, this.viewAsset.account);
  }

  payRent() {
    this.assetManagementService.addDividendPayment(this.viewAsset.asset, this.viewAsset.account);
  }

  addCost() {
    this.assetManagementService.addCostTransaction(this.viewAsset.asset, this.viewAsset.account);
  }

  payInterest() {
    this.assetManagementService.addInterestPayment(this.viewAsset.asset, this.viewAsset.account);
  }

  mergePositions() {
    this.assetManagementService.mergeAssetPositions(<TradeableAsset>this.viewAsset.asset, this.viewAsset.account);
  }

  onItemMenu(event: Event) {
    // prevent default item action
    event.stopPropagation();
  }

  view() {
    this.assetManagementService.viewAsset(this.viewAsset);
  }

  onGroupSelected() {
    if (this.viewAsset.children && this.viewAsset.children.length) {
      this.expanded = !this.expanded;
    }
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
