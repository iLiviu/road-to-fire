import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

export interface RecurringTransactionFilters {
  showBondAndDepositTransactions: boolean;
  showDividendTransactions: boolean;
  showUserTransactions: boolean;
  minDate?: Date;
  maxDate?: Date;
  interval: RecurringTransactionFilterInterval;
}

export enum RecurringTransactionFilterInterval {
  all = 'all',
  currentMonth = 'monthly',
  nextMonth = 'nextMonth',
  currentYear = 'yearly',
  nextYear = 'nextYear',
  custom = 'custom',
}


/**
 * A dialog allowing the user to set filters for a list of transactions
 */
@Component({
  selector: 'app-recurring-transactions-filter-edit',
  templateUrl: './recurring-transactions-filter-edit.component.html',
  styleUrls: ['./recurring-transactions-filter-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecurringTransactionsFilterEditComponent implements OnInit {

  filterForm: UntypedFormGroup;
  showBondAndDepositTransactions: FormControl<boolean>;
  showDividendTransactions: FormControl<boolean>;
  showUserTransactions: FormControl<boolean>;
  interval: FormControl<RecurringTransactionFilterInterval>;
  minDate: UntypedFormControl;
  maxDate: UntypedFormControl;
  todayDate: Date;

  readonly RecurringTransactionFilterInterval = RecurringTransactionFilterInterval;


  constructor(public dialogRef: MatDialogRef<RecurringTransactionsFilterEditComponent>,
    @Inject(MAT_DIALOG_DATA) public filters: RecurringTransactionFilters) {

  }

  ngOnInit() {
    this.todayDate = new Date();
    this.minDate = new UntypedFormControl(this.filters.minDate);
    this.maxDate = new UntypedFormControl(this.filters.maxDate);
    this.showDividendTransactions = new FormControl<boolean>(this.filters.showDividendTransactions);
    this.interval = new FormControl<RecurringTransactionFilterInterval>(this.filters.interval);
    this.showUserTransactions = new FormControl<boolean>(this.filters.showUserTransactions);
    this.showBondAndDepositTransactions = new FormControl<boolean>(this.filters.showBondAndDepositTransactions);
    this.filterForm = new UntypedFormGroup({
      minDate: this.minDate,
      maxDate: this.maxDate,
      showDividendTransactions: this.showDividendTransactions,
      showUserTransactions: this.showUserTransactions,
      showBondAndDepositTransactions: this.showBondAndDepositTransactions,
      interval: this.interval,
    });
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {

      this.filters.showDividendTransactions = this.showDividendTransactions.value;
      this.filters.showBondAndDepositTransactions = this.showBondAndDepositTransactions.value;
      this.filters.showUserTransactions = this.showUserTransactions.value;
      this.filters.interval = this.interval.value;
      switch (this.filters.interval) {
        case RecurringTransactionFilterInterval.currentMonth:
          this.filters.minDate = this.todayDate;
          this.filters.maxDate = new Date(this.todayDate.getFullYear(), this.todayDate.getMonth() + 1, 0);
          break;
        case RecurringTransactionFilterInterval.nextMonth:
          this.filters.minDate = new Date(this.todayDate.getFullYear(), this.todayDate.getMonth() + 1, 1);
          this.filters.maxDate = new Date(this.todayDate.getFullYear(), this.todayDate.getMonth() + 2, 0);
          break;
        case RecurringTransactionFilterInterval.currentYear:
          this.filters.minDate = this.todayDate;
          this.filters.maxDate = new Date(this.todayDate.getFullYear(), 11, 31);
          break;
        case RecurringTransactionFilterInterval.nextYear:
          this.filters.minDate = new Date(this.todayDate.getFullYear() + 1, 0, 1);
          this.filters.maxDate = new Date(this.todayDate.getFullYear() + 1, 11, 31);
          break;
        case RecurringTransactionFilterInterval.custom:
          this.filters.minDate = this.minDate.value ? new Date(this.minDate.value) : this.todayDate;
          this.filters.maxDate = this.maxDate.value ? new Date(this.maxDate.value) : null;
          break;
        case RecurringTransactionFilterInterval.all:
          this.filters.minDate = this.todayDate;
          this.filters.maxDate = null;
          break;
      }

      this.dialogRef.close(this.filters);
    } else {
      this.dialogRef.close(null);
    }
  }

}
