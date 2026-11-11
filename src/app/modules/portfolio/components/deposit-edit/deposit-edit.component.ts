import { Component, OnInit, Inject, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { getDateAsISOString, FloatingMath } from 'src/app/shared/util';
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
const depositAmountValidator = (cashAssetControl: UntypedFormControl) => {
  return (control: UntypedFormControl): ValidationErrors | null => {
    const amount = control.value;
    const cashAsset = cashAssetControl?.value as Asset;
    return amount < 0 || (cashAsset && amount > cashAsset.amount) ? { 'invalidRange': true } : null;
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

  assetForm: UntypedFormGroup;
  amount: UntypedFormControl;
  description: UntypedFormControl;
  autoRenew: UntypedFormControl;
  cashAsset: UntypedFormControl;
  cashAssets: Asset[];
  capitalize: UntypedFormControl;
  creationDate: UntypedFormControl;
  debitAccount: UntypedFormControl;
  interestRate: UntypedFormControl;
  interestTaxRate: UntypedFormControl;
  maturityDate: UntypedFormControl;
  todayDate: Date;
  withholdInterestTax: UntypedFormControl;

  private readonly componentDestroyed$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<DepositEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepositEditData,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.cashAssets = this.data.account.assets.filter(asset => asset.type === AssetType.Cash);

    this.description = new UntypedFormControl(this.data.asset.description);
    this.autoRenew = new UntypedFormControl(this.data.asset.autoRenew);
    this.interestRate = new UntypedFormControl(FloatingMath.fixRoundingError(this.data.asset.interestRate * 100) || 0);
    this.capitalize = new UntypedFormControl(this.data.asset.capitalize);
    this.creationDate = new UntypedFormControl(this.data.asset.creationDate || new Date());
    this.maturityDate = new UntypedFormControl(this.data.asset.maturityDate || new Date());
    this.debitAccount = new UntypedFormControl(true);
    this.amount = new UntypedFormControl(this.data.asset.amount || 0);
    this.cashAsset = new UntypedFormControl(this.cashAssets.length > 0 ? this.cashAssets[0] : null);
    this.cashAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.amount.updateValueAndValidity();
        this.cdr.markForCheck();
      });
    this.updateAmountValidators();
    this.interestTaxRate = new UntypedFormControl(FloatingMath.fixRoundingError(this.data.asset.interestTaxRate * 100) || 0,
      [Validators.min(0), Validators.max(100)]);
    this.withholdInterestTax = new UntypedFormControl(this.data.asset.withholdInterestTax);
    this.assetForm = new UntypedFormGroup({
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

    this.assetForm.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  debitAccountToggled() {
    this.updateAmountValidators();
  }

  get selectedCashAsset(): Asset {
    return this.cashAsset?.value;
  }

  get dialogTitle(): string {
    return `${this.data.asset.id ? 'Edit' : 'New'} Deposit`;
  }

  get grossAmount(): number {
    return Number(this.amount?.value) || 0;
  }

  get depositCurrency(): string {
    return this.selectedCashAsset?.currency || this.data.asset?.currency || '';
  }

  get pillIcon(): string {
    return this.data.asset?.id ? 'savings' : 'account_balance_wallet';
  }

  get termDays(): number {
    if (this.creationDate?.value && this.maturityDate?.value) {
      const start = new Date(this.creationDate.value);
      start.setHours(0, 0, 0, 0);
      const end = new Date(this.maturityDate.value);
      end.setHours(0, 0, 0, 0);
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }
    return 0;
  }

  get estGrossInterest(): number {
    const rate = (Number(this.interestRate?.value) || 0) / 100;
    const amount = this.grossAmount;
    const days = this.termDays;
    if (days <= 0 || rate <= 0 || amount <= 0) {
      return 0;
    }
    return FloatingMath.fixRoundingError((days / 365) * rate * amount);
  }

  get estPayableInterest(): number {
    let interest = this.estGrossInterest;
    if (this.withholdInterestTax?.value) {
      const taxRate = (Number(this.interestTaxRate?.value) || 0) / 100;
      interest = FloatingMath.fixRoundingError(interest * (1 - taxRate));
    }
    return interest;
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
      this.data.asset.capitalize = this.capitalize.value || false;
      this.data.asset.creationDate = getDateAsISOString(this.creationDate.value);
      this.data.asset.maturityDate = getDateAsISOString(this.maturityDate.value);
      this.data.asset.withholdInterestTax = this.withholdInterestTax.value || false;
      this.data.asset.interestTaxRate = this.interestTaxRate.value / 100;
      if (!this.data.asset.id && this.selectedCashAsset) {
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
