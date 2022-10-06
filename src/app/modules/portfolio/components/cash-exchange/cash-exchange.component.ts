import { Component, OnInit, Inject, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
  sourceAsset: Asset;
  destinationAsset: Asset;
  amount: number;
  rate: number;
  fee: number;
  transactionDate: string;
  description: string;
  addForexPosition: boolean;
  updateCashBalances: boolean;
}

/**
 * Validates that the user provided amount + fees do not exceed the cash/debt balance.
 * If we are validating debt, ignore fee in maximum balance as it's passed to destination.
 *
 * @param cashAsset cash/debt asset to validate
 * @param feeControl fee form control object
 */
const cashAmountValidator = (cashAsset: Asset, feeControl: FormControl) => {
  return (control: FormControl): ValidationErrors | null => {
    const amount = control.value;
    let invalidRange: boolean;
    if (cashAsset.amount < 0) {
      invalidRange = amount > 0 || amount < cashAsset.amount;
    } else {
      invalidRange = amount < 0 || amount > FloatingMath.fixRoundingError(cashAsset.amount - feeControl.value);
    }
    return invalidRange ? { 'invalidRange': true } : null;
  };
};

/**
 * Component to display a UI for exchanging cash/debt from a currency to another
 */
@Component({
  selector: 'app-cash-exchange',
  templateUrl: './cash-exchange.component.html',
  styleUrls: ['./cash-exchange.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashExchangeComponent implements OnInit, OnDestroy {

  addForexPosition: FormControl;
  amount: FormControl;
  assetForm: FormGroup;
  cashAssets: Asset[];
  debtFlag: number;
  description: FormControl;
  destinationAsset: FormControl;
  fee: FormControl;
  rate: FormControl;
  sourceAsset: FormControl;
  transactionDate: FormControl;
  todayDate: Date;
  updateCashBalances: FormControl;

  private componentDestroyed$ = new Subject();

  constructor(public dialogRef: MatDialogRef<CashExchangeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CashExchangeData) { }

  ngOnInit() {
    // can only exchange to assets of same type as source (either cash or debt)
    this.cashAssets = this.data.account.assets
      .filter(asset => asset.type === this.data.sourceAsset.type && asset.currency !== this.data.sourceAsset.currency);
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.debtFlag = (this.data.sourceAsset.amount < 0) ? 1 : 0;

    this.fee = new FormControl(0, [Validators.min(0)]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity());
    this.amount = new FormControl(0);
    this.sourceAsset = new FormControl(this.data.sourceAsset);
    this.destinationAsset = new FormControl();
    this.rate = new FormControl(1, [Validators.min(0)]);
    this.transactionDate = new FormControl(new Date());
    this.description = new FormControl('');
    this.addForexPosition = new FormControl(false);
    this.updateCashBalances = new FormControl(true);
    this.assetForm = new FormGroup({
      sourceAsset: this.sourceAsset,
      destinationAsset: this.destinationAsset,
      amount: this.amount,
      rate: this.rate,
      fee: this.fee,
      transactionDate: this.transactionDate,
      description: this.description,
      addForexPosition: this.addForexPosition,
      updateCashBalances: this.updateCashBalances,
    });
    this.destinationAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.transactionValuesChanged());
    this.rate.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.transactionValuesChanged());
    this.sourceAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.transactionValuesChanged());
    this.updateAmountValidators();

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
    return (this.sourceAsset.value && this.destinationAsset.value) ?
      `Exchange ${this.data.sourceAsset.currency}/${this.destinationAsset.value.currency} @ ${this.rate.value}` : '';
  }

  updateAmountValidators() {
    if (this.updateCashBalances.value) {
      this.amount.setValidators([cashAmountValidator(this.data.sourceAsset, this.fee)]);
    } else {
      this.amount.setValidators([]);
    }
  }

  updateCashBalancesToggled() {
    this.updateAmountValidators();
    this.amount.updateValueAndValidity();
  }


  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const data: CashExchangeResponse = {
        amount: this.amount.value,
        sourceAsset: this.sourceAsset.value,
        destinationAsset: this.destinationAsset.value,
        fee: this.fee.value,
        rate: this.rate.value,
        transactionDate: getDateAsISOString(this.transactionDate.value),
        description: this.description.value,
        addForexPosition: this.addForexPosition.value,
        updateCashBalances: this.updateCashBalances.value,
      };
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close(null);
    }
  }
}
