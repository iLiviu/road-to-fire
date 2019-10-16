import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { APP_CONSTS } from 'src/app/config/app.constants';
import { Asset, AssetType } from '../../models/asset';
import { getDateAsISOString } from 'src/app/shared/util';

/**
 * Holds the response from the `CashEditComponent` dialog
 */
export interface CashEditResponse {
  asset: Asset;
  transactionDate: string;
}

/**
 * Component to edit data for a cash asset
 */
@Component({
  selector: 'app-cash-edit',
  templateUrl: './cash-edit.component.html',
  styleUrls: ['./cash-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashEditComponent implements OnInit {

  assetForm: FormGroup;
  amount: FormControl;
  currency: FormControl;
  description: FormControl;
  transactionDate: FormControl;
  todayDate: Date;

  readonly currencyCodes = APP_CONSTS.CURRENCY_CODES;

  constructor(public dialogRef: MatDialogRef<CashEditComponent>,
    @Inject(MAT_DIALOG_DATA) public asset: Asset) {
  }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.description = new FormControl(this.asset.description);
    this.amount = new FormControl(this.asset.amount || 0);
    this.currency = new FormControl(this.asset.currency || 'USD');
    this.transactionDate = new FormControl(new Date());
    this.assetForm = new FormGroup({
      description: this.description,
      amount: this.amount,
      currency: this.currency,
      transactionDate: this.transactionDate,
    });
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      this.asset.type = AssetType.Cash;
      this.asset.amount = this.amount.value;
      this.asset.description = this.description.value;
      this.asset.currency = this.currency.value;
      const data: CashEditResponse = {
        asset: this.asset,
        transactionDate: getDateAsISOString(this.transactionDate.value)
      };
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close(null);
    }
  }
}
