export enum TransactionType {
  Cash = 1,
  Debit = 2,
  Credit = 4,
  DebitCash = Cash | Debit,
  CreditCash = Cash | Credit,
  Transfer = 8,
  CashTransfer = 8 | Cash,
  Exchange = 16,
  Trade = 32,
  Buy = Trade | Debit,
  Sell = Trade | Credit,
  Dividend = 64 | Credit,
  CashDividend = Dividend | Cash,
  PrincipalPayment = 128 | Sell,
  Interest = 256 | Credit,
  CashInterest = Interest | Cash,
  CapitalCost = 512 | Debit | Cash,
}

export interface TransactionData {
  id?: number;
  asset: TransactionAsset;
  value: number;
  type: TransactionType;
  description: string;
  date: string;
  fee: number;
  withholdingTax?: number;
}

export interface TransactionAsset {
  accountDescription: string;
  accountId: number;
  currency: string;
  description?: string;
  id?: number;

}


export class Transaction implements TransactionData {
  id?: number;
  asset: TransactionAsset;
  value: number;
  type: TransactionType;
  description: string;
  date: string;
  fee: number;
  withholdingTax?: number;

  /**
   * Checks if a transaction is a credit transaction
   */
  static isCredit(type: TransactionType) {
    return (type & TransactionType.Credit) !== 0;
  }

  /**
   * Checks if a transaction is a debit transaction
   */
  static isDebit(type: TransactionType) {
    return (type & TransactionType.Debit) !== 0;
  }

  /**
   * Checks if a transaction type is a transfer transaction
   */
  static isTransfer(type: TransactionType) {
    return (type & TransactionType.Transfer) === TransactionType.Transfer;
  }

  /**
   * Checks if a transaction type is an exchange transaction
   */
  static isExchange(type: TransactionType) {
    return (type & TransactionType.Exchange) === TransactionType.Exchange;
  }

  /**
   * Checks if a transaction type is an interest payment transaction
   */
  static isInterestPayment(type: TransactionType) {
    return (type & TransactionType.Interest) === TransactionType.Interest;
  }

  /**
   * Checks if a transaction type is a capital cost transaction
   */
  static isCapitalCost(type: TransactionType) {
    return (type & TransactionType.CapitalCost) === TransactionType.CapitalCost;
  }

  /**
   * Checks if a transaction type is a trade transaction
   */
  static isTrade(type: TransactionType) {
    return (type & TransactionType.Trade) === TransactionType.Trade;
  }

  /**
   * Checks if a transaction type is a Buy transaction
   */
  static isBuyTrade(type: TransactionType) {
    return (type & TransactionType.Buy) === TransactionType.Buy;
  }

  /**
   * Checks if a transaction type is a sell transaction
   */
  static isSellTrade(type: TransactionType) {
    return (type & TransactionType.Sell) === TransactionType.Sell;
  }

  /**
   * Checks if a transaction type is a principal payment transaction
   */
  static isPrincipalPayment(type: TransactionType) {
    return (type & TransactionType.PrincipalPayment) === TransactionType.PrincipalPayment;
  }


  /**
   * Checks if a transaction type is a dividend transaction
   */
  static isDividend(type: TransactionType) {
    return (type & TransactionType.Dividend) === TransactionType.Dividend;
  }


  constructor(source?: TransactionData) {
    if (source) {
      Object.assign(this, source);
      this.asset = Object.assign({}, source.asset);
    }
  }

  /**
   * Returns a new instance of the transaction, deep copying all of its properties
   */
  clone() {
    const obj = <Transaction>Object.create(Object.getPrototypeOf(this));
    obj.constructor(this);
    return obj;
  }

  /**
   * Checks if the transaction is a credit transaction
   */
  isCredit() {
    return Transaction.isCredit(this.type);
  }

  /**
   * Checks if the transaction is a debit transaction
   */
  isDebit() {
    return Transaction.isDebit(this.type);
  }

  /**
   * Checks if the transaction is a dividend transaction
   */
  isDividend() {
    return Transaction.isDividend(this.type);
  }

  /**
   * Checks if the transaction is an exchange transaction
   */
  isExchange() {
    return Transaction.isExchange(this.type);
  }

  /**
   * Checks if the transaction is an interest payment transaction
   */
  isInterestPayment() {
    return Transaction.isInterestPayment(this.type);
  }

  /**
   * Checks if a transaction type is a capital cost transaction
   */
  isCapitalCost() {
    return Transaction.isCapitalCost(this.type);
  }

  /**
   * Checks if the transaction is a trade transaction
   */
  isTrade() {
    return Transaction.isTrade(this.type);
  }

  /**
   * Checks if the transaction is a transfer transaction
   */
  isTransfer() {
    return Transaction.isTransfer(this.type);
  }

  /**
   * Checks if the transaction is a buy transaction
   */
  isBuyTrade() {
    return Transaction.isBuyTrade(this.type);
  }

  /**
   * Checks if the transaction is a sell transaction
   */
  isSellTrade() {
    return Transaction.isSellTrade(this.type);
  }

  /**
   * Checks if the transaction is a principal payment transaction
   */
  isPrincipalPayment() {
    return Transaction.isPrincipalPayment(this.type);
  }

  /**
   * Checks if the transaction is a transaction involving two assets
   */
  isTwoWayTransaction(): boolean {
    return 'otherAsset' in this;
  }

  /**
   * Checks if the transaction is includes cash (debit or credit)
   */
  includesCash() {
    return (this.type & TransactionType.Cash) !== 0;
  }
}


export const TRANSACTION_ICONS = {
  [TransactionType.CreditCash]: 'arrow_forward',
  [TransactionType.Sell]: 'arrow_forward',
  [TransactionType.DebitCash]: 'arrow_back',
  [TransactionType.Buy]: 'arrow_back',
  [TransactionType.Exchange]: 'euro_symbol',
  [TransactionType.Transfer]: 'swap_horiz',
  [TransactionType.CashTransfer]: 'swap_horiz',
  [TransactionType.Dividend]: 'arrow_forward',
  [TransactionType.CashDividend]: 'arrow_forward',
  [TransactionType.CashInterest]: 'arrow_forward',
  [TransactionType.CapitalCost]: 'arrow_back',
  [TransactionType.PrincipalPayment]: 'arrow_forward',
};
