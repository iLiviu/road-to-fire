
export enum CSV_IMPORT_COLUMN_IDS {
  IGNORE = 0,
  DATE = 1,
  BUY_SELL = 2,
  SYMBOL = 3,
  DESCRIPTION = 4,
  EXCHANGE_CODE = 5,
  AMOUNT = 6,
  PRICE = 7,
  FEE = 8,
  TAX = 9,
  GROSS_TX_VALUE = 10,
  NET_TX_VALUE = 11,
  CURRENCY = 12,
  FEE2 = 13,
}

export class TransactionsImportTemplate {
  buyString: string;
  sellString: string;
  cashCreditString: string;
  cashDebitString: string;
  columns: number[];
  customDateFormat: string;
  decimalSeparator: string;
  exchangeCode: string;
  fieldSeparator: string;
  includeFirstRow: boolean;
  name: string;
  useCustomDateFormat: boolean;
}