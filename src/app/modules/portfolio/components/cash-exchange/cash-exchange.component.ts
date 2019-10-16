import { Component, OnInit, Inject, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Subscription, Subject } from 'rxjs';

import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { getDateAsISOString, FloatingMath } from 'src/app/shared/util';
import { takeUntil } from 'rxjs/operators';

/**
 * Data provided as input to the `CashExchangeComponent` dialog
 */
export interface CashExchangeData {
  account: PortfolioAccount;
  sourceAsset: Asset;
}

/**
 * Holds the response from the `CashExchangeComponent` dialog
 */
export interface CashExchangeResponse {
  destinationAsset: Asset;
  amount: number;
  rate: number;
  fee: number;
  transactionDate: string;
  description: string;
}

/**
 * Validates that the user provided amount + fees do not exceed the cash asset's balance
 *
 * @param cashAsset cash asset to validate
 * @param feeControl fee form control object
 */
const cashAmountValidator = (cashAsset: Asset, feeControl: FormControl) => {
  return (control: FormControl): ValidationErrors | null => {
    const amount = control.value;

    return amount < 0 || amount >  FloatingMath.fixRoundingError(cashAsset.amount - feeControl.value) ? { 'invalidRange': true } : null;
  };
};

/**
 * Component to display a UI for exchanging cash from a currency to another
 */
@Component({
  selector: 'app-cash-exchange',
  templateUrl: './cash-exchange.component.html',
  styleUrls: ['./cash-exchange.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashExchangeComponent implements OnInit, OnDestroy {

  amount: FormControl;
  assetForm: FormGroup;
  cashAssets: Asset[];
  destinationAsset: FormControl;
  fee: FormControl;
  rate: FormControl;
  transactionDate: FormControl;
  description: FormControl;
  todayDate: Date;

  private componentDestroyed$ = new Subject();

  constructor(public dialogRef: MatDialogRef<CashExchangeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CashExchangeData) { }

  ngOnInit() {
    this.cashAssets = this.data.account.assets
      .filter(asset => asset.type === AssetType.Cash && asset.currency !== this.data.sourceAsset.currency);
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);

    this.fee = new FormControl(0, [Validators.min(0)]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity());
    this.amount = new FormControl(0, [cashAmountValidator(this.data.sourceAsset, this.fee)]);
    this.destinationAsset = new FormControl();
    this.rate = new FormControl(1, [Validators.min(0)]);
    this.transactionDate = new FormControl(new Date());
    this.description = new FormControl('');
    this.assetForm = new FormGroup({
      destinationAsset: this.destinationAsset,
      amount: this.amount,
      rate: this.rate,
      fee: this.fee,
      transactionDate: this.transactionDate,
      description: this.description,
    });
    this.destinationAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.transactionValuesChanged());
    this.rate.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.transactionValuesChanged());
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  /**
   * Called when the value of rate or destination asset changes
   * Sets the default description for the transaction
   */
  transactionValuesChanged() {
    if (this.description.pristine) {
      this.description.setValue(this.generateDefaultDescription());
    }
  }

  /**
   * Generate a default description for transaction
   */
  generateDefaultDescription() {
    return (this.destinationAsset.value) ?
      `Exchange ${this.data.sourceAsset.currency}/${this.destinationAsset.value.currency} @ ${this.rate.value}` : '';
  }


  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const data: CashExchangeResponse = {
        amount: this.amount.value,
        destinationAsset: this.destinationAsset.value,
        fee: this.fee.value,
        rate: this.rate.value,
        transactionDate: getDateAsISOString(this.transactionDate.value),
        description: this.description.value,
      };
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close(null);
    }
  }
}
