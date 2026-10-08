import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BenchmarkService } from './benchmark.service';
import { PortfolioService } from './portfolio.service';
import { AssetsQuoteService } from './assets-quote.service';
import { HistoricalQuoteResponse, BenchmarksCache } from '../models/benchmark';
import { PortfolioHistory } from '../models/portfolio-history';
import { Transaction, TransactionType } from '../models/transaction';

describe('BenchmarkService', () => {
  let service: BenchmarkService;
  let mockPortfolioService: any;
  let mockAssetsQuoteService: any;
  let storedBenchmarksCache: BenchmarksCache = {};

  beforeEach(() => {
    storedBenchmarksCache = {};
    mockPortfolioService = {
      getBenchmarksCache: jasmine.createSpy('getBenchmarksCache').and.callFake(() => Promise.resolve(storedBenchmarksCache)),
      saveBenchmarksCache: jasmine.createSpy('saveBenchmarksCache').and.callFake((c: BenchmarksCache) => {
        storedBenchmarksCache = c;
        return Promise.resolve();
      }),
      invalidateBenchmarksCache: jasmine.createSpy('invalidateBenchmarksCache'),
    };

    mockAssetsQuoteService = {
      getHistoricalQuotes: jasmine.createSpy('getHistoricalQuotes').and.returnValue(Promise.resolve([])),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BenchmarkService,
        { provide: PortfolioService, useValue: mockPortfolioService },
        { provide: AssetsQuoteService, useValue: mockAssetsQuoteService },
      ],
    });

    service = TestBed.inject(BenchmarkService);
  });

  describe('getTargetPriceDate', () => {
    it('should return today on Monday through Friday', () => {
      // 2026-10-02 is a Friday
      const friday = new Date(2026, 9, 2, 10, 0, 0);
      expect(service.getTargetPriceDate(friday)).toBe('2026-10-02');

      // 2026-10-05 is a Monday
      const monday = new Date(2026, 9, 5, 14, 30, 0);
      expect(service.getTargetPriceDate(monday)).toBe('2026-10-05');

      // 2026-10-07 is a Wednesday
      const wednesday = new Date(2026, 9, 7, 18, 0, 0);
      expect(service.getTargetPriceDate(wednesday)).toBe('2026-10-07');
    });

    it('should return Friday on Saturday', () => {
      // 2026-10-03 is Saturday -> Friday is 2026-10-02
      const saturday = new Date(2026, 9, 3, 11, 0, 0);
      expect(service.getTargetPriceDate(saturday)).toBe('2026-10-02');
    });

    it('should return Friday on Sunday', () => {
      // 2026-10-04 is Sunday -> Friday is 2026-10-02
      const sunday = new Date(2026, 9, 4, 15, 0, 0);
      expect(service.getTargetPriceDate(sunday)).toBe('2026-10-02');
    });
  });

  describe('getHistoricalPrices caching & incremental fetching', () => {
    const inceptionDate = new Date('2024-01-10T00:00:00.000Z');

    it('should fetch from inception (with 7-day lookback buffer) when no cache exists', async () => {
      const apiResponse: HistoricalQuoteResponse[] = [
        {
          symbol: 'XLON:CSPX',
          currency: 'USD',
          history: [
            { date: '2024-01-03', price: 450.0 },
            { date: '2024-01-04', price: 452.0 },
          ],
        },
      ];
      mockAssetsQuoteService.getHistoricalQuotes.and.returnValue(Promise.resolve(apiResponse));

      // Reference date: Wednesday 2024-01-10
      const refDate = new Date(2024, 0, 10);
      const results = await service.getHistoricalPrices(['XLON:CSPX'], inceptionDate, refDate);

      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(1);
      const [calledSymbols, calledStartDate] = mockAssetsQuoteService.getHistoricalQuotes.calls.mostRecent().args;
      expect(calledSymbols).toEqual(['XLON:CSPX']);
      // 7-day lookback from 2024-01-10 is 2024-01-03
      expect(calledStartDate.toISOString().split('T')[0]).toBe('2024-01-03');

      expect(results.length).toBe(1);
      expect(results[0].history.length).toBe(2);
      expect(mockPortfolioService.saveBenchmarksCache).toHaveBeenCalled();
    });

    it('should NOT fetch if prices are already up to date for today (weekday)', async () => {
      storedBenchmarksCache = {
        quotes: {
          'XLON:CSPX': {
            symbol: 'XLON:CSPX',
            lastFetchTime: Date.now() - 1000,
            data: {
              symbol: 'XLON:CSPX',
              currency: 'USD',
              history: [
                { date: '2026-10-01', price: 500.0 },
                { date: '2026-10-02', price: 505.0 },
              ],
            },
          },
        },
      };

      // Reference date: Friday 2026-10-02
      const friday = new Date(2026, 9, 2);
      const results = await service.getHistoricalPrices(['XLON:CSPX'], new Date('2026-10-01'), friday);

      expect(mockAssetsQuoteService.getHistoricalQuotes).not.toHaveBeenCalled();
      expect(results.length).toBe(1);
      expect(results[0].history.length).toBe(2);
    });

    it('should NOT fetch on weekend if prices are already up to Friday', async () => {
      storedBenchmarksCache = {
        quotes: {
          'XLON:CSPX': {
            symbol: 'XLON:CSPX',
            lastFetchTime: Date.now() - 1000,
            data: {
              symbol: 'XLON:CSPX',
              currency: 'USD',
              history: [
                { date: '2026-10-01', price: 500.0 },
                { date: '2026-10-02', price: 505.0 }, // Friday's price
              ],
            },
          },
        },
      };

      // Reference date: Saturday 2026-10-03
      const saturday = new Date(2026, 9, 3);
      const resultsSat = await service.getHistoricalPrices(['XLON:CSPX'], new Date('2026-10-01'), saturday);
      expect(mockAssetsQuoteService.getHistoricalQuotes).not.toHaveBeenCalled();
      expect(resultsSat.length).toBe(1);

      // Reference date: Sunday 2026-10-04
      const sunday = new Date(2026, 9, 4);
      const resultsSun = await service.getHistoricalPrices(['XLON:CSPX'], new Date('2026-10-01'), sunday);
      expect(mockAssetsQuoteService.getHistoricalQuotes).not.toHaveBeenCalled();
      expect(resultsSun.length).toBe(1);
    });

    it('should reuse existing prices up to last day and fetch only from next day when outdated', async () => {
      // Existing cache has prices from 2024-01-03 to 2026-09-30
      storedBenchmarksCache = {
        quotes: {
          'XLON:CSPX': {
            symbol: 'XLON:CSPX',
            lastFetchTime: new Date(2026, 8, 30, 18, 0, 0).getTime(), // old fetch time
            data: {
              symbol: 'XLON:CSPX',
              currency: 'USD',
              history: [
                { date: '2024-01-03', price: 450.0 },
                { date: '2026-09-30', price: 510.0 },
              ],
            },
          },
        },
      };

      // New data from API for October 1 and October 2
      mockAssetsQuoteService.getHistoricalQuotes.and.returnValue(Promise.resolve([
        {
          symbol: 'XLON:CSPX',
          currency: 'USD',
          history: [
            { date: '2026-10-01', price: 512.0 },
            { date: '2026-10-02', price: 515.0 },
          ],
        },
      ]));

      // Today is Friday 2026-10-02
      const friday = new Date(2026, 9, 2);
      const results = await service.getHistoricalPrices(['XLON:CSPX'], inceptionDate, friday);

      // Verify that API was called with next day (2026-10-01) instead of inceptionDate (2024-01-10)
      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(1);
      const [calledSymbols, calledStartDate] = mockAssetsQuoteService.getHistoricalQuotes.calls.mostRecent().args;
      expect(calledSymbols).toEqual(['XLON:CSPX']);
      expect(calledStartDate.toISOString().split('T')[0]).toBe('2026-10-01');

      // Verify results contain merged history: 2024-01-03, 2026-09-30, 2026-10-01, 2026-10-02
      expect(results.length).toBe(1);
      const merged = results[0].history;
      expect(merged.length).toBe(4);
      expect(merged.map(p => p.date)).toEqual(['2024-01-03', '2026-09-30', '2026-10-01', '2026-10-02']);
      expect(merged.map(p => p.price)).toEqual([450.0, 510.0, 512.0, 515.0]);

      // Cache should be updated and saved
      expect(mockPortfolioService.saveBenchmarksCache).toHaveBeenCalled();
    });

    it('should refetch from inception if existing cache does not cover inception date', async () => {
      // Cache only has 2025 data
      storedBenchmarksCache = {
        quotes: {
          'XLON:CSPX': {
            symbol: 'XLON:CSPX',
            lastFetchTime: Date.now(),
            data: {
              symbol: 'XLON:CSPX',
              currency: 'USD',
              history: [
                { date: '2025-01-01', price: 480.0 },
              ],
            },
          },
        },
      };

      // Portfolio inception is older: 2024-01-10
      mockAssetsQuoteService.getHistoricalQuotes.and.returnValue(Promise.resolve([
        {
          symbol: 'XLON:CSPX',
          currency: 'USD',
          history: [
            { date: '2024-01-05', price: 450.0 },
            { date: '2025-01-01', price: 480.0 },
          ],
        },
      ]));

      const refDate = new Date(2025, 0, 1);
      await service.getHistoricalPrices(['XLON:CSPX'], inceptionDate, refDate);

      const [, calledStartDate] = mockAssetsQuoteService.getHistoricalQuotes.calls.mostRecent().args;
      // Should have buffered inception date: 2024-01-03
      expect(calledStartDate.toISOString().split('T')[0]).toBe('2024-01-03');
    });

    it('should group symbols by fetch start date and merge accurately', async () => {
      // Symbol 1 is cached up to 2026-09-30
      // Symbol 2 is not cached
      storedBenchmarksCache = {
        quotes: {
          'XLON:CSPX': {
            symbol: 'XLON:CSPX',
            lastFetchTime: new Date(2026, 8, 30, 18, 0, 0).getTime(),
            data: {
              symbol: 'XLON:CSPX',
              currency: 'USD',
              history: [
                { date: '2024-01-03', price: 450.0 },
                { date: '2026-09-30', price: 510.0 },
              ],
            },
          },
        },
      };

      mockAssetsQuoteService.getHistoricalQuotes.and.callFake((symbols: string[], startDate: Date) => {
        const dateStr = startDate.toISOString().split('T')[0];
        if (symbols.includes('XLON:CSPX') && dateStr === '2026-10-01') {
          return Promise.resolve([
            {
              symbol: 'XLON:CSPX',
              currency: 'USD',
              history: [{ date: '2026-10-01', price: 512.0 }],
            },
          ]);
        }
        if (symbols.includes('XLON:IWDA') && dateStr === '2024-01-03') {
          return Promise.resolve([
            {
              symbol: 'XLON:IWDA',
              currency: 'USD',
              history: [{ date: '2024-01-03', price: 80.0 }, { date: '2026-10-01', price: 100.0 }],
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const today = new Date(2026, 9, 1);
      const results = await service.getHistoricalPrices(['XLON:CSPX', 'XLON:IWDA'], inceptionDate, today);

      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(2);
      expect(results.length).toBe(2);

      const cspx = results.find(r => r.symbol === 'XLON:CSPX');
      const iwda = results.find(r => r.symbol === 'XLON:IWDA');

      expect(cspx.history.length).toBe(3); // 2024-01-03, 2026-09-30, 2026-10-01
      expect(iwda.history.length).toBe(2);
    });

    it('should remember earliest requested date for assets listed later and not refetch earlier dates', async () => {
      // User's portfolio inception is 2015-01-01 (buffered: 2014-12-25)
      const portfolioStart = new Date('2015-01-01T00:00:00.000Z');

      // Asset was listed in 2019, so quote service returns history only from 2019 onwards
      mockAssetsQuoteService.getHistoricalQuotes.and.returnValue(Promise.resolve([
        {
          symbol: 'XLON:VWRA',
          currency: 'USD',
          history: [
            { date: '2019-03-24', price: 70.0 },
            { date: '2026-10-02', price: 120.0 },
          ],
        },
      ]));

      // 1. Initial fetch: requests from buffered portfolioStart (2014-12-25)
      const friday = new Date(2026, 9, 2);
      const firstResults = await service.getHistoricalPrices(['XLON:VWRA'], portfolioStart, friday);
      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(1);
      const [, calledStartDate] = mockAssetsQuoteService.getHistoricalQuotes.calls.mostRecent().args;
      expect(calledStartDate.toISOString().split('T')[0]).toBe('2014-12-25');
      expect(firstResults[0].history.length).toBe(2);

      // Verify earliestRequestedDate is recorded in cache
      expect(storedBenchmarksCache.quotes['XLON:VWRA'].earliestRequestedDate).toBe('2014-12-25');

      mockAssetsQuoteService.getHistoricalQuotes.calls.reset();

      // 2. Subsequent call: portfolioStart is still 2015-01-01
      // Even though earliest price in history is 2019-03-24 (> 2015-01-01),
      // it should NOT call the API to fetch earlier dates again!
      const secondResults = await service.getHistoricalPrices(['XLON:VWRA'], portfolioStart, friday);
      expect(mockAssetsQuoteService.getHistoricalQuotes).not.toHaveBeenCalled();
      expect(secondResults[0].history.length).toBe(2);

      // 3. If portfolioStart is moved even earlier (e.g. 2012-01-01, buffered 2011-12-25)
      const earlierPortfolioStart = new Date('2012-01-01T00:00:00.000Z');
      await service.getHistoricalPrices(['XLON:VWRA'], earlierPortfolioStart, friday);
      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(1);
      const [, calledStartDate2] = mockAssetsQuoteService.getHistoricalQuotes.calls.mostRecent().args;
      expect(calledStartDate2.toISOString().split('T')[0]).toBe('2011-12-25');
      expect(storedBenchmarksCache.quotes['XLON:VWRA'].earliestRequestedDate).toBe('2011-12-25');
    });
  });

  describe('calculateAnnualizedTWR', () => {
    it('should return null for empty or single point series', () => {
      expect(service.calculateAnnualizedTWR([])).toBeNull();
      expect(service.calculateAnnualizedTWR([{ date: '2026-01-01', twr: 0 }])).toBeNull();
    });

    it('should return null if start and end dates are identical (0 days)', () => {
      expect(service.calculateAnnualizedTWR([
        { date: '2026-01-01', twr: 0 },
        { date: '2026-01-01', twr: 5 },
      ])).toBeNull();
    });

    it('should calculate annualized return correctly for exactly 1 year (365 days)', () => {
      const series = [
        { date: '2025-01-01', twr: 0 },
        { date: '2026-01-01', twr: 10 },
      ];
      expect(service.calculateAnnualizedTWR(series)).toBe(10);
    });

    it('should calculate annualized return correctly for multiple years', () => {
      // 2 years: (1 + 0.21)^(1/2) - 1 = 0.10 (10%)
      const series = [
        { date: '2024-01-01', twr: 0 },
        { date: '2026-01-01', twr: 21 },
      ];
      // 2024 is a leap year (366 + 365 = 731 days)
      const res = service.calculateAnnualizedTWR(series);
      expect(res).toBeCloseTo(9.99, 1);
    });

    it('should calculate annualized return correctly for periods under 1 year', () => {
      // ~182.5 days (half year)
      const start = new Date('2026-01-01T00:00:00Z');
      const end = new Date(start.getTime() + 182.5 * 86400000);
      const series = [
        { date: start.toISOString(), twr: 0 },
        { date: end.toISOString(), twr: 5 },
      ];
      // (1.05)^2 - 1 = 10.25%
      expect(service.calculateAnnualizedTWR(series)).toBe(10.25);
    });

    it('should calculate negative annualized returns properly', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date(start.getTime() + 730 * 86400000);
      const series = [
        { date: start.toISOString(), twr: 0 },
        { date: end.toISOString(), twr: -19 },
      ];
      // (0.81)^(0.5) - 1 = -0.10 (-10%)
      expect(service.calculateAnnualizedTWR(series)).toBe(-10);
    });

    it('should return -100 for total losses <= -100%', () => {
      const series = [
        { date: '2025-01-01', twr: 0 },
        { date: '2026-01-01', twr: -100 },
      ];
      expect(service.calculateAnnualizedTWR(series)).toBe(-100);
    });
  });

  describe('getAvailableBenchmarks & hasBenchmarksForCurrency', () => {
    it('should return native benchmarks for EUR, USD, GBP', () => {
      const eurBenchmarks = service.getAvailableBenchmarks('EUR');
      expect(eurBenchmarks.length).toBeGreaterThan(0);
      expect(eurBenchmarks.every(b => b.currency === 'EUR')).toBeTrue();

      const usdBenchmarks = service.getAvailableBenchmarks('USD');
      expect(usdBenchmarks.length).toBeGreaterThan(0);
      expect(usdBenchmarks.every(b => b.currency === 'USD')).toBeTrue();

      const gbpBenchmarks = service.getAvailableBenchmarks('GBP');
      expect(gbpBenchmarks.length).toBeGreaterThan(0);
      expect(gbpBenchmarks.every(b => b.currency === 'GBP')).toBeTrue();
    });

    it('should return USD benchmarks for other currencies (e.g. RON, CAD)', () => {
      const ronBenchmarks = service.getAvailableBenchmarks('RON');
      expect(ronBenchmarks.length).toBeGreaterThan(0);
      expect(ronBenchmarks.every(b => b.currency === 'USD')).toBeTrue();

      const cadBenchmarks = service.getAvailableBenchmarks('CAD');
      expect(cadBenchmarks.length).toBeGreaterThan(0);
      expect(cadBenchmarks.every(b => b.currency === 'USD')).toBeTrue();
    });

    it('should return empty list for empty base currency', () => {
      expect(service.getAvailableBenchmarks('')).toEqual([]);
      expect(service.getAvailableBenchmarks(null)).toEqual([]);
    });

    it('should return true for hasBenchmarksForCurrency with any valid currency', () => {
      expect(service.hasBenchmarksForCurrency('EUR')).toBeTrue();
      expect(service.hasBenchmarksForCurrency('RON')).toBeTrue();
      expect(service.hasBenchmarksForCurrency('CAD')).toBeTrue();
      expect(service.hasBenchmarksForCurrency('')).toBeFalse();
    });
  });

  describe('findClosestForexRate', () => {
    const t2 = new Date('2024-01-02').getTime();
    const t5 = new Date('2024-01-05').getTime();
    const t10 = new Date('2024-01-10').getTime();

    const sortedForex = [
      { time: t2, rate: 4.5 },
      { time: t5, rate: 4.8 },
      { time: t10, rate: 5.0 },
    ];

    it('should return exact match rate when target date exists', () => {
      expect(service.findClosestForexRate(t2, sortedForex)).toBe(4.5);
      expect(service.findClosestForexRate(t5, sortedForex)).toBe(4.8);
      expect(service.findClosestForexRate(t10, sortedForex)).toBe(5.0);
    });

    it('should return the first rate when target date is before all entries', () => {
      const tEarly = new Date('2024-01-01').getTime();
      expect(service.findClosestForexRate(tEarly, sortedForex)).toBe(4.5);
    });

    it('should return the last rate when target date is after all entries', () => {
      const tLate = new Date('2024-01-15').getTime();
      expect(service.findClosestForexRate(tLate, sortedForex)).toBe(5.0);
    });

    it('should return the closer date rate when target date is between entries', () => {
      // 2024-01-03 is closer to 2024-01-02 (diff: 1 day) than to 2024-01-05 (diff: 2 days)
      const t3 = new Date('2024-01-03').getTime();
      expect(service.findClosestForexRate(t3, sortedForex)).toBe(4.5);

      // 2024-01-04 is closer to 2024-01-05 (diff: 1 day) than to 2024-01-02 (diff: 2 days)
      const t4 = new Date('2024-01-04').getTime();
      expect(service.findClosestForexRate(t4, sortedForex)).toBe(4.8);

      // 2024-01-07 is closer to 2024-01-05 (diff: 2 days) than to 2024-01-10 (diff: 3 days)
      const t7 = new Date('2024-01-07').getTime();
      expect(service.findClosestForexRate(t7, sortedForex)).toBe(4.8);

      // 2024-01-08 is closer to 2024-01-10 (diff: 2 days) than to 2024-01-05 (diff: 3 days)
      const t8 = new Date('2024-01-08').getTime();
      expect(service.findClosestForexRate(t8, sortedForex)).toBe(5.0);
    });

    it('should handle single entry and empty list', () => {
      expect(service.findClosestForexRate(t2, [{ time: t5, rate: 4.8 }])).toBe(4.8);
      expect(service.findClosestForexRate(t2, [])).toBe(1);
    });
  });

  describe('convertHistoryToBaseCurrency', () => {
    it('should convert prices using matching and closest forex dates', () => {
      const prices = [
        { date: '2024-01-02', price: 100 },
        { date: '2024-01-03', price: 105 }, // Missing from forex, closest is 2024-01-02 (rate 4.5)
        { date: '2024-01-05', price: 110 },
      ];

      const forexHistory = [
        { date: '2024-01-02', price: 4.5 },
        { date: '2024-01-05', price: 5.0 },
      ];

      const converted = service.convertHistoryToBaseCurrency(prices, forexHistory);

      expect(converted.length).toBe(3);
      expect(converted[0]).toEqual({ date: '2024-01-02', price: 450 });
      expect(converted[1]).toEqual({ date: '2024-01-03', price: 472.5 }); // 105 * 4.5
      expect(converted[2]).toEqual({ date: '2024-01-05', price: 550 }); // 110 * 5.0
    });
  });

  describe('getHistoricalPrices with forex conversion', () => {
    const inceptionDate = new Date('2024-01-10T00:00:00.000Z');
    const refDate = new Date(2024, 0, 10);

    it('should NOT perform forex conversion when baseCurrency matches quote currency', async () => {
      const apiResponse: HistoricalQuoteResponse[] = [
        {
          symbol: 'XLON:CSPX',
          currency: 'USD',
          history: [
            { date: '2024-01-03', price: 450.0 },
            { date: '2024-01-04', price: 452.0 },
          ],
        },
      ];
      mockAssetsQuoteService.getHistoricalQuotes.and.returnValue(Promise.resolve(apiResponse));

      const results = await service.getHistoricalPrices(['XLON:CSPX'], inceptionDate, refDate, 'USD');

      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(1);
      expect(results[0].currency).toBe('USD');
      expect(results[0].history[0].price).toBe(450.0);
    });

    it('should fetch forex pair and convert prices when baseCurrency differs from quote currency', async () => {
      const benchmarkResponse: HistoricalQuoteResponse[] = [
        {
          symbol: 'XLON:CSPX',
          currency: 'USD',
          history: [
            { date: '2024-01-03', price: 500.0 },
            { date: '2024-01-04', price: 505.0 },
          ],
        },
      ];
      const forexResponse: HistoricalQuoteResponse[] = [
        {
          symbol: 'USDRON=X',
          currency: 'RON',
          history: [
            { date: '2024-01-03', price: 4.6 },
            { date: '2024-01-04', price: 4.65 },
          ],
        },
      ];

      mockAssetsQuoteService.getHistoricalQuotes.and.callFake((symbols: string[]) => {
        if (symbols.includes('XLON:CSPX')) {
          return Promise.resolve(benchmarkResponse);
        }
        if (symbols.includes('USDRON=X')) {
          return Promise.resolve(forexResponse);
        }
        return Promise.resolve([]);
      });

      const results = await service.getHistoricalPrices(['XLON:CSPX'], inceptionDate, refDate, 'RON');

      // First call for benchmark XLON:CSPX, second call for forex pair USDRON=X
      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(2);
      expect(results.length).toBe(1);
      expect(results[0].symbol).toBe('XLON:CSPX');
      expect(results[0].currency).toBe('RON');
      expect(results[0].history[0]).toEqual({ date: '2024-01-03', price: 2300 }); // 500 * 4.6
      expect(results[0].history[1]).toEqual({ date: '2024-01-04', price: 2348.25 }); // 505 * 4.65

      // Calling again should use the cache for both benchmark and forex without additional API calls
      mockAssetsQuoteService.getHistoricalQuotes.calls.reset();
      const cachedResults = await service.getHistoricalPrices(['XLON:CSPX'], inceptionDate, refDate, 'RON');
      expect(mockAssetsQuoteService.getHistoricalQuotes).not.toHaveBeenCalled();
      expect(cachedResults[0].currency).toBe('RON');
      expect(cachedResults[0].history[0].price).toBe(2300);
    });

    it('should convert RON benchmark to EUR base currency using EURRON=X inverse pair', async () => {
      const ronBenchmarkResponse: HistoricalQuoteResponse[] = [
        {
          symbol: 'XBSE:BET',
          currency: 'RON',
          history: [
            { date: '2024-01-03', price: 100.0 },
            { date: '2024-01-04', price: 105.0 },
          ],
        },
      ];
      const eurRonResponse: HistoricalQuoteResponse[] = [
        {
          symbol: 'EURRON=X',
          currency: 'RON',
          history: [
            { date: '2024-01-03', price: 5.0 },
            { date: '2024-01-04', price: 5.0 },
          ],
        },
      ];

      mockAssetsQuoteService.getHistoricalQuotes.and.callFake((symbols: string[]) => {
        if (symbols.includes('XBSE:BET')) {
          return Promise.resolve(ronBenchmarkResponse);
        }
        if (symbols.includes('EURRON=X')) {
          return Promise.resolve(eurRonResponse);
        }
        return Promise.resolve([]);
      });

      // User's base currency is EUR, benchmark is in RON
      const results = await service.getHistoricalPrices(['XBSE:BET'], inceptionDate, refDate, 'EUR');

      expect(mockAssetsQuoteService.getHistoricalQuotes).toHaveBeenCalledTimes(2);
      // Verify the forex pair requested has EUR as <from_currency> (EURRON=X, NOT RONEUR=X)
      const forexCall = mockAssetsQuoteService.getHistoricalQuotes.calls.argsFor(1);
      expect(forexCall[0]).toEqual(['EURRON=X']);

      expect(results.length).toBe(1);
      expect(results[0].symbol).toBe('XBSE:BET');
      expect(results[0].currency).toBe('EUR');
      // 100 RON / 5.0 = 20 EUR
      expect(results[0].history[0]).toEqual({ date: '2024-01-03', price: 20 });
      // 105 RON / 5.0 = 21 EUR
      expect(results[0].history[1]).toEqual({ date: '2024-01-04', price: 21 });
    });
  });

  describe('getForexConversionPlan', () => {
    it('should return direct plan when fromCurrency is in EUR, USD, GBP', () => {
      const usdRon = service.getForexConversionPlan('USD', 'RON');
      expect(usdRon).toEqual({
        type: 'direct',
        pairs: ['USDRON=X'],
        directPair: 'USDRON=X',
      });

      const eurGbp = service.getForexConversionPlan('EUR', 'GBP');
      expect(eurGbp).toEqual({
        type: 'direct',
        pairs: ['EURGBP=X'],
        directPair: 'EURGBP=X',
      });
    });

    it('should return inverse plan when toCurrency is in EUR, USD, GBP and from is not', () => {
      const ronEur = service.getForexConversionPlan('RON', 'EUR');
      expect(ronEur).toEqual({
        type: 'inverse',
        pairs: ['EURRON=X'],
        inversePair: 'EURRON=X',
      });

      const ronUsd = service.getForexConversionPlan('RON', 'USD');
      expect(ronUsd).toEqual({
        type: 'inverse',
        pairs: ['USDRON=X'],
        inversePair: 'USDRON=X',
      });
    });

    it('should return cross plan via EUR bridge when neither currency is in EUR, USD, GBP', () => {
      const ronPln = service.getForexConversionPlan('RON', 'PLN');
      expect(ronPln).toEqual({
        type: 'cross',
        pairs: ['EURRON=X', 'EURPLN=X'],
        bridgePairFrom: 'EURRON=X',
        bridgePairTo: 'EURPLN=X',
      });
    });

    it('should return null when from and to currencies match or are empty', () => {
      expect(service.getForexConversionPlan('EUR', 'EUR')).toBeNull();
      expect(service.getForexConversionPlan('RON', 'RON')).toBeNull();
      expect(service.getForexConversionPlan('', 'EUR')).toBeNull();
    });
  });

  describe('getHistoricalForexRate', () => {
    beforeEach(() => {
      storedBenchmarksCache = {
        quotes: {
          'EURUSD=X': {
            symbol: 'EURUSD=X',
            lastFetchTime: Date.now(),
            data: {
              symbol: 'EURUSD=X',
              currency: 'USD',
              history: [
                { date: '2024-01-02', price: 1.10 },
                { date: '2024-01-05', price: 1.12 },
              ],
            },
          },
          'USDRON=X': {
            symbol: 'USDRON=X',
            lastFetchTime: Date.now(),
            data: {
              symbol: 'USDRON=X',
              currency: 'RON',
              history: [
                { date: '2024-01-02', price: 4.50 },
                { date: '2024-01-05', price: 4.60 },
              ],
            },
          },
          'EURRON=X': {
            symbol: 'EURRON=X',
            lastFetchTime: Date.now(),
            data: {
              symbol: 'EURRON=X',
              currency: 'RON',
              history: [
                { date: '2024-01-02', price: 4.95 },
                { date: '2024-01-05', price: 5.00 },
              ],
            },
          },
          'EURCAD=X': {
            symbol: 'EURCAD=X',
            lastFetchTime: Date.now(),
            data: {
              symbol: 'EURCAD=X',
              currency: 'CAD',
              history: [
                { date: '2024-01-02', price: 1.45 },
                { date: '2024-01-05', price: 1.50 },
              ],
            },
          },
        },
      };
    });

    it('should return 1 when currencies match (case-insensitive)', () => {
      expect(service.getHistoricalForexRate('USD', 'USD', '2024-01-02')).toBe(1);
      expect(service.getHistoricalForexRate('eur', 'EUR', '2024-01-02')).toBe(1);
    });

    it('should return direct rate for direct plan', async () => {
      await (service as any).ensureCacheLoaded();
      const rate = service.getHistoricalForexRate('EUR', 'USD', '2024-01-02');
      expect(rate).toBe(1.10);
    });

    it('should return inverse rate for inverse plan', async () => {
      await (service as any).ensureCacheLoaded();
      // RON -> USD is inverse (USDRON=X with rate 4.50) -> 1 / 4.50
      const ronUsd = service.getHistoricalForexRate('RON', 'USD', '2024-01-02');
      expect(ronUsd).toBeCloseTo(1 / 4.50, 5);
    });

    it('should return cross rate via EUR bridge', async () => {
      await (service as any).ensureCacheLoaded();
      const rate = service.getHistoricalForexRate('RON', 'CAD', '2024-01-02');
      expect(rate).toBeCloseTo(1.45 / 4.95, 5);
    });

    it('should use closest available date rate when exact date is missing (e.g. weekend)', async () => {
      await (service as any).ensureCacheLoaded();
      const rate = service.getHistoricalForexRate('EUR', 'USD', '2024-01-03');
      expect(rate).toBe(1.10);

      const rate2 = service.getHistoricalForexRate('EUR', 'USD', '2024-01-04');
      expect(rate2).toBe(1.12);
    });

    it('should return fallback rate or null when quotes are not cached', async () => {
      await (service as any).ensureCacheLoaded();
      expect(service.getHistoricalForexRate('GBP', 'JPY', '2024-01-02', 150)).toBe(150);
      expect(service.getHistoricalForexRate('GBP', 'JPY', '2024-01-02')).toBeNull();
    });
  });

  describe('prefetchForexRatesForTransactions', () => {
    it('should pre-fetch forex pairs for non-base currency cash transactions', async () => {
      const transactions = [
        {
          type: TransactionType.CreditCash,
          asset: { currency: 'USD', accountDescription: 'Main', accountId: 1 },
          value: 1000,
          date: '2024-01-15',
        } as Transaction,
        {
          type: TransactionType.DebitCash,
          asset: { currency: 'RON', accountDescription: 'Main', accountId: 1 },
          value: 500,
          date: '2024-01-10',
        } as Transaction,
        {
          type: TransactionType.CreditCash,
          asset: { currency: 'EUR', accountDescription: 'Main', accountId: 1 },
          value: 200,
          date: '2024-01-20',
        } as Transaction,
        {
          type: TransactionType.Buy,
          asset: { currency: 'USD', accountDescription: 'Main', accountId: 1 },
          value: 300,
          date: '2024-01-01',
        } as Transaction,
      ];

      spyOn(service, 'getHistoricalPrices').and.returnValue(Promise.resolve([]));

      await service.prefetchForexRatesForTransactions(transactions, 'EUR');

      expect(service.getHistoricalPrices).toHaveBeenCalled();
      const [symbols, earliestDate] = (service.getHistoricalPrices as jasmine.Spy).calls.argsFor(0);
      expect(symbols).toContain('USDEUR=X');
      expect(symbols).toContain('EURRON=X');
      expect(earliestDate.toISOString().split('T')[0]).toBe('2024-01-10');
    });
  });

  describe('computePortfolioFullTWR with forex conversion', () => {
    it('should convert foreign currency cash inflows using historical forex rate', async () => {
      const history: PortfolioHistory = {
        entries: [
          { date: '2024-01-01', assets: [{ value: 10000, currency: 'EUR', id: 1 }] },
          { date: '2024-01-02', assets: [{ value: 12000, currency: 'EUR', id: 1 }] },
        ],
      } as any;

      const transactions = [
        {
          type: TransactionType.CreditCash,
          asset: { currency: 'USD', accountDescription: 'Main', accountId: 1 },
          value: 1000,
          date: '2024-01-02',
        } as Transaction,
      ];

      spyOn(service, 'prefetchForexRatesForTransactions').and.returnValue(Promise.resolve());
      spyOn(service, 'getHistoricalForexRate').and.callFake((from, to, date) => {
        if (from === 'USD' && to === 'EUR') return 0.8;
        return 1;
      });

      const twrSeries = await service.computePortfolioFullTWR(
        history,
        transactions,
        'EUR',
        () => 0.5
      );

      expect(service.getHistoricalForexRate).toHaveBeenCalledWith('USD', 'EUR', '2024-01-02', 0.5);
      expect(twrSeries.length).toBe(2);
      expect(twrSeries[1].twr).toBe(11.54);
    });
  });

  describe('computePortfolioIRR', () => {
    it('should return nulls when history is empty or invalid', async () => {
      const res1 = await service.computePortfolioIRR(null, [], 'EUR');
      expect(res1).toEqual({ irr: null, totalReturn: null, inaccurateIRR: false });

      const res2 = await service.computePortfolioIRR({ entries: [] } as any, [], 'EUR');
      expect(res2).toEqual({ irr: null, totalReturn: null, inaccurateIRR: false });
    });

    it('should return nulls when no entries match minDate', async () => {
      const history: PortfolioHistory = {
        entries: [
          { date: '2023-01-01', assets: [{ value: 10000, currency: 'EUR', id: 1 }] },
        ],
      } as any;
      const res = await service.computePortfolioIRR(history, [], 'EUR', new Date('2024-01-01'));
      expect(res).toEqual({ irr: null, totalReturn: null, inaccurateIRR: false });
    });

    it('should compute IRR and total return for base currency transactions', async () => {
      const history: PortfolioHistory = {
        entries: [
          { date: '2024-01-01', assets: [{ value: 10000, currency: 'EUR', id: 1 }] },
          { date: '2025-01-01', assets: [{ value: 15000, currency: 'EUR', id: 1 }] },
        ],
      } as any;

      const transactions: Transaction[] = [
        {
          type: TransactionType.CreditCash,
          asset: { currency: 'EUR', accountDescription: 'Main', accountId: 1 },
          value: 2000,
          date: '2024-06-01',
        } as Transaction,
      ];

      const res = await service.computePortfolioIRR(history, transactions, 'EUR');

      expect(res.inaccurateIRR).toBeFalse();
      expect(res.totalReturn).toBeCloseTo(0.3, 2); // (15000 - 2000 - 10000) / 10000 = 0.3
      expect(res.irr).toBeGreaterThan(0.2); // Annualized IRR should be around 25-28%
    });

    it('should convert foreign currency transactions using historical forex rate', async () => {
      const history: PortfolioHistory = {
        entries: [
          { date: '2024-01-01', assets: [{ value: 10000, currency: 'EUR', id: 1 }] },
          { date: '2025-01-01', assets: [{ value: 15000, currency: 'EUR', id: 1 }] },
        ],
      } as any;

      const transactions: Transaction[] = [
        {
          type: TransactionType.CreditCash,
          asset: { currency: 'USD', accountDescription: 'Main', accountId: 1 },
          value: 1000,
          date: '2024-06-01',
        } as Transaction,
      ];

      spyOn(service, 'prefetchForexRatesForTransactions').and.returnValue(Promise.resolve());
      spyOn(service, 'getHistoricalForexRate').and.returnValue(0.8); // 1000 USD = 800 EUR

      const res = await service.computePortfolioIRR(history, transactions, 'EUR');

      expect(service.getHistoricalForexRate).toHaveBeenCalledWith('USD', 'EUR', '2024-06-01');
      expect(res.inaccurateIRR).toBeFalse();
      // Total return: (15000 - 800 - 10000) / 10000 = 0.42
      expect(res.totalReturn).toBeCloseTo(0.42, 2);
      expect(res.irr).toBeGreaterThan(0.3);
    });

    it('should flag inaccurateIRR and use fallback currencyRateFn when historical rate is missing', async () => {
      const history: PortfolioHistory = {
        entries: [
          { date: '2024-01-01', assets: [{ value: 10000, currency: 'EUR', id: 1 }] },
          { date: '2025-01-01', assets: [{ value: 15000, currency: 'EUR', id: 1 }] },
        ],
      } as any;

      const transactions: Transaction[] = [
        {
          type: TransactionType.CreditCash,
          asset: { currency: 'USD', accountDescription: 'Main', accountId: 1 },
          value: 1000,
          date: '2024-06-01',
        } as Transaction,
      ];

      spyOn(service, 'prefetchForexRatesForTransactions').and.returnValue(Promise.resolve());
      spyOn(service, 'getHistoricalForexRate').and.returnValue(null);

      const res = await service.computePortfolioIRR(
        history,
        transactions,
        'EUR',
        null,
        () => 0.9 // fallback rate
      );

      expect(res.inaccurateIRR).toBeTrue();
      // Total return: (15000 - 900 - 10000) / 10000 = 0.41
      expect(res.totalReturn).toBeCloseTo(0.41, 2);
    });
  });
});


