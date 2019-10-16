import { Transaction } from './transaction';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';

export enum RecurringTransactionType {
  Daily,
  Weekly,
  BiWeekly,
  Monthly,
  BiMonthly,
  Quarterly,
  TriAnnual,
  SemiAnnual,
  Yearly,
  AfterGivenDays,
  EveryGivenDays,
  EveryGivenMonths,
  Never,
}

export const RECURRING_TRANSACTION_TYPE_LABELS = {
  [RecurringTransactionType.Daily]: 'Daily',
  [RecurringTransactionType.Weekly]: 'Weekly',
  [RecurringTransactionType.BiWeekly]: 'BiWeekly',
  [RecurringTransactionType.Monthly]: 'Monthly',
  [RecurringTransactionType.BiMonthly]: 'Every 2 months',
  [RecurringTransactionType.Quarterly]: 'Quarterly',
  [RecurringTransactionType.TriAnnual]: 'Three times per year',
  [RecurringTransactionType.SemiAnnual]: 'Two times per year',
  [RecurringTransactionType.Yearly]: 'Yearly',
  [RecurringTransactionType.AfterGivenDays]: 'After given days',
  [RecurringTransactionType.EveryGivenDays]: 'Every given days',
  [RecurringTransactionType.EveryGivenMonths]: 'Every given months',
  [RecurringTransactionType.Never]: 'Never',
};

export interface RecurringTransactionData {
  id?: number;
  inactive: boolean;
  tx: Transaction;
  type: RecurringTransactionType;
  period: number;
  transactionsLeft: number;
  autoApprove: boolean;
}


export class RecurringTransaction implements RecurringTransactionData {
  id?: number;
  inactive: boolean;
  tx: Transaction;
  type: RecurringTransactionType;
  period: number;
  transactionsLeft: number;
  autoApprove: boolean;

  constructor(source?: RecurringTransactionData) {
    if (source) {
      Object.assign(this, source);
    }
  }

  /**
   * Get the next scheduled transaction date
   */
  getNextTransactionDate() {
    const nextDate = new Date(this.tx.date);
    switch (this.type) {
      case RecurringTransactionType.AfterGivenDays:
        nextDate.setDate(nextDate.getDate() + this.period);
        break;
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
        nextDate.setDate(nextDate.getDate() + this.period);
        break;
      case RecurringTransactionType.EveryGivenMonths:
        nextDate.setMonth(nextDate.getMonth() + this.period);
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
        throw new Error('Unsupported RecurringTransactionType:' + this.type);
    }

    return nextDate;
  }

  /**
   * Get the recurring transaction type in a human readable format.
   */
  getOccurrenceString() {
    switch (this.type) {
      case RecurringTransactionType.AfterGivenDays:
        const txDate = new Date(this.tx.date);
        return `On ` + new FormatDatePipe().transform(txDate);
      case RecurringTransactionType.EveryGivenDays:
        return `Every ${this.period} day(s)`;
      case RecurringTransactionType.EveryGivenMonths:
        return `Every ${this.period} month(s)`;
      default:
        return RECURRING_TRANSACTION_TYPE_LABELS[this.type];
    }
  }
}
