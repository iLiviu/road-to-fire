import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ViewAsset } from '../../models/view-asset';
import { AssetType } from '../../models/asset';
import { DepositAsset } from '../../models/deposit-asset';

/**
 * Component to display info about a cash or deposit asset
 */
@Component({
  selector: 'app-cash-asset-view',
  templateUrl: './cash-asset-view.component.html',
  styleUrls: ['./cash-asset-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashAssetViewComponent implements OnInit {

  deposit: DepositAsset;

  constructor(public dialogRef: MatDialogRef<CashAssetViewComponent>,
    @Inject(MAT_DIALOG_DATA) public viewAsset: ViewAsset) {
  }

  ngOnInit() {
    if (this.viewAsset.asset.type === AssetType.Deposit) {
      this.deposit = <DepositAsset>this.viewAsset.asset;
    }
  }

  copyToClipboard(val: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  cancel() {
    this.dialogRef.close();
  }
}
