import { TwoWayTransaction, TwoWayTransactionData } from './two-way-transaction';

export type TransferTransactionData = TwoWayTransactionData;

export class TransferTransaction extends TwoWayTransaction {

  get destinationAsset() {
    return this.otherAsset;
  }

}
