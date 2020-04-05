import { Component, OnInit, Inject, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';

import { Asset, AssetType } from '../../models/asset';
import { TransactionType } from '../../models/transaction';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { RecurringTransaction } from '../../models/recurring-transaction';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
 * @param cashAsset cash asset
 * @param feeCtrl fee form control
 */
const cashAmountValidator = (cashAssetCtrl: FormControl, feeCtrl: FormControl) => {
  return (amountCtrl: FormControl): ValidationErrors | null => {
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

  assetForm: FormGroup;
  amount: FormControl;
  cashAsset: FormControl;
  cashAssets: Asset[];
  description: FormControl;
  fee: FormControl;
  enableRecurringTransaction: FormControl;
  transactionDate: FormControl;
  todayDate: Date;
  isScheduledTx = false;
  updateCashAssetBalance: FormControl;

  readonly TransactionType = TransactionType;

  @ViewChild('recurringTransaction') private readonly recurringTransaction: RecurringTransactionInputComponent;
  private componentDestroyed$ = new Subject();

  constructor(public dialogRef: MatDialogRef<CostTransactionEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CostTransactionEditData, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    let defaultCashAsset = null;
    if (this.data.asset) {
      defaultCashAsset = this.data.account.getAssetById(this.data.asset.cashAssetId);
    }

    this.cashAsset = new FormControl(defaultCashAsset);
    this.amount = new FormControl();
    this.fee = new FormControl(0, [Validators.min(0)]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity());

    this.description = new FormControl('Cost for ' + this.data.asset.description);
    this.enableRecurringTransaction = new FormControl();
    this.transactionDate = new FormControl(new Date());
    this.updateCashAssetBalance = new FormControl(true);

    this.assetForm = new FormGroup({
      amount: this.amount,
      cashAsset: this.cashAsset,
      description: this.description,
      enableRecurringTransaction: this.enableRecurringTransaction,
      fee: this.fee,
      transactionDate: this.transactionDate,
      updateCashAssetBalance: this.updateCashAssetBalance,
    });

    this.setAmountValidators();
    this.loadData();
  }

  onTxDateChanged() {
    this.isScheduledTx = DateUtils.compareDates(new Date(this.transactionDate.value), this.todayDate) > 0;
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
  }

  /**
   * Triggered when user clicks "Automatically debit cash account balance" checkbox
   */
  updateCashAssetBalanceToggled() {
    this.setAmountValidators();
  }

  cashAssetChanged() {
    this.amount.updateValueAndValidity();
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
