import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ViewAsset } from '../../models/view-asset';
import { Asset, ASSET_ICONS, ASSET_TYPE_LABELS, AssetType } from '../../models/asset';
import { DepositAsset } from '../../models/deposit-asset';

/**
 * Component to display info about a cash or deposit asset
 */
@Component({
  selector: 'app-cash-asset-view',
  templateUrl: './cash-asset-view.component.html',
  styleUrls: ['./cash-asset-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashAssetViewComponent implements OnInit {

  deposit: DepositAsset | null = null;
  copied = false;
  ASSET_ICONS = ASSET_ICONS;

  constructor(
    public dialogRef: MatDialogRef<CashAssetViewComponent>,
    @Inject(MAT_DIALOG_DATA) public viewAsset: ViewAsset,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.viewAsset?.asset?.type === AssetType.Deposit) {
      this.deposit = <DepositAsset>this.viewAsset.asset;
    }
  }

  get isDeposit(): boolean {
    return !!this.deposit;
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
    if (Asset.isDebt(type)) {
      return 'debt';
    }
    if (type === AssetType.Deposit) {
      return 'deposit';
    }
    return 'cash';
  }

  get displayName(): string {
    return this.viewAsset?.asset?.description ||
      (this.viewAsset?.asset?.currency ? `${this.viewAsset.asset.currency} Cash` : 'Cash Asset');
  }

  get payableInterest(): number | null {
    if (!this.deposit || !this.deposit.creationDate || !this.deposit.maturityDate || typeof this.deposit.getPayableInterest !== 'function') {
      return null;
    }
    const val = this.deposit.getPayableInterest();
    return isNaN(val) ? null : val;
  }

  get grossInterest(): number | null {
    if (!this.deposit || !this.deposit.creationDate || !this.deposit.maturityDate || typeof this.deposit.getFullInterest !== 'function') {
      return null;
    }
    const val = this.deposit.getFullInterest();
    return isNaN(val) ? null : val;
  }

  get withholdingTax(): number | null {
    if (!this.deposit?.withholdInterestTax || typeof this.deposit.getWithholdingTax !== 'function') {
      return null;
    }
    const val = this.deposit.getWithholdingTax();
    return isNaN(val) ? null : val;
  }

  get daysToMaturity(): number | null {
    if (!this.deposit?.maturityDate) {
      return null;
    }
    const maturity = new Date(this.deposit.maturityDate);
    if (isNaN(maturity.getTime())) {
      return null;
    }
    maturity.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = maturity.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  get termDays(): number | null {
    if (!this.deposit?.creationDate || !this.deposit?.maturityDate) {
      return null;
    }
    if (typeof this.deposit.getPeriod === 'function') {
      const period = this.deposit.getPeriod();
      if (!isNaN(period) && period > 0) {
        return Math.round(period / (1000 * 60 * 60 * 24));
      }
    }
    const start = new Date(this.deposit.creationDate).getTime();
    const end = new Date(this.deposit.maturityDate).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) {
      return null;
    }
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
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
