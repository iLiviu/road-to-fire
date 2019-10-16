import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { AssetManagementService } from '../../services/asset-management.service';
import { ViewAsset } from '../../models/view-asset';

/**
 * Component to display a list item containing details about a cash asset
 * @see CashAssetListComponent
 */
@Component({
  selector: 'app-cash-list-item',
  templateUrl: './cash-list-item.component.html',
  styleUrls: ['./cash-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashListItemComponent {

  @Input() viewAsset: ViewAsset;

  constructor(private assetManagementService: AssetManagementService) {
  }

  debitAccount() {
    this.assetManagementService.debitCashAsset(this.viewAsset.asset, this.viewAsset.account);
  }

  creditAccount() {
    this.assetManagementService.creditCashAsset(this.viewAsset.asset, this.viewAsset.account);
  }

  transfer() {
    this.assetManagementService.transferAsset(this.viewAsset);
  }

  exchange() {
    this.assetManagementService.exchangeCash(this.viewAsset.asset, this.viewAsset.account);
  }

  delete() {
    this.assetManagementService.deleteAsset(this.viewAsset);
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
