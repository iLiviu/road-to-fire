import { PortfolioAccount } from '../models/portfolio-account';
import { Asset, AssetType } from '../models/asset';
import { TradeableAsset, TradeableAssetData } from '../models/tradeable-asset';
import { DepositAsset, DepositAssetData } from '../models/deposit-asset';

const EURCashAsset: Asset = new Asset({
  amount: 10,
  id: 1,
  currency: 'EUR',
  description: 'EUR Cash',
  type: AssetType.Cash,
});

const EURCashAsset2: Asset = new Asset({
  amount: 0,
  id: 2,
  currency: 'EUR',
  description: 'EUR Cash',
  type: AssetType.Cash,
});

const REAsset1Data: TradeableAssetData = {
  amount: 1,
  id: 3,
  currency: 'EUR',
  description: 'Real Estate',
  type: AssetType.RealEstate,
  buyPrice: 1,
  grossBuyPrice: 1,
  currentPrice: 2,
  lastQuoteUpdate: null,
  positions: [{
    amount: 1,
    buyPrice: 1,
    buyDate: null,
    grossBuyPrice: 1,
    id: 1,
  }],
  region: null,
  symbol: '',
};
const REAsset1: TradeableAsset = new TradeableAsset(REAsset1Data);

const depositAsset1Data: DepositAssetData = {
  amount: 200,
  id: 4,
  currency: 'EUR',
  description: 'Deposit',
  type: AssetType.Deposit,
  autoRenew: false,
  capitalize: false,
  creationDate: new Date(2018, 0, 1).toISOString(),
  interestRate: 0,
  withholdInterestTax: false,
  interestTaxRate: 0,
  maturityDate: new Date(2020, 0, 1).toISOString(),
};
const depositAsset1: DepositAsset = new DepositAsset(depositAsset1Data);

const stockAsset1Data: TradeableAssetData = {
  amount: 1,
  id: 5,
  currency: 'EUR',
  description: 'Stock',
  type: AssetType.Stock,
  buyPrice: 1,
  grossBuyPrice: 1,
  currentPrice: 2,
  lastQuoteUpdate: null,
  positions: [{
    amount: 1,
    buyPrice: 1,
    buyDate: null,
    grossBuyPrice: 1,
    id: 1,
  }],
  region: null,
  symbol: '',
};
const stockAsset1: TradeableAsset = new TradeableAsset(stockAsset1Data);

const bondAsset1Data: TradeableAssetData = {
  amount: 1,
  id: 6,
  currency: 'EUR',
  description: 'Bond',
  type: AssetType.Stock,
  buyPrice: 1,
  grossBuyPrice: 1,
  currentPrice: 2,
  lastQuoteUpdate: null,
  positions: [{
    amount: 1,
    buyPrice: 1,
    buyDate: null,
    grossBuyPrice: 1,
    id: 1,
  }],
  region: null,
  symbol: '',
};
const bondAsset1: TradeableAsset = new TradeableAsset(bondAsset1Data);

const account1: PortfolioAccount = new PortfolioAccount({
  assets: [EURCashAsset, REAsset1, depositAsset1, stockAsset1, bondAsset1],
  description: 'Sample Account 1',
  id: 1,
});

const account2: PortfolioAccount = new PortfolioAccount({
  assets: [EURCashAsset2],
  description: 'Sample Account 2',
  id: 1,
});

export const SAMPLE_ASSETS = {
  EURCashAsset,
  EURCashAsset2,
  REAsset1,
  depositAsset1,
  stockAsset1,
  bondAsset1,
};

export const SAMPLE_ACCOUNTS = {
  account1,
  account2,
};

