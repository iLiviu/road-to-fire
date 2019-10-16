import { TwoWayTransactionData, TwoWayTransaction } from './two-way-transaction';

export type CapitalCostTransactionData = TwoWayTransactionData;

export class CapitalCostTransaction extends TwoWayTransaction implements CapitalCostTransactionData {

  get destinationAsset() {
    return this.otherAsset;
  }
}
