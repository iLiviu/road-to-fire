import { Component, OnInit, Inject, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { getDateAsISOString, FloatingMath } from 'src/app/shared/util';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DepositAsset } from '../../models/deposit-asset';

/**
 * Data provided as input to the `DepositEditComponent` dialog
 */
export interface DepositEditData {
  account: PortfolioAccount;
  asset: DepositAsset;
}

/**
 * Holds the response from the `DepositEditComponent` dialog
 */
export interface DepositEditResponse {
  asset: DepositAsset;
  sourceAsset: Asset;
  debitAccount: boolean;
}

/**
 * Validate if the input is positive and does not exceed the balance of the cash asset
 * @param cashAssetControl cash asset form control
 */
const depositAmountValidator = (cashAssetControl: FormControl) => {
  return (control: FormControl): ValidationErrors | null => {
    const amount = control.value;
    return amount < 0 || amount > (<Asset>cashAssetControl.value).amount ? { 'invalidRange': true } : null;
  };
};


/**
 * Component to display a UI for editing data for a new or existing deposit
 */
@Component({
  selector: 'app-deposit-edit',
  templateUrl: './deposit-edit.component.html',
  styleUrls: ['./deposit-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepositEditComponent implements OnInit, OnDestroy {

  assetForm: FormGroup;
  amount: FormControl;
  description: FormControl;
  autoRenew: FormControl;
  cashAsset: FormControl;
  cashAssets: Asset[];
  capitalize: FormControl;
  creationDate: FormControl;
  debitAccount: FormControl;
  interestRate: FormControl;
  interestTaxRate: FormControl;
  maturityDate: FormControl;
  todayDate: Date;
  withholdInterestTax: FormControl;

  private componentDestroyed$ = new Subject();


  constructor(public dialogRef: MatDialogRef<DepositEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepositEditData) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.cashAssets = this.data.account.assets.filter(asset => asset.type === AssetType.Cash);

    this.description = new FormControl(this.data.asset.description);
    this.autoRenew = new FormControl(this.data.asset.autoRenew);
    this.interestRate = new FormControl(FloatingMath.fixRoundingError(this.data.asset.interestRate * 100) || 0);
    this.capitalize = new FormControl(this.data.asset.capitalize);
    this.creationDate = new FormControl(this.data.asset.creationDate || new Date());
    this.maturityDate = new FormControl(this.data.asset.maturityDate || new Date());
    this.debitAccount = new FormControl(true);
    this.amount = new FormControl(this.data.asset.amount || 0);
    this.cashAsset = new FormControl(this.cashAssets.length > 0 ? this.cashAssets[0] : null);
    this.cashAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity()); // need to recheck amount validation
    this.updateAmountValidators();
    this.interestTaxRate = new FormControl(FloatingMath.fixRoundingError(this.data.asset.interestTaxRate * 100) || 0,
      [Validators.min(0), Validators.max(100)]);
    this.withholdInterestTax = new FormControl(this.data.asset.withholdInterestTax);
    this.assetForm = new FormGroup({
      amount: this.amount,
      description: this.description,
      autoRenew: this.autoRenew,
      interestRate: this.interestRate,
      capitalize: this.capitalize,
      creationDate: this.creationDate,
      maturityDate: this.maturityDate,
      debitAccount: this.debitAccount,
      cashAsset: this.cashAsset,
      interestTaxRate: this.interestTaxRate,
      withholdInterestTax: this.withholdInterestTax,
    });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  updateAmountValidators() {
    if (!this.data.asset.id && this.debitAccount.value) {
      this.amount.setValidators([depositAmountValidator(this.cashAsset)]);
    } else {
      this.amount.setValidators([]);
    }
    this.amount.updateValueAndValidity();
  }

  debitAccountToggled() {
    this.updateAmountValidators();
  }

  get selectedCashAsset(): Asset {
    return this.cashAsset.value;
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      this.data.asset.type = AssetType.Deposit;
      this.data.asset.amount = this.amount.value;
      this.data.asset.description = this.description.value;
      this.data.asset.interestRate = this.interestRate.value / 100;
      this.data.asset.autoRenew = this.autoRenew.value || false;
      this.data.asset.capitalize = this.capitalize.valid || false;
      this.data.asset.creationDate = getDateAsISOString(this.creationDate.value);
      this.data.asset.maturityDate = getDateAsISOString(this.maturityDate.value);
      this.data.asset.withholdInterestTax = this.withholdInterestTax.value || false;
      this.data.asset.interestTaxRate = this.interestTaxRate.value / 100;
      if (!this.data.asset.id) {
        this.data.asset.currency = this.selectedCashAsset.currency;
        this.data.asset.cashAssetId = this.selectedCashAsset.id;
      }
      const result: DepositEditResponse = {
        asset: this.data.asset,
        sourceAsset: this.selectedCashAsset,
        debitAccount: this.debitAccount.value
      };
      this.dialogRef.close(result);
    } else {
      this.dialogRef.close(null);
    }
  }
}
