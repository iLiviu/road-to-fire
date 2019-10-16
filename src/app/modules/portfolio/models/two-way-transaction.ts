import { Transaction, TransactionData, TransactionAsset } from './transaction';


export interface TwoWayTransactionData extends TransactionData {
  otherAsset: TransactionAsset;
}
export abstract class TwoWayTransaction extends Transaction implements TwoWayTransactionData {
  otherAsset: TransactionAsset;

  clone() {
    const obj = <TwoWayTransaction> super.clone();
    obj.otherAsset = Object.assign({}, this.otherAsset);
    return obj;
  }
}


