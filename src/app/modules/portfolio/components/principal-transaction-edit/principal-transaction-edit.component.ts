import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { BondAsset } from '../../models/bond-asset';

export interface PrincipalTxEditData {
  account: PortfolioAccount;
  asset: BondAsset;
}

/**
 * Holds the response from the `PrincipalTransactionEditComponent` dialog
 */
export interface PrincipalTxEditResponse {
  cashAsset: Asset;
  creditCashAsset: boolean;
  fee: number;
  principalPayment: number;
  transactionDate: string;
}

/**
 * Component to display a UI for editing data for a bond principal payment transaction
 */

@Component({
  selector: 'app-principal-transaction-edit',
  templateUrl: './principal-transaction-edit.component.html',
  styleUrls: ['./principal-transaction-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrincipalTransactionEditComponent implements OnInit {

  assetCurrency: string;
  assetForm: FormGroup;
  principalPayment: FormControl;
  account: PortfolioAccount;
  cashAssets: Asset[];
  cashAsset: FormControl;
  fee: FormControl;
  isScheduledTx = false;
  transactionDate: FormControl;
  todayDate: Date;
  updateCashAssetBalance: FormControl;


  constructor(public dialogRef: MatDialogRef<PrincipalTransactionEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrincipalTxEditData) { }

  ngOnInit() {
    this.account = this.data.account;
    this.cashAsset = new FormControl();
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.principalPayment = new FormControl(this.data.asset.principalAmount,
      [
        Validators.min(Number.EPSILON),
        Validators.max(this.data.asset.principalAmount)
      ]);
    this.fee = new FormControl(0, [Validators.min(0)]);
    this.assetCurrency = this.data.asset.currency;
    this.transactionDate = new FormControl(new Date());
    this.updateCashAssetBalance = new FormControl(true);
    this.assetForm = new FormGroup({
      principalPayment: this.principalPayment,
      cashAsset: this.cashAsset,
      fee: this.fee,
      transactionDate: this.transactionDate,
      updateCashAssetBalance: this.updateCashAssetBalance,
    });

    this.loadData();
  }

  /**
   * Fired when the value of the transaction date input control changes
   */
  onTxDateChanged() {
    this.isScheduledTx = DateUtils.compareDates(new Date(this.transactionDate.value), this.todayDate) > 0;
    if (this.isScheduledTx) {
      this.updateCashAssetBalance.disable();
    } else {
      this.updateCashAssetBalance.enable();
    }
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const response: PrincipalTxEditResponse = {
        cashAsset: this.cashAsset.value,
        creditCashAsset: this.updateCashAssetBalance.value,
        fee: this.fee.value,
        principalPayment: this.principalPayment.value,
        transactionDate: getDateAsISOString(this.transactionDate.value),
      };
      this.dialogRef.close(response);
    } else {
      this.dialogRef.close(null);
    }
  }

  /**
   * Load account and asset data
  */
  private loadData() {
    this.cashAssets = this.account.assets
      .filter(asset => asset.type === AssetType.Cash && (asset.currency === this.data.asset.currency));
    let cash: Asset;
    if (this.data.asset.cashAssetId) {
      cash = this.account.getAssetById(this.data.asset.cashAssetId);
    }
    this.cashAsset.setValue(cash);
  }
}
