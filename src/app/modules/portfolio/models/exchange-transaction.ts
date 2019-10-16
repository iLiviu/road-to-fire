import { TwoWayTransaction, TwoWayTransactionData } from './two-way-transaction';

export interface ExchangeTransactionData extends TwoWayTransactionData {
  amount: number;
  rate: number;
}

export class ExchangeTransaction extends TwoWayTransaction implements ExchangeTransactionData {
  amount: number;
  rate: number;

  get exchangedAsset() {
    return this.otherAsset;
  }

}
