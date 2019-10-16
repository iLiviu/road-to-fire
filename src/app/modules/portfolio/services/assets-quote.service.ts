import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { APP_CONSTS } from 'src/app/config/app.constants';
import { AssetQuote } from '../models/asset-quote';
import { AssetType } from '../models/asset';


const jsonHttpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  })
};


/**
 * Service that gets quotes for a list of given assets and forex quotes
 */
@Injectable()
export class AssetsQuoteService {

  constructor(private http: HttpClient) {
  }

  /**
   * Get the quotes for a given list of assets of the same type.
   * @param symbols symbols to get quotes for
   * @param assetType the type of the assets in the list
   */
  async getAssetQuotes(symbols: string[], assetType: AssetType): Promise<AssetQuote[]> {
    let path: string;
    switch (assetType) {
      case AssetType.Stock: path = 'stock';
        break;
      case AssetType.Bond: path = 'bond';
        break;
      case AssetType.Commodity: path = 'commodity';
        break;
      case AssetType.Cryptocurrency: path = 'crypto';
        break;
      case AssetType.MutualFund: path = 'mutualfund';
        break;
      default:
        throw new Error('Quotes unavailable for asset type:' + assetType);
    }
    const quotes = await this.http.post<AssetQuote[]>(APP_CONSTS.QUOTE_SERVICE_BASE_URL + path,
      { symbols: symbols }, jsonHttpOptions).toPromise();
    return quotes;
  }


  /**
   * Get the quotes for a given list of forex pairs
   * @param pairs forex pairs list
   */
  async getForexRates(pairs: string[]): Promise<AssetQuote[]> {
    const quotes = await this.http.post<AssetQuote[]>(APP_CONSTS.QUOTE_SERVICE_BASE_URL + 'forex',
      { symbols: pairs }, jsonHttpOptions).toPromise();
    return quotes;
  }
}
