import { Component, OnInit, Inject, ViewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';

import { Asset } from '../../models/asset';
import { TransactionType } from '../../models/transaction';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { RecurringTransaction } from '../../models/recurring-transaction';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
 * Validates that the user provided amount + fees do not exceed the cash asset's balance
 * @param cashAsset cash asset
 * @param feeCtrl fee form control
 */
const cashAmountValidator = (cashAsset: Asset, feeCtrl: FormControl) => {
  return (amountCtrl: FormControl): ValidationErrors | null => {
    const amount = amountCtrl.value;
    return amount < 0 || (amount > FloatingMath.fixRoundingError(cashAsset.amount - feeCtrl.value)) ?
      { 'invalidRange': true } : null;
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

  assetForm: FormGroup;
  amount: FormControl;
  description: FormControl;
  fee: FormControl;
  enableRecurringTransaction: FormControl;
  transactionDate: FormControl;
  todayDate: Date;
  isScheduledTx = false;
  readonly TransactionType = TransactionType;
  @ViewChild('recurringTransaction', { static: false }) private readonly recurringTransaction: RecurringTransactionInputComponent;

  private componentDestroyed$ = new Subject();

  constructor(public dialogRef: MatDialogRef<CashFundComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CashFundData) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);

    this.amount = new FormControl(0);
    this.fee = new FormControl(0, [Validators.min(0)]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity());

    if (this.data.transactionType === TransactionType.CreditCash) {
      this.amount.setValidators([Validators.min(0)]);
    } else {
      this.amount.setValidators([cashAmountValidator(this.data.asset, this.fee)]);
    }
    const defDesc = (this.data.transactionType === TransactionType.CreditCash ? 'Credit ' : 'Debit ') + this.data.asset.description;
    this.description = new FormControl(defDesc);
    this.enableRecurringTransaction = new FormControl();
    this.transactionDate = new FormControl(new Date());

    this.assetForm = new FormGroup({
      amount: this.amount,
      description: this.description,
      enableRecurringTransaction: this.enableRecurringTransaction,
      fee: this.fee,
      transactionDate: this.transactionDate,
    });
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
