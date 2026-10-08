
export interface BenchmarkDefinition {
  id: string;
  name: string;
  symbol: string;
  currency: string;
}

export interface HistoricalPrice {
  date: string;
  price: number;
}

export interface HistoricalQuoteResponse {
  symbol: string;
  currency: string;
  history: HistoricalPrice[];
}

export interface TWRDataPoint {
  date: string;
  twr: number;
}

export interface PortfolioPerformanceResult {
  irr: number | null;
  totalReturn: number | null;
  inaccurateIRR: boolean;
}

export interface CachedBenchmarkData {
  symbol: string;
  lastFetchTime: number;
  data: HistoricalQuoteResponse;
  earliestRequestedDate?: string;
}

export interface PortfolioTWRCache {
  fingerprint: string;
  baseCurrency: string;
  series: TWRDataPoint[];
}

export interface BenchmarksCache {
  quotes?: { [symbol: string]: CachedBenchmarkData };
  portfolioTWR?: PortfolioTWRCache;
}

/**
 * Available benchmarks grouped by currency. Users will see benchmarks
 * matching their base currency. For other base currencies,
 * USD benchmarks are converted to the user's base currency using historical forex rates.
 */
export const BENCHMARK_DEFINITIONS: BenchmarkDefinition[] = [
  // USD benchmarks
  {
    id: 'sp500_usd',
    name: 'S&P 500 (CSPX)',
    symbol: 'XLON:CSPX',
    currency: 'USD',
  },
  {
    id: 'msci_world_usd',
    name: 'MSCI World (IWDA)',
    symbol: 'XLON:IWDA',
    currency: 'USD',
  },
  {
    id: 'msci_acwi_usd',
    name: 'MSCI ACWI (ISAC)',
    symbol: 'XLON:ISAC',
    currency: 'USD',
  },
  {
    id: 'ftse_developed_usd',
    name: 'FTSE Developed (VHVE)',
    symbol: 'XLON:VHVE',
    currency: 'USD',
  },
  {
    id: 'ftse_allworld_usd',
    name: 'FTSE All-World (VWRA)',
    symbol: 'XLON:VWRA',
    currency: 'USD',
  },
  // EUR benchmarks
  {
    id: 'sp500_eur',
    name: 'S&P 500 (SXR8)',
    symbol: 'XETR:SXR8',
    currency: 'EUR',
  },
  {
    id: 'msci_world_eur',
    name: 'MSCI World (EUNL)',
    symbol: 'XETR:EUNL',
    currency: 'EUR',
  },
  {
    id: 'msci_acwi_eur',
    name: 'MSCI ACWI (IUSQ)',
    symbol: 'XETR:IUSQ',
    currency: 'EUR',
  },
  {
    id: 'ftse_developed_eur',
    name: 'FTSE Developed (VGVF)',
    symbol: 'XETR:VGVF',
    currency: 'EUR',
  },
  {
    id: 'ftse_allworld_eur',
    name: 'FTSE All-World (VWCE)',
    symbol: 'XETR:VWCE',
    currency: 'EUR',
  },
  // GBP benchmarks
  {
    id: 'sp500_gbp',
    name: 'S&P 500 (CSP1)',
    symbol: 'XLON:CSP1',
    currency: 'GBP',
  },
  {
    id: 'msci_world_gbp',
    name: 'MSCI World (SWDA)',
    symbol: 'XLON:SWDA',
    currency: 'GBP',
  },
  {
    id: 'msci_acwi_gbp',
    name: 'MSCI ACWI (SSAC)',
    symbol: 'XLON:SSAC',
    currency: 'GBP',
  },
  {
    id: 'ftse_developed_gbp',
    name: 'FTSE Developed (VHVG)',
    symbol: 'XLON:VHVG',
    currency: 'GBP',
  },
  {
    id: 'ftse_allworld_gbp',
    name: 'FTSE All-World (VWRP)',
    symbol: 'XLON:VWRP',
    currency: 'GBP',
  },
  //RON benchmarks
  {
    id: 'bettr_ron',
    name: 'BET-TR (TVBETETF)',
    symbol: 'XBSE:TVBETETF',
    currency: 'RON',
  },
];

/** Currencies for which we have benchmark definitions */
export const BENCHMARK_CURRENCIES = ['USD', 'EUR', 'GBP'];

/** Currencies that are valid as <from_currency> in forex pairs "<from><to>=X" */
export const FOREX_BASE_CURRENCIES = ['EUR', 'USD', 'GBP'];

export interface ForexConversionPlan {
  type: 'direct' | 'inverse' | 'cross';
  pairs: string[];
  directPair?: string;
  inversePair?: string;
  bridgePairFrom?: string;
  bridgePairTo?: string;
}
