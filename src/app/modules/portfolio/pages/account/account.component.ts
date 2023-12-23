import { Component, ViewChild, OnDestroy, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatTab, MatTabChangeEvent } from '@angular/material/tabs';
import { debounce } from 'lodash-decorators';

import { EventsService, AppEvent, AppEventType } from 'src/app/core/services/events.service';
import { PortfolioAccount } from '../../models/portfolio-account';
import { PortfolioService } from '../../services/portfolio.service';
import { AssetType } from '../../models/asset';
import { AssetsComponent } from '../../components/assets/assets.component';
import { AssetOverview } from '../../models/asset-overview';
import { Transaction, TransactionType } from '../../models/transaction';
import { LoggerService } from 'src/app/core/services/logger.service';
import { CurrencyBalance } from '../../models/currency-balance';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { AssetManagementService } from '../../services/asset-management.service';
import { ViewAsset } from '../../models/view-asset';
import { Dictionary, NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { TransactionsListComponent } from '../../components/transactions-list/transactions-list.component';
import { StorageService } from 'src/app/core/services/storage.service';
import { Subscription } from 'rxjs';
import {
  TransactionFilters, TransactionsFilterEditComponent
} from '../../components/transactions-filter-edit/transactions-filter-edit.component';
import { DateUtils } from 'src/app/shared/util';

interface AssetGroup {
  overview: AssetOverview;
  assets: ViewAsset[];
}

/**
 * Component to display a UI page for viewing and managing the assets of an account
 */
@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent extends AssetsComponent implements OnInit, OnDestroy {

  static readonly TRANSACTIONS_TAB_IDX = 1;

  account: PortfolioAccount;
  allTransactions: Transaction[];
  assetsGroupOverview: Dictionary<AssetOverview> = {};
  cash: AssetGroup;
  cashBalances: CurrencyBalance[];
  deposits: AssetGroup;
  depositBalances: CurrencyBalance[];
  debt: AssetGroup;
  debtBalances: CurrencyBalance[];
  displayTxFilterButton: boolean;
  bonds: AssetGroup;
  commodities: AssetGroup;
  cryptocurrencies: AssetGroup;
  filters: TransactionFilters;
  forex: AssetGroup;
  groupedAssets: NumKeyDictionary<ViewAsset[]> = {};
  p2p: AssetGroup;
  realEstate: AssetGroup;
  stocks: AssetGroup;
  mmAssets: AssetGroup;
  transactions: Transaction[];
  transactionsLoaded = false;

  readonly AssetType = AssetType;

  private currentAccountId: number;
  @ViewChild('transactionsList') private readonly transactionsList: TransactionsListComponent;
  @ViewChild('transactionsTab') private readonly transactionsTab: MatTab;

  private paramMapSubscription: Subscription;

  constructor(private route: ActivatedRoute, protected router: Router, protected eventsService: EventsService,
    protected portfolioService: PortfolioService, logger: LoggerService, private dialogsService: DialogsService,
    private assetManagementService: AssetManagementService, private location: Location,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef) {
    super(portfolioService, eventsService, logger, dialogsService, router, storageService, cdr);
  }

  ngOnInit() {
    super.ngOnInit();
    this.assetTypes = AssetType.All;

    this.filters = {
      includedTypes: {},
      minDate: null,
      maxDate: null,
    };
    // select all transaction types
    Object.values(TransactionType).forEach(txType => this.filters.includedTypes[txType] = true);

    // called every time account id parameter changes in route
    this.paramMapSubscription = this.route.paramMap
      .subscribe(params => {
        this.assetsLoaded = false;
        this.clearAssetData();
        const idParam = params.get('accountId');
        if (idParam === 'new') {
          this.account = new PortfolioAccount();
          // no UI interaction here, queue the event
          setTimeout(() => {
            this.createAccount();
          });
        } else {
          const id: number = +idParam;
          // we may get the account id before config is loaded, so we need to wait it to load first
          if (this.isConfigLoaded()) {
            this.getAccountData(id);
          } else {
            this.currentAccountId = id;
          }
        }
      });
  }

  ngOnDestroy() {
    this.paramMapSubscription.unsubscribe();
    super.ngOnDestroy();
  }

  protected onConfigLoaded() {
    super.onConfigLoaded();
    if (this.currentAccountId) {
      this.getAccountData(this.currentAccountId);
    }
  }

  /**
   * Creates a new empty account, with a name given by the user
   */
  async createAccount() {
    const newName = await this.dialogsService.input('Enter the new account name:');
    if (newName) {
      this.account.description = newName;
      try {
        const account = await this.portfolioService.addAccount(this.account);
        this.logger.info('Account created');
        this.eventsService.accountAdded(account.id);
        this.router.navigate(['../' + account.id], { relativeTo: this.route });
      } catch (err) {
        this.logger.error('Could not create new account: ', err);
        this.location.back();
      }
    } else {
      this.location.back();
    }
  }

  /**
   * Delete the account, if user confirms it.
   */
  async deleteAccount() {
    const result = await this.dialogsService.confirm(`Are you sure you want to delete the selected account?
                                                     \nAll assets under the account will also be deleted.`);
    if (result) {
      try {
        await this.portfolioService.removeAccount(this.account);
        this.logger.info('Account removed!');
        this.eventsService.accountRemoved(this.account.id);
        this.router.navigate(['../../'], { relativeTo: this.route });
      } catch (err) {
        this.logger.error('Could not remove account!', err);
      }
    }
  }

  async editAccount() {
    const newName = await this.dialogsService.input('Enter the new account name:', '', this.account.description);
    if (newName && newName !== this.account.description) {
      try {
        this.account.description = newName;
        await this.portfolioService.updateAccount(this.account);
        this.eventsService.accountUpdated(this.account.id);
        this.logger.info('Account name changed!');
      } catch (err) {
        this.logger.error('Could not edit account name!', err);
      }
    }
  }

  addCashAsset() {
    this.assetManagementService.addCashAsset(this.account, this.baseCurrency);
  }

  addDeposit() {
    this.assetManagementService.addDeposit(this.account);
  }

  addDebt() {
    this.assetManagementService.addDebt(this.account, this.baseCurrency);
  }

  buyAsset(assetType: AssetType) {
    this.assetManagementService.buyTradeableAsset(assetType, this.account);

  }

  tabChanged(tabChangeEvent: MatTabChangeEvent) {
    this.displayTxFilterButton = tabChangeEvent.index === AccountComponent.TRANSACTIONS_TAB_IDX;
  }

  /**
   * Open the filter editor dialog and allow user to select filters for transactions
   */
  async showFilterDialog() {
    const newFilters = await this.dialogService.showAdaptableScreenModal(TransactionsFilterEditComponent, this.filters);
    if (newFilters) {
      this.filters = newFilters;
      this.filterTransactions();
      this.cdr.markForCheck();
    }
  }


  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.TRANSACTION_ADDED:
      case AppEventType.TRANSACTION_REMOVED:
      case AppEventType.TRANSACTION_UPDATED:
        this.onTransactionsUpdated();
        break;
      case AppEventType.ACCOUNT_REMOVED:
        if (event.data === this.account.id) {
          // navigate to home
          this.router.navigate(['../../'], { relativeTo: this.route });
        }
        break;
      case AppEventType.ACCOUNT_UPDATED:
        if (event.data === this.account.id) {
          this.onDataUpdated();
        }
        break;
      case AppEventType.ASSET_UPDATED:
        // check if asset belongs to account
        if (this.account.getAssetById(event.data)) {
          this.onDataUpdated();
        }
        break;
      default:
        super.handleEvents(event);
    }
  }

  /**
   * Display only transactions that match the given filters
   */
  private filterTransactions() {
    this.transactions = this.allTransactions.filter((tx: Transaction) =>
      this.filters.includedTypes[tx.type] &&
      (!this.filters.minDate || DateUtils.compareDates(this.filters.minDate, new Date(tx.date)) <= 0) &&
      (!this.filters.maxDate || DateUtils.compareDates(this.filters.maxDate, new Date(tx.date)) >= 0)
    );
  }

  @debounce(100)
  private onTransactionsUpdated() {
    if (this.account) {
      this.updateTransactionsList(this.account.id);
    }
  }

  @debounce(100)
  private onDataUpdated() {
    this.getAccountData(this.account.id, false);
  }


  protected createViewAssets(): ViewAsset[] {
    const list: ViewAsset[] = [];
    for (const asset of this.account.assets) {
      this.addViewAsset(asset, this.account, list);
    }
    return list;
  }

  /**
   * Load the data of an account and display it. Optionally it displays the
   * account's transactions too.
   * @param id account id
   * @param loadTransactions if `true` then transactions will be loaded too
   */
  private async getAccountData(id: number, loadTransactions: boolean = true) {
    this.currentAccountId = id;
    this.account = new PortfolioAccount();
    try {
      const account = await this.portfolioService.getAccount(id);
      if (account) {
        await this.displayAccount(account);
        if (loadTransactions) {
          this.updateTransactionsList(account.id);
        }
      } else {
        this.router.navigateByUrl('/404');
      }
    } catch (err) {
      this.logger.error('An error occurred while loading account data!', err);
    }
    this.onAssetsLoaded();
  }

  /**
   * (Re)load an account's transactions
   * @param accId account id
   */
  private async updateTransactionsList(accId) {
    try {
      this.allTransactions = [];
      this.transactionsLoaded = false;
      this.allTransactions = await this.portfolioService.getAccountTransactions(accId);
      this.filterTransactions();
    } catch (err) {
      this.logger.error('An error occurred while loading account transactions!', err);
    }
    this.transactionsLoaded = true;
    this.cdr.markForCheck();
  }


  /**
   * Group the balances of a cash asset group by their currency, and
   * sum them up
   * @param group  a cash asset group
   */
  private getCurrencyBalances(group: AssetGroup): CurrencyBalance[] {
    const currencyBalances: Dictionary<number> = {};
    for (const viewAsset of group.assets) {
      if (!currencyBalances[viewAsset.asset.currency]) {
        currencyBalances[viewAsset.asset.currency] = 0;
      }
      currencyBalances[viewAsset.asset.currency] += viewAsset.asset.amount;
    }

    // cash balances grouped by currency are needed for cash page
    const cashBalances: CurrencyBalance[] = [];
    for (const currency of Object.keys(currencyBalances)) {
      cashBalances.push({
        currency: currency,
        balance: currencyBalances[currency]
      });
    }
    cashBalances.sort((a, b) => {
      return a.currency < b.currency ? -1 : 1;
    });


    return cashBalances;

  }

  /**
   * Split assets into groups based on their type.
   * Bond ETFs/Mutual Funds are considered bonds and Commodity ETFs/Mutual funds are
   * considered commodities.
   */
  private categorizeAssets() {
    this.groupedAssets = {};
    this.assetsGroupOverview = {};
    for (const viewAsset of this.viewAssets) {
      let broadAssetType: AssetType;
      if (viewAsset.asset.isMoneyMarket()) {
        broadAssetType = AssetType.MoneyMarket; // include both Money Market ETFs & Mutual Funds
      } else if (viewAsset.asset.isBondLike()) { // include Bond ETFs/Mutual Funds
        broadAssetType = AssetType.Bond;
      } else if (viewAsset.asset.isCommodityLike()) { // include Commodity ETFs/Mutual Funds
        broadAssetType = AssetType.Commodity;
      } else if (viewAsset.asset.isStockLike()) { // include Stock ETFs/Mutual Funds
        broadAssetType = AssetType.Stock;
      } else {
        broadAssetType = viewAsset.asset.type;
      }

      if (!this.groupedAssets[broadAssetType]) {
        this.groupedAssets[broadAssetType] = [];
      }
      this.groupedAssets[broadAssetType].push(viewAsset);
    }

    for (const assetType of Object.keys(this.groupedAssets)) {
      const stats = new AssetOverview();

      for (const asset of <ViewAsset[]>this.groupedAssets[assetType]) {
        stats.initialValue += asset.initialValueBaseCurrency;
        stats.currentValue += asset.currentValueBaseCurrency;
      }
      stats.profitLoss = stats.currentValue - stats.initialValue;
      stats.profitLossPercent = (stats.initialValue === 0) ? 0 : (stats.currentValue - stats.initialValue) / stats.initialValue;
      this.assetsGroupOverview[assetType] = stats;
    }

    this.cash = {
      assets: this.groupedAssets[AssetType.Cash] || [],
      overview: this.assetsGroupOverview[AssetType.Cash]
    };
    this.deposits = {
      assets: this.groupedAssets[AssetType.Deposit] || [],
      overview: this.assetsGroupOverview[AssetType.Deposit]
    };
    this.debt = {
      assets: this.groupedAssets[AssetType.Debt] || [],
      overview: this.assetsGroupOverview[AssetType.Debt]
    };
    this.bonds = {
      assets: this.groupedAssets[AssetType.Bond] || [],
      overview: this.assetsGroupOverview[AssetType.Bond]
    };
    this.commodities = {
      assets: this.groupedAssets[AssetType.Commodity] || [],
      overview: this.assetsGroupOverview[AssetType.Commodity]
    };
    this.cryptocurrencies = {
      assets: this.groupedAssets[AssetType.Cryptocurrency] || [],
      overview: this.assetsGroupOverview[AssetType.Cryptocurrency]
    };
    this.forex = {
      assets: this.groupedAssets[AssetType.Forex] || [],
      overview: this.assetsGroupOverview[AssetType.Forex]
    };
    this.mmAssets = {
      assets: this.groupedAssets[AssetType.MoneyMarket] || [],
      overview: this.assetsGroupOverview[AssetType.MoneyMarket]
    };
    this.p2p = {
      assets: this.groupedAssets[AssetType.P2P] || [],
      overview: this.assetsGroupOverview[AssetType.P2P]
    };
    this.realEstate = {
      assets: this.groupedAssets[AssetType.RealEstate] || [],
      overview: this.assetsGroupOverview[AssetType.RealEstate]
    };
    this.stocks = {
      assets: this.groupedAssets[AssetType.Stock] || [],
      overview: this.assetsGroupOverview[AssetType.Stock]
    };

    this.cashBalances = this.getCurrencyBalances(this.cash);
    this.depositBalances = this.getCurrencyBalances(this.deposits);
    this.debtBalances = this.getCurrencyBalances(this.debt);
  }

  /**
   * clear any data specific to the current loaded account
   */
  protected clearAssetData() {
    super.clearAssetData();

    const defaultOverView = new AssetOverview();
    this.cash = { assets: [], overview: defaultOverView };
    this.deposits = { assets: [], overview: defaultOverView };
    this.debt = { assets: [], overview: defaultOverView };
    this.bonds = { assets: [], overview: defaultOverView };
    this.commodities = { assets: [], overview: defaultOverView };
    this.cryptocurrencies = { assets: [], overview: defaultOverView };
    this.forex = { assets: [], overview: defaultOverView };
    this.mmAssets = { assets: [], overview: defaultOverView };
    this.p2p = { assets: [], overview: defaultOverView };
    this.realEstate = { assets: [], overview: defaultOverView };
    this.stocks = { assets: [], overview: defaultOverView };
    this.cashBalances = [];
    this.depositBalances = [];
  }

  async buildAssetsList() {
    await super.buildAssetsList();
    this.categorizeAssets();
  }

  private displayAccount(account: PortfolioAccount): Promise<void> {
    this.account = account;
    return this.buildAssetsList();
  }
}
