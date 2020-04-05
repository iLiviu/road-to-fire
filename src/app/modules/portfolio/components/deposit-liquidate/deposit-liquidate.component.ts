import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl } from '@angular/forms';

import { AssetType, Asset } from '../../models/asset';
import { PortfolioAccount } from '../../models/portfolio-account';
import { getDateAsISOString } from 'src/app/shared/util';
import { DepositAsset } from '../../models/deposit-asset';

/**
 * Data provided as input to the `DepositLiquidateComponent` dialog
 */
export interface DepositLiquidateData {
  deposit: DepositAsset;
  account: PortfolioAccount;
}

/**
 * Holds the response from the `DepositLiquidateComponent` dialog
 */
export interface DepositLiquidateResponse {
  cashAsset: Asset;
  transactionDate: string;
  creditInterest: boolean;
}

/**
 * Component to display a UI for liquidating a deposit
 */
@Component({
  selector: 'app-deposit-liquidate',
  templateUrl: './deposit-liquidate.component.html',
  styleUrls: ['./deposit-liquidate.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepositLiquidateComponent implements OnInit {

  assetForm: FormGroup;
  cashAsset: FormControl;
  cashAssets: Asset[];
  creditInterest: FormControl;
  transactionDate: FormControl;
  todayDate: Date;

  constructor(public dialogRef: MatDialogRef<DepositLiquidateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepositLiquidateData) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.cashAssets = this.data.account.assets
      .filter(asset => asset.type === AssetType.Cash && asset.currency === this.data.deposit.currency);

    this.cashAsset = new FormControl();
    this.transactionDate = new FormControl(new Date());
    this.creditInterest = new FormControl(true);
    this.assetForm = new FormGroup({
      cashAsset: this.cashAsset,
      transactionDate: this.transactionDate,
      creditInterest: this.creditInterest,
    });
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const result: DepositLiquidateResponse = {
        cashAsset: this.cashAsset.value,
        creditInterest: this.creditInterest.value,
        transactionDate: getDateAsISOString(this.transactionDate.value),
      };
      this.dialogRef.close(result);
    } else {
      this.dialogRef.close(null);
    }
  }
}
