import { Component, OnInit, Inject, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, Validators, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Asset } from '../../models/asset';
import { TransactionType, Transaction } from '../../models/transaction';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { RecurringTransaction } from '../../models/recurring-transaction';

/**
 * Data provided as input to the `CashFundComponent` dialog
 */
export interface CashFundData {
  asset: Asset;
  transactionType: TransactionType;
}

/**
 * Holds the response from the `CashFundComponent` dialog
 */
export interface CashFundResponse {
  amount: number;
  fee: number;
  description: string;
  transactionDate: string;
  recurringTransaction: RecurringTransaction;
}

/**
 * Validates that the user provided amount + fees do not cause the asset's balance to fall below 0
 * (or exceed 0 for debt assets)
 * @param cashAsset cash asset (or a function returning it)
 * @param feeCtrl fee form control (or a function returning the fee value)
 * @param isCreditTx whether the transaction is credit (or a function returning it)
 */
export const cashAmountValidator = (
  cashAsset: Asset | (() => Asset),
  feeCtrl: UntypedFormControl | (() => number),
  isCreditTx: boolean | (() => boolean)
) => {
  return (amountCtrl: UntypedFormControl): ValidationErrors | null => {
    const asset = typeof cashAsset === 'function' ? cashAsset() : cashAsset;
    if (!asset) {
      return null;
    }
    const isCredit = typeof isCreditTx === 'function' ? isCreditTx() : isCreditTx;
    const amount = Number(amountCtrl.value);
    const fee = typeof feeCtrl === 'function' ? Number(feeCtrl()) || 0 : Number(feeCtrl?.value) || 0;
    if (isNaN(amount) || amount <= 0) {
      return null;
    }

    if (asset.isDebt()) {
      if (isCredit) {
        // Crediting debt pays off debt (debt balance is <= 0). Balance cannot exceed 0.
        const newBalance = FloatingMath.fixRoundingError(asset.amount + amount - fee);
        return newBalance > 0 ? { 'invalidRange': true } : null;
      }
      return null;
    }

    const newBalance = isCredit
      ? FloatingMath.fixRoundingError(asset.amount + amount - fee)
      : FloatingMath.fixRoundingError(asset.amount - amount - fee);

    return newBalance < 0 ? { 'invalidRange': true } : null;
  };
};

/**
 * Component to display a UI for debiting/crediting a cash asset
 */
@Component({
  selector: 'app-cash-fund',
  templateUrl: './cash-fund.component.html',
  styleUrls: ['./cash-fund.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashFundComponent implements OnInit, OnDestroy {

  assetForm: UntypedFormGroup;
  amount: UntypedFormControl;
  description: UntypedFormControl;
  enableRecurringTransaction: UntypedFormControl;
  fee: UntypedFormControl;
  isScheduledTx = false;
  isCreditTx = false;
  transactionDate: UntypedFormControl;
  todayDate: Date;
  @ViewChild('recurringTransaction') private readonly recurringTransaction: RecurringTransactionInputComponent;

  private readonly componentDestroyed$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<CashFundComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CashFundData,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.isCreditTx = Transaction.isCredit(this.data.transactionType);

    this.fee = new UntypedFormControl(0, [Validators.min(0)]);
    this.amount = new UntypedFormControl(0, [
      Validators.required,
      Validators.min(Number.EPSILON),
      cashAmountValidator(() => this.data?.asset, this.fee, () => this.isCreditTx)
    ]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.amount.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    const defDesc = (this.isCreditTx ? 'Credit ' : 'Debit ') + this.data.asset.description;
    this.description = new UntypedFormControl(defDesc);
    this.enableRecurringTransaction = new UntypedFormControl();
    this.transactionDate = new UntypedFormControl(new Date());

    this.assetForm = new UntypedFormGroup({
      amount: this.amount,
      description: this.description,
      enableRecurringTransaction: this.enableRecurringTransaction,
      fee: this.fee,
      transactionDate: this.transactionDate,
    });

    this.assetForm.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.onTxDateChanged();
  }

  /**
   * Title displayed in dialog header
   */
  get dialogTitle(): string {
    return `${this.isCreditTx ? 'Credit' : 'Debit'} ${this.data.asset?.description || ''}`;
  }

  /**
   * Gross transaction amount
   */
  get grossAmount(): number {
    return Number(this.amount?.value) || 0;
  }

  /**
   * Net total transaction value factoring in fees
   */
  get totalTransactionValue(): number {
    const amountVal = this.grossAmount;
    const feeVal = Number(this.fee?.value) || 0;
    if (this.isCreditTx) {
      return FloatingMath.fixRoundingError(amountVal - feeVal);
    } else {
      return FloatingMath.fixRoundingError(amountVal + feeVal);
    }
  }

  /**
   * Maximum allowed amount when debiting a cash asset or paying off debt
   */
  get maxAmount(): number {
    const feeVal = Number(this.fee?.value) || 0;
    const assetAmount = this.data?.asset?.amount || 0;
    if (this.data?.asset?.isDebt()) {
      return Math.max(0, FloatingMath.fixRoundingError(Math.abs(assetAmount) + feeVal));
    }
    return Math.max(0, FloatingMath.fixRoundingError(assetAmount - feeVal));
  }

  /**
   * Minimum required amount when crediting a cash asset to avoid negative balance
   */
  get minCreditAmount(): number {
    const feeVal = Number(this.fee?.value) || 0;
    const assetAmount = this.data?.asset?.amount || 0;
    return Math.max(0, FloatingMath.fixRoundingError(feeVal - assetAmount));
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
      const data: CashFundResponse = {
        amount: this.amount.value,
        transactionDate: getDateAsISOString(this.transactionDate.value),
        description: this.description.value,
        fee: this.fee.value,
        recurringTransaction: this.enableRecurringTransaction.value ? this.recurringTransaction.getRecurringTransactionDetails() : null,
      };
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close(null);
    }
  }
}
