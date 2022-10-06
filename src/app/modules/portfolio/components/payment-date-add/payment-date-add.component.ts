import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RecurringTransactionType } from '../../models/recurring-transaction';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { DateUtils } from 'src/app/shared/util';

export enum PaymentAmountType {
  Currency,
  Percentage,
}

/**
 * Data provided as input to the `PaymentDateAddComponent` dialog
 */
export interface PaymentDateAddData {
  maturityDate: Date;
  amountType: PaymentAmountType;
  defaultAmount: number;
  currency?: string;
  amountCaption: string;
}

/**
 * Holds the response from the `PaymentDateAddComponent` dialog
 */
export interface PaymentDateAddResponse {
  dates: Date[];
  amount: number;
}

@Component({
  selector: 'app-payment-date-add',
  templateUrl: './payment-date-add.component.html',
  styleUrls: ['./payment-date-add.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDateAddComponent implements OnInit {

  paymentFormGroup: UntypedFormGroup;
  paymentAmount: UntypedFormControl;
  paymentRepeatType: UntypedFormControl;
  paymentRepeatPeriod: UntypedFormControl;
  paymentDate: UntypedFormControl;

  RecurringTransactionType = RecurringTransactionType;
  PaymentAmountType = PaymentAmountType;

  constructor(public dialogRef: MatDialogRef<PaymentDateAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDateAddData) { }

  ngOnInit() {
    this.paymentDate = new UntypedFormControl();
    this.paymentAmount = new UntypedFormControl(this.data.defaultAmount);
    this.paymentRepeatType = new UntypedFormControl();
    this.paymentRepeatPeriod = new UntypedFormControl();
    this.paymentFormGroup = new UntypedFormGroup({
      paymentDate: this.paymentDate,
      paymentAmount: this.paymentAmount,
      paymentRepeatType: this.paymentRepeatType,
      paymentRepeatPeriod: this.paymentRepeatPeriod,
    });


  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const dates = this.generatePaymentDates(this.paymentRepeatType.value, this.paymentRepeatPeriod.value, this.paymentDate.value);
      const response: PaymentDateAddResponse = {
        amount: this.paymentAmount.value,
        dates: dates,
      };
      this.dialogRef.close(response);
    } else {
      this.dialogRef.close(null);
    }
  }

  /**
   * Generates all the recurring payment dates for a transaction, up until the maturity date
   * @param recurringType recurring transaction type
   * @param period recurring period
   * @param paymentDate initial payment date
   */
  private generatePaymentDates(recurringType: RecurringTransactionType, period: number, paymentDate: Date) {
    const nextDate = new Date(paymentDate);
    nextDate.setHours(0, 0, 0, 0);
    const dates: Date[] = [paymentDate];
    let validDate: boolean;
    if (recurringType !== RecurringTransactionType.Never) {
      do {
        switch (recurringType) {
          case RecurringTransactionType.BiMonthly:
            nextDate.setMonth(nextDate.getMonth() + 2);
            break;
          case RecurringTransactionType.BiWeekly:
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case RecurringTransactionType.Daily:
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case RecurringTransactionType.EveryGivenDays:
            nextDate.setDate(nextDate.getDate() + period);
            break;
          case RecurringTransactionType.EveryGivenMonths:
            nextDate.setMonth(nextDate.getMonth() + period);
            break;
          case RecurringTransactionType.Monthly:
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case RecurringTransactionType.Quarterly:
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case RecurringTransactionType.SemiAnnual:
            nextDate.setMonth(nextDate.getMonth() + 6);
            break;
          case RecurringTransactionType.TriAnnual:
            nextDate.setMonth(nextDate.getMonth() + 4);
            break;
          case RecurringTransactionType.Weekly:
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case RecurringTransactionType.Yearly:
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            throw new Error('Unsupported RecurringTransactionType:' + recurringType);
        }
        validDate = DateUtils.compareDates(nextDate, this.data.maturityDate) <= 0;
        if (validDate) {
          dates.push(new Date(nextDate));
        }
      } while (validDate);
    }

    return dates;
  }

}
