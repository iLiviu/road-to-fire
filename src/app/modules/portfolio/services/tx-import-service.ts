import { Injectable } from "@angular/core";
import { parse } from 'csv-parse/browser/esm/sync';
import { CSV_IMPORT_COLUMN_IDS, TransactionsImportTemplate } from "../models/transactions-import-template";
import * as moment from "moment";
import { Asset, AssetType } from "../models/asset";
import { AssetRegion } from "../models/asset-region";
import { AssetOperationAction, AssetOperationData } from "../models/asset-operation-data";
import { PortfolioAccount } from "../models/portfolio-account";
import { FloatingMath } from "src/app/shared/util";


export interface ParsedCSVTransaction {
  rowNo: number;
  operationData: AssetOperationData;

}

export interface CreateTransactionsDataResponse {
  transactionsData: ParsedCSVTransaction[];
  skippedRows: number[];
}

/**
 * Transactions Import service
 * Handles transactions import from CSV files
 */
@Injectable()
export class TransactionsImportService {
  private thousandSeparators: string;
  private decimalSeparator: string;

  constructor() {
  }

  /**
   * Parse a CSV input buffer into arrays of strings
   * @param input buffer containing CSV data
   * @param delimiter CSV field separator
   * @returns arrays of strings
   */
  parseCSVInput(input: string | Buffer, delimiter: string) {
    const csvData: string[][] = parse(input, {
      delimiter: delimiter,
    });
    return csvData;
  }

  /**
   * Converts a string to a number taking in consideration specific decimal and thousand separators.
   * @param value the formated string of the number
   * @returns 
   */
  private parseNumber(value: string) {
    const numberRegex = new RegExp(`^[+-]?([0-9${this.thousandSeparators}]*[${this.decimalSeparator}])?[0-9]+$`);
    const cleanPattern = new RegExp(`[^-+0-9${this.decimalSeparator}]`, 'g');

    if (numberRegex.exec(value)) {
      const cleaned = value.replace(cleanPattern, '');
      const normalized = cleaned.replace(this.decimalSeparator, '.');
      return parseFloat(normalized);
    } else {
      return NaN;
    }
  }

  /**
   * Processes the CSV data and returns a list with trade data needed to create buy/sell and debit/credit transactions
   * 
   * @param csvRows the input arrays containing CSV data
   * @param decimalSeparator decimal separator for numbers
   * @param template CSV import template to use
   * @param account account where transactions will be created
   * @param defaultCashAsset default cash asset to use for transaction, if a currency column is not specified
   * @param assetsType type of asset
   * @param updateCashAssetBalance  if true
   * @param defaultExchangeCode exchange code to use if no exchange column is specified
   * @returns 
   */
  createTransactionsData(csvRows: string[][], decimalSeparator: string, template: TransactionsImportTemplate, account: PortfolioAccount,
    defaultCashAsset: Asset, assetsType: AssetType, updateCashAssetBalance: boolean, defaultExchangeCode: string) {
    let transactionsData: ParsedCSVTransaction[] = [];
    const skippedRows: number[] = [];
    this.decimalSeparator = decimalSeparator;
    this.thousandSeparators = decimalSeparator === "." ? ", " : ". ";
    let rowNo = 0;
    let cashAssets = {};
    account.assets.forEach(asset => {
      if (asset.type === AssetType.Cash && asset.currency !== defaultCashAsset.currency) {
        cashAssets[asset.currency] = asset;
      }
    });

    for (let csvRow of csvRows) {
      rowNo++;
      try {
        let action: AssetOperationAction;
        let amount: number;
        let price: number;
        let symbol: string = "";
        let description: string;
        let currency: string;
        let cashAsset = defaultCashAsset;

        if (CSV_IMPORT_COLUMN_IDS.AMOUNT in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.AMOUNT] < csvRow.length) {
          amount = this.parseNumber(csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.AMOUNT]]);
        }

        let txValue: number;
        if (CSV_IMPORT_COLUMN_IDS.GROSS_TX_VALUE in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.GROSS_TX_VALUE] < csvRow.length) {
          txValue = Math.abs(this.parseNumber(csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.GROSS_TX_VALUE]]));
        }

        let netTxValue: number;
        if (CSV_IMPORT_COLUMN_IDS.NET_TX_VALUE in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.NET_TX_VALUE] < csvRow.length) {
          netTxValue = Math.abs(this.parseNumber(csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.NET_TX_VALUE]]));
        }

        let fee: number;
        if (!isNaN(netTxValue) && !isNaN(txValue)) {
          fee = FloatingMath.fixRoundingError(Math.abs(txValue - netTxValue));
        } else {
          if (CSV_IMPORT_COLUMN_IDS.FEE in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.FEE] < csvRow.length) {
            fee = this.parseNumber(csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.FEE]]);
          }
          fee = isNaN(fee) ? 0 : Math.abs(fee);

          let additionalFee: number = null;
          if (CSV_IMPORT_COLUMN_IDS.FEE2 in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.FEE2] < csvRow.length) {
            additionalFee = this.parseNumber(csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.FEE2]]);
          }
          if (!isNaN(additionalFee)) {
            fee = FloatingMath.fixRoundingError(fee + Math.abs(additionalFee));
          }


          if (CSV_IMPORT_COLUMN_IDS.TAX in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.TAX] < csvRow.length) {
            additionalFee = this.parseNumber(csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.TAX]]);
            if (!isNaN(additionalFee)) {
              fee = FloatingMath.fixRoundingError(fee + Math.abs(additionalFee));
            }
          }
        }

        if (CSV_IMPORT_COLUMN_IDS.CURRENCY in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.CURRENCY] < csvRow.length) {
          currency = csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.CURRENCY]];
          if (cashAssets[currency]) {
            cashAsset = cashAssets[currency];
          }
        }

        if (CSV_IMPORT_COLUMN_IDS.SYMBOL in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.SYMBOL] < csvRow.length) {
          symbol = csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.SYMBOL]];
        }

        if (CSV_IMPORT_COLUMN_IDS.BUY_SELL in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.BUY_SELL] < csvRow.length) {
          const operationStr = csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.BUY_SELL]];
          if (operationStr.localeCompare(template.buyString) === 0) {
            action = AssetOperationAction.BUY;
          } else if (operationStr.localeCompare(template.sellString) === 0) {
            action = AssetOperationAction.SELL;
          } else if (operationStr.match(template.cashCreditString)) {
            action = AssetOperationAction.CREDIT;
          } else if (operationStr.match(template.cashDebitString)) {
            action = AssetOperationAction.DEBIT;
          } else {
            throw new Error(`Invalid operation string: ${operationStr}`);
          }
        } else {
          action = (amount > 0) ? AssetOperationAction.BUY : AssetOperationAction.SELL;
        }

        // try to identify received bonus shares that look like a credit transaction
        if ((action === AssetOperationAction.CREDIT) && (txValue === 0) && symbol && (cashAsset.description.localeCompare(symbol) !== 0) &&
          (assetsType === AssetType.Stock)) {
          action = AssetOperationAction.BUY;
        }

        if (action === AssetOperationAction.CREDIT || action === AssetOperationAction.DEBIT) {
          if (isNaN(amount) && isNaN(txValue) && isNaN(netTxValue)) {
            throw new Error('No amount/transaction value specified for cash transaction');
          }
          if (!isNaN(netTxValue)) {
            amount = netTxValue;
          } else if (!isNaN(txValue)) {
            if (isNaN(fee)) {
              amount = txValue;
            } else {
              amount = FloatingMath.fixRoundingError(txValue - fee);
            }
          }
        } else {
          const isBuyTx = action === AssetOperationAction.BUY;
          if (isNaN(amount) || !amount) {
            throw new Error('Invalid amount');
          }

          if (CSV_IMPORT_COLUMN_IDS.PRICE in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.PRICE] < csvRow.length) {
            price = this.parseNumber(csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.PRICE]]);;
            netTxValue = FloatingMath.fixRoundingError(Math.abs(price * amount));
            if (!isNaN(txValue)) {
              fee = FloatingMath.fixRoundingError(Math.abs(txValue - netTxValue));
            }
          } else if (!isNaN(netTxValue)) {
            price = FloatingMath.fixRoundingError(Math.abs(netTxValue / amount));
          } else if (!isNaN(txValue)) {
            price = FloatingMath.fixRoundingError(Math.abs((txValue - fee * (isBuyTx ? 1 : -1)) / amount));
          }
          if (isNaN(price)) {
            throw new Error('Invalid price');
          }

          if (CSV_IMPORT_COLUMN_IDS.DESCRIPTION in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.DESCRIPTION] < csvRow.length) {
            description = csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.DESCRIPTION]];
          }
          if (!description) {
            description = symbol;
          }
          if (!symbol && !description) {
            throw new Error('No symbol/description provided');
          }

          let exchangeCode: string = null;
          if (CSV_IMPORT_COLUMN_IDS.EXCHANGE_CODE in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.EXCHANGE_CODE] < csvRow.length) {
            exchangeCode = csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.EXCHANGE_CODE]];
          }
          if (exchangeCode) {
            symbol = exchangeCode + ':' + symbol;
          } else if (defaultExchangeCode) {
            symbol = defaultExchangeCode + ':' + symbol;
          }
        }

        let txDateStr: string = null;
        if (CSV_IMPORT_COLUMN_IDS.DATE in template.columns && template.columns[CSV_IMPORT_COLUMN_IDS.DATE] < csvRow.length) {
          txDateStr = csvRow[template.columns[CSV_IMPORT_COLUMN_IDS.DATE]];
        }
        let txDate: Date = null;
        if (template.useCustomDateFormat) {
          const mDate = moment(txDateStr, template.customDateFormat);
          if (mDate.isValid()) {
            txDate = mDate.toDate();
            txDateStr = txDate.toDateString();
          }
        } else {
          txDate = new Date(txDateStr);
        }
        if (!txDateStr || !(txDate instanceof Date && !isNaN(txDate.getTime()))) {
          throw new Error(`Invalid transaction date!`);
        }

        amount = Math.abs(amount);

        const operationData: AssetOperationData = {
          action: action,
          assetType: assetsType,
          amount: amount,
          cashAsset: cashAsset,
          currentPrice: price,
          description: description,
          price: price,
          fee: fee,
          region: AssetRegion.Unspecified,
          symbol: symbol,
          transactionDate: txDateStr,
          updateCashAssetBalance: updateCashAssetBalance,
          couponRate: 0,
          interestPaymentSchedule: [],
          interestTaxRate: 0,
          maturityDate: null,
          previousInterestPaymentDate: "",
          principalAmount: null,
          principalPaymentSchedule: [],
          withholdInterestTax: false
        };
        const row: ParsedCSVTransaction = {
          rowNo: rowNo,
          operationData: operationData,
        }
        transactionsData.push(row);
      } catch (e) {
        console.error(e);
        skippedRows.push(rowNo);
      }
    }

    const response: CreateTransactionsDataResponse = {
      transactionsData: transactionsData,
      skippedRows: skippedRows,
    };

    return response;
  }

}