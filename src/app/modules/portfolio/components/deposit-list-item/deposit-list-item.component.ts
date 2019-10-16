import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import { AssetManagementService } from '../../services/asset-management.service';
import { ViewAsset } from '../../models/view-asset';
import { DepositAsset } from '../../models/deposit-asset';

/**
 * Component to display a list item containing information about a deposit.
 * @see CashAssetListComponent
 */
@Component({
  selector: 'app-deposit-list-item',
  templateUrl: './deposit-list-item.component.html',
  styleUrls: ['./deposit-list-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepositListItemComponent implements OnInit {

  @Input() viewAsset: ViewAsset;
  deposit: DepositAsset;

  constructor(private assetManagementService: AssetManagementService) { }

  ngOnInit() {
    this.deposit = <DepositAsset>this.viewAsset.asset;
  }

  delete() {
    this.assetManagementService.deleteAsset(this.viewAsset);
  }

  liquidate() {
    this.assetManagementService.liquidateDeposit(this.deposit, this.viewAsset.account);
  }

  edit() {
    this.assetManagementService.editAsset(this.viewAsset);
  }

  view() {
    this.assetManagementService.viewAsset(this.viewAsset);
  }

  onItemMenu(event: Event) {
    // prevent default item action
    event.stopPropagation();
  }


}
