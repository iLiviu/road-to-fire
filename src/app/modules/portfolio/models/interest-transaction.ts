import { TwoWayTransaction, TwoWayTransactionData } from './two-way-transaction';

export type InterestTransactionData = TwoWayTransactionData;

export class InterestTransaction extends TwoWayTransaction {

  get payerAsset() {
    return this.otherAsset;
  }
}
