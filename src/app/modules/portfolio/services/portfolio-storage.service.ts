import { Injectable } from '@angular/core';

import { StorageService } from 'src/app/core/services/storage.service';
import { PortfolioStorage } from '../models/portfolio-storage';

export const FOREXRATES_PATH = 'forex_rates';
export const FOREXRATES_ALIAS = 'forex-rates';
export const CONFIG_ALIAS = 'config';
export const CONFIG_PATH = 'config';
export const ACCOUNT_ALIAS = 'portfolio-account';
export const ACCOUNTS_PATH = 'accounts/';
export const ASSET_ALIAS = 'asset';
export const ASSETS_PATH = 'assets/';
export const TRANSACTION_ALIAS = 'transaction';
export const TRANSACTIONS_PATH = 'transactions/';
export const NOTIFICATIONS_PATH = 'notifications/';
export const NOTIFICATION_ALIAS = 'notification';
export const RECURRING_TRANSACTIONS_PATH = 'recurring-txs/';
export const RECURRING_TRANSACTION_ALIAS = 'recurring-tx';
export const PORTFOLIO_HISTORY_PATH = 'portfolio_history';
export const PORTFOLIO_HISTORY_ALIAS = 'portfolio-history';
export const TX_IMPORT_TEMPLATES_PATH = 'import-templates/';
export const TX_IMPORT_TEMPLATE_ALIAS = 'import-template';

@Injectable()
export abstract class PortfolioStorageService {
  readonly storage: PortfolioStorage;

  constructor(protected storageService: StorageService) {
    this.storage = this.storageService.addStorageModule(this.createStorageModule());
  }

  protected abstract createStorageModule(): any;
}
