import { Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RecurringTransactionType, RecurringTransaction } from '../../models/recurring-transaction';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Component for displaying fields specific to a recurring transaction. Can be integrated
 * in components that support recurring transactions.
 */
@Component({
  selector: 'app-recurring-transaction-input',
  templateUrl: './recurring-transaction-input.component.html',
  styleUrls: ['./recurring-transaction-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringTransactionInputComponent implements OnInit, OnDestroy {

  @Input('form') parentForm: FormGroup;
  @Input('recurringTransaction') recTx: RecurringTransaction;
  autoApproveRecurring: FormControl;
  enableRecurringTransaction: FormControl;
  recurringPeriod: FormControl;
  recurringTransactionsLeft: FormControl;
  recurringType: FormControl;

  readonly RecurringTransactionType = RecurringTransactionType;

  private componentDestroyed$ = new Subject();

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    if (!this.recTx) {
      this.recTx = new RecurringTransaction();
    }
    this.autoApproveRecurring = new FormControl(this.recTx.autoApprove);
    this.recurringTransactionsLeft = new FormControl(this.recTx.transactionsLeft < 0 ? null : this.recTx.transactionsLeft);
    this.recurringPeriod = new FormControl(this.recTx.period);
    this.recurringType = new FormControl(this.recTx.type);
    this.recurringType.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((newValue: RecurringTransactionType) => {
        // no UI interaction here, queue the event
        setTimeout(() => {
          this.recurringTypeValueChanged(newValue);
        });
      });
    this.parentForm.addControl('autoApproveRecurring', this.autoApproveRecurring);
    this.parentForm.addControl('recurringPeriod', this.recurringPeriod);
    this.parentForm.addControl('recurringTransactionsLeft', this.recurringTransactionsLeft);
    this.parentForm.addControl('recurringType', this.recurringType);
    this.enableRecurringTransaction = <FormControl>this.parentForm.get('enableRecurringTransaction');
    if (this.enableRecurringTransaction) {
      this.enableRecurringTransaction.valueChanges
        .pipe(takeUntil(this.componentDestroyed$))
        .subscribe((enabled) => {
          // no UI interaction here, queue the event
          setTimeout(() => {
            this.recurringTransactionValueChanged(enabled);
          });
        });
      this.recurringTransactionValueChanged(this.enableRecurringTransaction.value);
    }
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  recurringTypeValueChanged(newValue: RecurringTransactionType) {
    if (this.recurringType.enabled
      && newValue >= RecurringTransactionType.AfterGivenDays
      && newValue <= RecurringTransactionType.EveryGivenMonths) {
      this.recurringPeriod.enable();
    } else {
      this.recurringPeriod.disable();
    }
    this.cdr.markForCheck();
  }

  recurringTransactionValueChanged(enabled: boolean) {
    if (enabled) {
      this.autoApproveRecurring.enable();
      this.recurringPeriod.enable();
      this.recurringTransactionsLeft.enable();
      this.recurringType.enable();
    } else {
      this.autoApproveRecurring.disable();
      this.recurringPeriod.disable();
      this.recurringTransactionsLeft.disable();
      this.recurringType.disable();
    }
    this.cdr.markForCheck();
  }

  /**
   * returns a RecurringTransaction with data filled from input values
   */
  getRecurringTransactionDetails() {
    this.recTx.inactive = false;
    this.recTx.type = this.recurringType.value;
    this.recTx.autoApprove = this.autoApproveRecurring.value || false;
    this.recTx.period = this.recurringPeriod.value || 0;
    this.recTx.transactionsLeft = this.recurringTransactionsLeft.value || -1;
    return this.recTx;
  }


}
