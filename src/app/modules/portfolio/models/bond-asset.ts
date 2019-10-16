import { TradeableAsset, TradeableAssetData } from './tradeable-asset';
import { AssetData } from './asset';
import { DateUtils } from 'src/app/shared/util';


export interface BondPrincipalPaymentEvent {
  date: string;
  amount: number;
}

export interface BondInterestPaymentEvent {
  paymentDate: string;
  couponRate: number;
}

export interface BondAssetData extends TradeableAssetData {
  couponRate: number;
  maturityDate: string;
  principalAmount: number;
  interestPaymentSchedule: BondInterestPaymentEvent[];
  previousInterestPaymentDate: string;
  principalPaymentSchedule: BondPrincipalPaymentEvent[];
  withholdInterestTax: boolean;
  interestTaxRate: number;
}

export class BondAsset extends TradeableAsset implements BondAssetData {
  couponRate: number;
  maturityDate: string;
  principalAmount: number;
  interestPaymentSchedule: BondInterestPaymentEvent[];
  previousInterestPaymentDate: string;
  principalPaymentSchedule: BondPrincipalPaymentEvent[];
  withholdInterestTax: boolean;
  interestTaxRate: number;

  constructor(source?: AssetData) {
    super(source);
    if (!this.interestPaymentSchedule) {
      this.interestPaymentSchedule = [];
    }
    if (!this.principalPaymentSchedule) {
      this.principalPaymentSchedule = [];
    }
  }

  /**
   * Return the interest to be paid (after withholding taxes) on next coupon payment.
   */
  getNextPayableInterest() {
    let interest = this.getNextFullInterest();
    if (this.withholdInterestTax) {
      interest = interest * (1 - this.interestTaxRate);
    }
    return interest;
  }

  /**
   * Return the full interest (before taxes) to be received on next coupon payment.
   */
  getNextFullInterest() {
    const nextDate = this.getNextInterestPaymentDate();
    return this.getFullInterestAtDate(nextDate);
  }

  /**
   * Return the full interest (before taxes) accrued until this moment.
   */
  getFullAccruedInterest() {
    return this.getFullInterestAtDate(new Date());
  }

  /**
   * Return the interest (before taxes) accrued for 1 unit until this moment.
   */
  getUnitAccruedInterest() {
    return this.getUnitInterestAtDate(new Date());
  }

  /**
   * Get the amount of taxes that will be withheld on next coupon payment.
   */
  getNextWithholdingTax() {
    if (this.withholdInterestTax) {
      return this.getNextFullInterest() * this.interestTaxRate;
    }
    return 0;
  }

  getCurrentValue() {
    return super.getCurrentValue() + this.getFullAccruedInterest();
  }

  /**
   * Return the coupon rate for next payment. If next payment doesn't have a specific coupon rate,
   * then use default one.
   */
  private getNextRate() {
    if (this.interestPaymentSchedule.length > 0) {
      if (this.interestPaymentSchedule[0].couponRate) {
        return this.interestPaymentSchedule[0].couponRate;
      }
    }
    return this.couponRate;
  }

  /**
   * Return the interest (before taxes) accrued for 1 unit until a given date
   */
  private getUnitInterestAtDate(dt: Date) {
    const period = this.getInterestPeriod(dt);
    const oneDay = 24 * 60 * 60 * 1000;
    const periodDays = Math.floor(period / oneDay);

    return periodDays / 365 * this.getNextRate() * this.principalAmount;
  }

  /**
   * Return the full interest (before taxes) accrued until a given date
   */
  private getFullInterestAtDate(dt: Date) {
    const interest = this.getUnitInterestAtDate(dt);
    const nextDate = this.getNextInterestPaymentDate();
    const amountAtPaymentDate = this.getAmountAtDate(nextDate);

    return interest * amountAtPaymentDate;

  }

  /**
   * Return the next interest payment date. If no custom payment date is defined, return
   * maturity date.
   */
  private getNextInterestPaymentDate() {
    let nextDate: Date;
    if (this.interestPaymentSchedule.length > 0) {
      nextDate = new Date(this.interestPaymentSchedule[0].paymentDate);
    } else {
      nextDate = new Date(this.maturityDate);
    }
    return nextDate;
  }

  /**
   * Return the period from last to next interest payment, in milliseconds. If last payment date is not specified
   * return 0 (no interest).
   */
  private getInterestPeriod(nextDate: Date) {
    if (this.previousInterestPaymentDate) {
      nextDate.setHours(0, 0, 0, 0);
      const prevDate = new Date(this.previousInterestPaymentDate);
      prevDate.setHours(0, 0, 0, 0);
      return nextDate.getTime() - prevDate.getTime();
    } else {
      return 0;
    }
  }

  /**
   * Return total amount held in positions that were bought after a given date
   * @param dt minimum buy date
   */
  private getAmountAtDate(dt: Date) {
    if (dt.toISOString() === this.maturityDate) {
      // all buys are before maturity date, so return total amount
      return this.amount;
    } else {
      let totalAmount = 0;
      for (const position of this.positions) {
        const buyDate = new Date(position.buyDate);
        if (DateUtils.compareDates(buyDate, dt) < 0) {
          totalAmount = totalAmount + position.amount;
        }
      }
      return totalAmount;
    }
  }

}
