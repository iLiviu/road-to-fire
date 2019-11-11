import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { ViewAsset } from '../../models/view-asset';
import { AssetType } from '../../models/asset';
import { TradeableAsset } from '../../models/tradeable-asset';
import { BondAsset } from '../../models/bond-asset';
import { TotalReturnStats } from '../../models/total-return-stats';

export interface TradeableAssetViewData {
  viewAsset: ViewAsset;
  totalReturnStats: TotalReturnStats;
}

/**
 * Component that provides a UI for viewing details about a tradeable asset
 */
@Component({
  selector: 'app-tradeable-asset-view',
  templateUrl: './tradeable-asset-view.component.html',
  styleUrls: ['./tradeable-asset-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeableAssetViewComponent implements OnInit {

  bondAsset: BondAsset;
  tradeableAsset: TradeableAsset;
  totalPL: number;
  totalPLPercent: number;
  viewAsset: ViewAsset;

  readonly AssetType = AssetType;

  constructor(public dialogRef: MatDialogRef<TradeableAssetViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TradeableAssetViewData) {
  }


  async ngOnInit() {
    this.viewAsset = this.data.viewAsset;
    this.tradeableAsset = <TradeableAsset>this.viewAsset.asset;
    if (this.viewAsset.asset.type === AssetType.Bond) {
      this.bondAsset = <BondAsset>this.viewAsset.asset;
    }
    this.totalPL = this.data.totalReturnStats.totalReturn - this.data.totalReturnStats.totalCost;
    this.totalPLPercent = this.totalPL / this.data.totalReturnStats.totalCost;
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
