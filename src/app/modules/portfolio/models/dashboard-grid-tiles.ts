import { NumKeyDictionary } from 'src/app/shared/models/dictionary';

export enum DashboardGridTiles {
  Goals,
  PortfolioAllocation,
  StocksGeoAllocation,
  BondsGeoAllocation,
  CommodityAllocation,
  CryptoAllocation,
  CashAllocation,
  CurrencyAllocation,
  StockCurrencyAllocation,
  BondCurrencyAllocation,
  Rebalancing,
  PortfolioHistory,
  Stats,
  UnrealizedPLHistory,
  DebtAllocation,
  P2PCurrencyAllocation,
  P2PGeoAllocation,
  BondsAllocation,
  P2PAllocation,
  StocksAllocation,
}

export const DashboardGridTilesLabels: NumKeyDictionary<string> = {};
DashboardGridTilesLabels[DashboardGridTiles.Goals] = 'Goals';
DashboardGridTilesLabels[DashboardGridTiles.PortfolioAllocation] = 'Portfolio Allocation';
DashboardGridTilesLabels[DashboardGridTiles.StocksGeoAllocation] = 'Stocks Geographic Allocation';
DashboardGridTilesLabels[DashboardGridTiles.BondsGeoAllocation] = 'Bonds Geographic Allocation';
DashboardGridTilesLabels[DashboardGridTiles.CommodityAllocation] = 'Commodity Allocation';
DashboardGridTilesLabels[DashboardGridTiles.CryptoAllocation] = 'Cryptocurrency Allocation';
DashboardGridTilesLabels[DashboardGridTiles.CashAllocation] = 'Cash Allocation';
DashboardGridTilesLabels[DashboardGridTiles.CurrencyAllocation] = 'Currency Allocation';
DashboardGridTilesLabels[DashboardGridTiles.StockCurrencyAllocation] = 'Stock Currency Allocation';
DashboardGridTilesLabels[DashboardGridTiles.BondCurrencyAllocation] = 'Bond Currency Allocation';
DashboardGridTilesLabels[DashboardGridTiles.Rebalancing] = 'Rebalancing';
DashboardGridTilesLabels[DashboardGridTiles.PortfolioHistory] = 'Portfolio History';
DashboardGridTilesLabels[DashboardGridTiles.Stats] = 'Stats';
DashboardGridTilesLabels[DashboardGridTiles.UnrealizedPLHistory] = 'Unrealized P/L History';
DashboardGridTilesLabels[DashboardGridTiles.DebtAllocation] = 'Debt Allocation';
DashboardGridTilesLabels[DashboardGridTiles.P2PCurrencyAllocation] = 'P2P Currency Allocation';
DashboardGridTilesLabels[DashboardGridTiles.P2PGeoAllocation] = 'P2P Geographic Allocation';
DashboardGridTilesLabels[DashboardGridTiles.BondsAllocation] = 'Top Bond Holdings';
DashboardGridTilesLabels[DashboardGridTiles.P2PAllocation] = 'Top P2P Holdings';
DashboardGridTilesLabels[DashboardGridTiles.StocksAllocation] = 'Top Stock Holdings';
