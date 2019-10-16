import { AssetType, Asset, AssetData } from './asset';

export interface DepositAssetData extends AssetData {
  interestRate: number;
  autoRenew: boolean;
  capitalize: boolean;
  creationDate: string;
  maturityDate: string;
  withholdInterestTax: boolean;
  interestTaxRate: number;
}

export class DepositAsset extends Asset implements DepositAssetData {
  interestRate: number;
  autoRenew: boolean;
  capitalize: boolean;
  creationDate: string;
  maturityDate: string;
  withholdInterestTax: boolean;
  interestTaxRate: number;

  /**
   * Return the full interest (before taxes) to be received on deposit maturity.
   */
  getFullInterest() {
    const depositPeriod = this.getPeriod();
    const oneDay = 24 * 60 * 60 * 1000;
    const depositPeriodDays = Math.floor(depositPeriod / oneDay);
    return depositPeriodDays / 365 * this.interestRate * this.amount;
  }

  /**
   * Return the deposit period, in milliseconds
   */
  getPeriod() {
    const creationDate = new Date(this.creationDate);
    creationDate.setHours(0, 0, 0, 0);
    const expirationDate = new Date(this.maturityDate);
    expirationDate.setHours(0, 0, 0, 0);
    return (expirationDate.getTime() - creationDate.getTime());
  }


  /**
   * Return the interest to be paid on deposit maturity, after taxes are withhold.
   */
  getPayableInterest() {
    let interest = this.getFullInterest();
    if (this.withholdInterestTax) {
      interest = interest * (1 - this.interestTaxRate);
    }
    return interest;
  }

  /**
   * Get the amount of taxes that will be withheld.
   */
  getWithholdingTax() {
    if (this.withholdInterestTax) {
      return this.getFullInterest() * this.interestTaxRate;
    }
    return 0;
  }

}
