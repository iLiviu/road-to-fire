import { TradeTransactionData, TradeTransaction } from './trade-transaction';

export interface SellTransactionData extends TradeTransactionData {
  buyPrice: number;
  grossBuyPrice: number;
  buyDate: string;
  positionId: number;
}

export class SellTransaction extends TradeTransaction implements SellTransactionData {
  buyPrice: number;
  grossBuyPrice: number;
  buyDate: string;
  positionId: number;
}
