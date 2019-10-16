import { ExchangeTransaction, ExchangeTransactionData } from './exchange-transaction';

export type DividendTransactionData = ExchangeTransactionData;

export class DividendTransaction extends ExchangeTransaction implements DividendTransactionData {

  get payerAsset() {
    return this.otherAsset;
  }
}
