import { Component, OnInit, Inject, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, Validators, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Asset, AssetType } from '../../models/asset';
import { TransactionType } from '../../models/transaction';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { RecurringTransaction } from '../../models/recurring-transaction';
import { PortfolioAccount } from '../../models/portfolio-account';

/**
 * Data provided as input to the `CostTransactionEditComponent` dialog
 */
export interface CostTransactionEditData {
  asset: Asset;
  account: PortfolioAccount;
}

/**
 * Holds the response from the `CostTransactionEditComponent` dialog
 */
export interface CostTransactionEditResponse {
  amount: number;
  fee: number;
  description: string;
  transactionDate: string;
  recurringTransaction: RecurringTransaction;
  updateCashAssetBalance: boolean;
  cashAsset: Asset;
}

/**
 * Validates that the user provided amount + fees do not exceed the cash asset's balance
 * @param cashAssetCtrl cash asset control
 * @param feeCtrl fee form control
 */
const cashAmountValidator = (cashAssetCtrl: UntypedFormControl, feeCtrl: UntypedFormControl) => {
  return (amountCtrl: UntypedFormControl): ValidationErrors | null => {
    const amount = amountCtrl.value;
    return amount < 0 || (cashAssetCtrl.value && amount > FloatingMath.fixRoundingError(cashAssetCtrl.value.amount - feeCtrl.value)) ?
      { 'invalidRange': true } : null;
  };
};

/**
 * Component to display a UI for debiting/crediting a cash asset
 */
@Component({
  selector: 'app-cost-transaction-edit',
  templateUrl: './cost-transaction-edit.component.html',
  styleUrls: ['./cost-transaction-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostTransactionEditComponent implements OnInit, OnDestroy {

  assetForm: UntypedFormGroup;
  amount: UntypedFormControl;
  cashAsset: UntypedFormControl;
  cashAssets: Asset[];
  description: UntypedFormControl;
  fee: UntypedFormControl;
  enableRecurringTransaction: UntypedFormControl;
  transactionDate: UntypedFormControl;
  todayDate: Date;
  isScheduledTx = false;
  updateCashAssetBalance: UntypedFormControl;

  readonly TransactionType = TransactionType;

  @ViewChild('recurringTransaction') private readonly recurringTransaction: RecurringTransactionInputComponent;
  private readonly componentDestroyed$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<CostTransactionEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CostTransactionEditData,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    let defaultCashAsset = null;
    if (this.data.asset) {
      defaultCashAsset = this.data.account.getAssetById(this.data.asset.cashAssetId);
    }

    this.cashAsset = new UntypedFormControl(defaultCashAsset);
    this.amount = new UntypedFormControl();
    this.fee = new UntypedFormControl(0, [Validators.min(0)]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.amount.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    this.description = new UntypedFormControl('Cost for ' + this.data.asset.description);
    this.enableRecurringTransaction = new UntypedFormControl();
    this.transactionDate = new UntypedFormControl(new Date());
    this.updateCashAssetBalance = new UntypedFormControl(true);

    this.assetForm = new UntypedFormGroup({
      amount: this.amount,
      cashAsset: this.cashAsset,
      description: this.description,
      enableRecurringTransaction: this.enableRecurringTransaction,
      fee: this.fee,
      transactionDate: this.transactionDate,
      updateCashAssetBalance: this.updateCashAssetBalance,
    });

    this.assetForm.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.setAmountValidators();
    this.loadData();
    this.onTxDateChanged();
  }

  /**
   * Title displayed in dialog header
   */
  get dialogTitle(): string {
    return `Add cost for ${this.data.asset?.description || ''}`;
  }

  /**
   * Gross cost amount
   */
  get grossAmount(): number {
    return Number(this.amount?.value) || 0;
  }

  /**
   * Net total cost value factoring in fees
   */
  get totalCostValue(): number {
    const amountVal = this.grossAmount;
    const feeVal = Number(this.fee?.value) || 0;
    return FloatingMath.fixRoundingError(amountVal + feeVal);
  }

  onTxDateChanged() {
    this.isScheduledTx = DateUtils.compareDates(new Date(this.transactionDate.value), this.todayDate) > 0;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const data: CostTransactionEditResponse = {
        amount: this.amount.value,
        transactionDate: getDateAsISOString(this.transactionDate.value),
        description: this.description.value,
        fee: this.fee.value,
        recurringTransaction: this.enableRecurringTransaction.value ? this.recurringTransaction.getRecurringTransactionDetails() : null,
        updateCashAssetBalance: this.updateCashAssetBalance.value,
        cashAsset: this.cashAsset.value,
      };
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close(null);
    }
  }

  setAmountValidators() {
    const validators = [];
    if (this.updateCashAssetBalance.value) {
      validators.push(cashAmountValidator(this.cashAsset, this.fee));
    }
    this.amount.setValidators(validators);
    this.amount.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Triggered when user clicks "Automatically debit cash account balance" checkbox
   */
  updateCashAssetBalanceToggled() {
    this.setAmountValidators();
  }

  cashAssetChanged() {
    this.amount.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Load account and asset data
   */
  private async loadData() {
    this.cashAssets = this.data.account.assets
      .filter(asset => asset.type === AssetType.Cash && (asset.currency === this.data.asset.currency));

    this.cdr.markForCheck();
  }
}
