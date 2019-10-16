import { TransactionData, Transaction, TransactionType } from './transaction';
import { ExchangeTransaction } from './exchange-transaction';
import { TransferTransaction } from './transfer-transaction';
import { SellTransaction } from './sell-transaction';
import { TradeTransaction } from './trade-transaction';
import { DividendTransaction } from './dividend-transaction';

export class TransactionFactory {

  static newInstance(type: TransactionType, source?: TransactionData) {
    if (!source) {
      return null;
    }
    let result: Transaction;
    if (Transaction.isExchange(type)) {
      result = new ExchangeTransaction(source);
    } else if (Transaction.isTransfer(type)) {
      result = new TransferTransaction(source);
    } else if (Transaction.isSellTrade(type)) {
      result = new SellTransaction(source);
    } else if (Transaction.isTrade(type)) {
      result = new TradeTransaction(source);
    } else if (Transaction.isDividend(type)) {
      result = new DividendTransaction(source);
    } else {
      result = new Transaction(source);
    }
    return result;
  }
}
