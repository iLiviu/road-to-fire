import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ViewAsset } from '../../models/view-asset';
import { Asset, AssetType, ASSET_TYPE_LABELS } from '../../models/asset';
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
  styleUrls: ['./tradeable-asset-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeableAssetViewComponent implements OnInit {

  bondAsset: BondAsset | null = null;
  hasAmount: boolean;
  tradeableAsset: TradeableAsset;
  totalPL: number;
  totalPLPercent: number;
  viewAsset: ViewAsset;
  copied = false;

  readonly AssetType = AssetType;

  constructor(
    public dialogRef: MatDialogRef<TradeableAssetViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TradeableAssetViewData,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.viewAsset = this.data?.viewAsset;
    this.tradeableAsset = <TradeableAsset>this.viewAsset?.asset;
    if (this.viewAsset?.asset?.type === AssetType.Bond || this.viewAsset?.asset?.type === AssetType.P2P) {
      this.bondAsset = <BondAsset>this.viewAsset.asset;
    }
    if (this.data?.totalReturnStats) {
      this.totalPL = this.data.totalReturnStats.totalReturn - this.data.totalReturnStats.totalCost;
      this.totalPLPercent = this.data.totalReturnStats.totalCost !== 0 ?
        (this.totalPL / this.data.totalReturnStats.totalCost) : 0;
    } else {
      this.totalPL = 0;
      this.totalPLPercent = 0;
    }
    this.hasAmount = !!this.tradeableAsset &&
      this.tradeableAsset.type !== AssetType.P2P &&
      this.tradeableAsset.type !== AssetType.RealEstate;
  }

  get displayName(): string {
    return this.viewAsset?.asset?.description || 'Asset';
  }

  get assetTypeLabel(): string {
    if (!this.viewAsset?.asset) {
      return 'Asset';
    }
    return ASSET_TYPE_LABELS[this.viewAsset.asset.type] || 'Asset';
  }

  get typeBadgeClass(): string {
    if (!this.viewAsset?.asset) {
      return '';
    }
    const type = this.viewAsset.asset.type;
    if (Asset.isBondLike(type)) {
      return 'bond';
    }
    if (Asset.isCommodityLike(type)) {
      return 'commodity';
    }
    if (type === AssetType.Cryptocurrency) {
      return 'crypto';
    }
    if (type === AssetType.RealEstate) {
      return 'real-estate';
    }
    if (type === AssetType.P2P) {
      return 'p2p';
    }
    return 'stock';
  }

  get daysToMaturity(): number | null {
    if (!this.bondAsset?.maturityDate) {
      return null;
    }
    const maturity = new Date(this.bondAsset.maturityDate);
    if (isNaN(maturity.getTime())) {
      return null;
    }
    maturity.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = maturity.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  copyToClipboard(val: string) {
    if (!val) {
      return;
    }
    const fallbackCopy = () => {
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
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    this.copied = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copied = false;
      this.cdr.markForCheck();
    }, 2000);
  }

  cancel() {
    this.dialogRef.close();
  }
}
