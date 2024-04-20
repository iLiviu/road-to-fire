import { Asset } from "./asset";
import { AssetRegion } from "./asset-region";
import { BondInterestPaymentEvent, BondPrincipalPaymentEvent } from "./bond-asset";


export enum AssetOperationAction {
  BUY,
  SELL,
  EDIT,
  CREDIT,
  DEBIT,
}

/**
 * Data required for a an asset operation
 */
export interface AssetOperationData {
  action: AssetOperationAction;
  assetType: number;
  amount: number;
  cashAsset: Asset;
  couponRate: number;
  currentPrice: number;
  description: string;
  interestPaymentSchedule: BondInterestPaymentEvent[];
  interestTaxRate: number;
  fee: number;
  maturityDate: string;
  previousInterestPaymentDate: string;
  price: number;
  principalAmount: number;
  principalPaymentSchedule: BondPrincipalPaymentEvent[];
  region: AssetRegion;
  symbol: string;
  transactionDate: string;
  updateCashAssetBalance: boolean;
  withholdInterestTax: boolean;
}