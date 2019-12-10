import { Injectable } from '@angular/core';

import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioService } from 'src/app/modules/portfolio/services/portfolio.service';
import {
  Transaction, TransactionType, TransactionData
} from '../models/transaction';
import {
  Asset, AssetType, ASSET_TYPE_LABELS, AssetNotFoundError, AssetData
} from '../models/asset';
import { PortfolioAccount, AccountNotFoundError } from '../models/portfolio-account';
import { CashEditComponent, CashEditResponse } from 'src/app/modules/portfolio/components/cash-edit/cash-edit.component';
import {
  CashExchangeComponent, CashExchangeData, CashExchangeResponse
} from 'src/app/modules/portfolio/components/cash-exchange/cash-exchange.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import {
  DepositEditComponent, DepositEditData, DepositEditResponse
} from 'src/app/modules/portfolio/components/deposit-edit/deposit-edit.component';
import { AssetTransferComponent, AssetTransferData, AssetTransferResponse } from '../components/asset-transfer/asset-transfer.component';
import { CashFundComponent, CashFundData, CashFundResponse } from '../components/cash-fund/cash-fund.component';
import {
  DepositLiquidateComponent, DepositLiquidateData, DepositLiquidateResponse
} from '../components/deposit-liquidate/deposit-liquidate.component';
import {
  AssetTradeComponent, AssetTradeData, AssetTradeResponse, AssetTradeAction
} from '../components/asset-trade/asset-trade.component';
import { ViewAsset } from '../models/view-asset';
import { TransactionViewComponent } from '../components/transaction-view/transaction-view.component';
import { TransactionApproveComponent, TransactionApproveData } from '../components/transaction-approve/transaction-approve.component';
import { CashAssetViewComponent } from '../components/cash-asset-view/cash-asset-view.component';
import { TradeableAssetViewComponent, TradeableAssetViewData } from '../components/tradeable-asset-view/tradeable-asset-view.component';
import { RecurringTransaction, RecurringTransactionType, RecurringTransactionData } from '../models/recurring-transaction';
import { RecurringTransactionViewComponent } from '../components/recurring-transaction-view/recurring-transaction-view.component';
import {
  RecurringTransactionEditComponent, RecurringTransactionEditData
} from '../components/recurring-transaction-edit/recurring-transaction-edit.component';
import {
  DividendTransactionEditComponent, DividendTxEditResponse, DividendTxEditData
} from '../components/dividend-transaction-edit/dividend-transaction-edit.component';
import { DepositAsset, DepositAssetData } from '../models/deposit-asset';
import { TradeableAsset, TradePosition, TradeableAssetData } from '../models/tradeable-asset';
import { BondAsset } from '../models/bond-asset';
import { TradeTransaction, TradeTransactionData } from '../models/trade-transaction';
import { TransferTransaction, TransferTransactionData } from '../models/transfer-transaction';
import { ExchangeTransaction, ExchangeTransactionData } from '../models/exchange-transaction';
import { SellTransactionData, SellTransaction } from '../models/sell-transaction';
import { DividendTransactionData, DividendTransaction } from '../models/dividend-transaction';
import { TransactionFactory } from '../models/transaction-factory';
import { AssetFactory } from '../models/asset-factory';
import { TwoWayTransaction } from '../models/two-way-transaction';
import { InterestTransaction, InterestTransactionData } from '../models/interest-transaction';
import { FloatingMath, DateUtils } from 'src/app/shared/util';
import { TotalReturnStats } from '../models/total-return-stats';
import {
  InterestTxEditResponse, InterestTransactionEditComponent, InterestTxEditData
} from '../components/interest-transaction-edit/interest-transaction-edit.component';
import {
  CostTransactionEditComponent, CostTransactionEditData, CostTransactionEditResponse
} from '../components/cost-transaction-edit/cost-transaction-edit.component';
import { CapitalCostTransaction, CapitalCostTransactionData } from '../models/capital-cost-transaction';
import { UserAppError } from 'src/app/shared/models/user-app-error';
import { AssetRegion } from '../models/asset-region';

interface PortfolioCSVRow {
  instrument: string;
  type: string;
  symbol?: string;
  currency: string;
  account: string;
  region?: string;
  amount: number;
  buyPrice?: number;
  fees?: number;
  cost?: number;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
}

/**
 * Service to handle user actions on assets
 */
@Injectable()
export class AssetManagementService {

  constructor(private logger: LoggerService, private portfolioService: PortfolioService,
    private dialogsService: DialogsService) {
  }

  /**
   * Adds an interest payment transaction and optionally updates cash account balance with the interest amount
   * @param payAmount interest amount
   * @param fee payment fee
   * @param withholdingTax witholding tax amount
   * @param txDate date of transaction
   * @param payerAsset asset that pays the interest
   * @param cashAsset cash asset where interest amount will be credited if `creditCashAsset` is set to true
   * @param account account that holds the payer asset
   * @param addNotification if `true`, adds a notification about the interest payment transaction
   * @param creditCashAsset if `true` updates the balance of the cash asset with the interest amount
   */
  async payInterest(payAmount: number, fee: number, withholdingTax: number, txDate: Date, payerAsset: Asset,
    cashAsset: Asset, account: PortfolioAccount, addNotification: boolean, creditCashAsset: boolean): Promise<void> {

    try {
      if (!cashAsset) {
        if (payerAsset.cashAssetId) {
          cashAsset = account.getAssetById(payerAsset.cashAssetId);
          // check that cash asset currency was not changed
          if (cashAsset && cashAsset.currency !== payerAsset.currency) {
            cashAsset = null;
          }
        }
      }
      if (!this.isFutureDate(txDate.toISOString()) && cashAsset && creditCashAsset) {
        cashAsset.amount = FloatingMath.fixRoundingError(cashAsset.amount + payAmount);
        await this.portfolioService.updateAsset(cashAsset, account);
      }

      const tx = this.createInterestTransaction(payAmount, fee, withholdingTax, txDate, payerAsset, account, cashAsset);
      await this.addInterestTransaction(tx, addNotification);
    } catch (err) {
      this.logger.error(`Could not add interest payment: ${err}`, err);
    }
  }

  /**
   * Prompts the user to add a new cash asset in a specified account
   * @param account account where cash asset is to be added
   * @param defaultCurrency currency to be selected as default
   * @return Promise that resolves with the new cash asset object
   */
  async addCashAsset(account: PortfolioAccount, defaultCurrency: string = null): Promise<Asset> {
    try {
      const newAssetData: AssetData = {
        currency: defaultCurrency,
        amount: 0,
        description: null,
        type: AssetType.Cash,
      };
      let newAsset = new Asset(newAssetData);
      const result: CashEditResponse = await this.dialogsService.showAdaptableScreenModal(CashEditComponent, newAsset);
      if (result) {
        newAsset = await this.portfolioService.addAsset(result.asset, account);

        this.logger.info('Cash account added!');
        // if initial balance is positive we add a transaction for funding
        if (result.asset.amount > 0) {
          this.addCashTransaction(newAsset, account, newAsset.amount,
            `Initial funding for ${newAsset.description}`, result.transactionDate);
        }
        return newAsset;
      }
    } catch (error) {
      this.logger.error(`Could not add cash account: ${error}`, error);
    }
    return null;
  }

  /**
   * Prompts user to add details about a new debt and executes the transaction
   * @param account account to add the new debt into.
   * @param defaultCurrency currency to be selected as default
   * @return Promise that resolves with the new debt asset object
   */
  async addDept(account: PortfolioAccount, defaultCurrency: string = null) {
    try {
      const newAssetData: AssetData = {
        currency: defaultCurrency,
        amount: 0,
        description: null,
        type: AssetType.Debt,
      };
      let newAsset = new Asset(newAssetData);
      const result: CashEditResponse = await this.dialogsService.showAdaptableScreenModal(CashEditComponent, newAsset);
      if (result) {
        newAsset = await this.portfolioService.addAsset(result.asset, account);
        this.logger.info('Debt added!');

        // if initial balance is non 0 we add a transaction for funding
        if (result.asset.amount) {
          this.addCashTransaction(newAsset, account, newAsset.amount,
            `New Debt: ${newAsset.description}`, result.transactionDate);
        }
        return newAsset;
      }
    } catch (error) {
      this.logger.error(`Could not add debt: ${error}`, error);
    }
    return null;
  }

  /**
   * Display a dialog with details about an asset.
   * @param viewAsset asset to view details for
   */
  async viewAsset(viewAsset: ViewAsset) {
    let action: string;
    if (!viewAsset.asset.isTradeable()) {
      action = await this.dialogsService.showModal(CashAssetViewComponent, viewAsset, false);
    } else {
      const totalReturnStats = await this.getTotalReturnStats(<TradeableAsset>viewAsset.asset);
      const taData: TradeableAssetViewData = {
        viewAsset: viewAsset,
        totalReturnStats: totalReturnStats,
      };
      action = await this.dialogsService.showModal(TradeableAssetViewComponent, taData, false);
    }
    // user clicked the `Edit` button, so open the edit dialog
    if (action === 'edit') {
      this.editAsset(viewAsset);
    }

  }

  /**
   * Opens a dialog with details for a given transaction
   * @param tx transaction to view details for
   */
  viewTransaction(tx: Transaction) {
    return this.dialogsService.show(TransactionViewComponent, tx);
  }

  /**
   * Prompts the user to approve a transaction. User will need to fill any empty fields before he can
   * approve the transaction. After transaction is approved, it is executed and affected assets updated.
   * @param txData transaction details
   */
  async approveTransaction(txData: TransactionData): Promise<boolean> {
    let approved = false;
    try {
      let isMetaTransaction = false;
      let cashAssetNeeded: boolean;
      let tradeTx: TradeTransaction;
      let transferTx: TransferTransaction;
      let exchangeTx: ExchangeTransaction;
      let dividendTx: DividendTransaction;
      const tx = TransactionFactory.newInstance(txData.type, txData);

      if (tx.isExchange()) {
        exchangeTx = <ExchangeTransaction>tx;
      } else if (tx.isTrade()) {
        tradeTx = <TradeTransaction>tx;
        if (!tradeTx.exchangedAsset.id) {
          cashAssetNeeded = true;
        }
      } else if (tx.isTransfer()) {
        transferTx = <TransferTransaction>tx;
        if (!transferTx.destinationAsset.id) {
          cashAssetNeeded = true;
        }
      } else if (tx.isDividend()) {
        dividendTx = <DividendTransaction>tx;
        if (!dividendTx.asset.id) {
          cashAssetNeeded = true;
        }

      }
      const account = await this.portfolioService.getAccount(tx.asset.accountId);
      if (!account) {
        throw new AccountNotFoundError(tx.asset.accountId);
      }

      if (cashAssetNeeded) {
        // we need to create a cash asset in same currency first
        const accountPresent = await this.requireCurrencyCashAsset(tx.asset.currency, account);
        if (!accountPresent) {
          return false;
        }
      }

      const data: TransactionApproveData = {
        tx,
        account,
      };
      approved = await this.dialogsService.showModal(TransactionApproveComponent, data);

      if (approved) {
        const sourceAsset = account.getAssetById(tx.asset.id);
        if (!sourceAsset) {
          throw new AssetNotFoundError(tx.asset.id);
        }

        if (exchangeTx) {
          const destinationAcc = await this.portfolioService.getAccount(exchangeTx.exchangedAsset.accountId);
          if (!destinationAcc) {
            throw new AccountNotFoundError(exchangeTx.exchangedAsset.accountId);
          }

          const destinationAsset = destinationAcc.getAssetById(exchangeTx.exchangedAsset.id);
          if (!destinationAsset) {
            throw new AssetNotFoundError(exchangeTx.exchangedAsset.id);
          }
          await this.exchange(sourceAsset, account, destinationAsset, destinationAcc, exchangeTx.value, exchangeTx.rate, exchangeTx.fee);

        } else if (tradeTx) {
          if (tradeTx.isSellTrade()) {
            const sourceTrAsset = <TradeableAsset>sourceAsset;
            const sellTx = <SellTransaction>tradeTx;
            const cashAsset = account.getAssetById(sellTx.exchangedAsset.id);
            if (!cashAsset) {
              throw new AssetNotFoundError(sellTx.exchangedAsset.id);
            }

            if (tradeTx.isPrincipalPayment()) {
              const bond = <BondAsset>sourceTrAsset;
              await this.payBondPrincipal(tradeTx.rate, bond, cashAsset, account, new Date(tradeTx.date), false);
              // our transaction is just a meta transaction, and the real transactions were already added by payBondPrincipal
              isMetaTransaction = true;
            } else {
              const position = sourceTrAsset.findPosition(sellTx.positionId);
              if (position) {
                await this.sell(position, sourceTrAsset, account, sellTx.amount, sellTx.rate, sellTx.fee, true, cashAsset);
              } else {
                throw new Error(`Could not find matching position for transaction!`);
              }
            }
          } else {
            throw new Error('Action not supported: Scheduled buy');
          }
        } else if (transferTx) {
          const destinationAcc = await this.portfolioService.getAccount(transferTx.destinationAsset.accountId);
          if (!destinationAcc) {
            throw new AccountNotFoundError(transferTx.destinationAsset.accountId);
          }

          const destinationAsset = destinationAcc.getAssetById(transferTx.destinationAsset.id);
          if (!destinationAsset) {
            throw new AssetNotFoundError(transferTx.destinationAsset.id);
          }
          const netAmount = FloatingMath.fixRoundingError(transferTx.value - transferTx.fee);
          await this.transfer(sourceAsset, account, null, destinationAsset, destinationAcc, netAmount, transferTx.fee);
        } else if (dividendTx) {
          await this.payDividend(account, dividendTx, true);
          // transaction already added
          isMetaTransaction = true;
        } else if (tx.includesCash()) {
          const multiplier = tx.isCredit() ? 1 : -1;
          const amount = tx.value * multiplier;
          const newBalance = FloatingMath.fixRoundingError(sourceAsset.amount + amount);
          // do not allow negative balances when debiting non-debt assets
          if (sourceAsset.isDebt() || amount > 0 || FloatingMath.isPositive(newBalance)) {
            sourceAsset.amount = newBalance;
            await this.portfolioService.updateAsset(sourceAsset, account);
          } else {
            throw new Error('Not enough balance in ' + sourceAsset.description);
          }
        } else {
          throw new Error('Unsupported transaction type: ' + tx.type);
        }
        this.logger.info('Transaction approved!');
        if (!isMetaTransaction) {
          await this.addTransaction(tx);
        }
      }
      return approved;
    } catch (err) {
      this.logger.error('Transaction approve error: ' + err, err);

    }
    return false;
  }

  /**
   * Prompts the user to edit the data for a given cash asset
   * @param asset cash asset to edit
   * @param account account that holds the cash asset
   */
  async editCashAsset(asset: Asset, account: PortfolioAccount): Promise<Asset> {
    try {
      const result: CashEditResponse = await this.dialogsService.showAdaptableScreenModal(CashEditComponent, asset);
      if (result) {
        const newAsset = await this.portfolioService.updateAsset(result.asset, account);

        this.logger.info('Cash account edited!');
        return newAsset;
      }
    } catch (error) {
      this.logger.error(`Could not edit cash account: ${error}`, error);
    }
    return null;
  }

  /**
   * Prompts user to exchange cash from one currency to another. After user acceptance,
   * exchange is performed and a transaction is added.
   * @param asset asset that holds the currency to exchange from
   * @param account account that holds the cash asset
   */
  async exchangeCash(asset: Asset, account: PortfolioAccount) {
    const cashAssetsCount = account.assets
      .reduce((acc, currAsset) => acc + (currAsset.type === AssetType.Cash && currAsset.currency !== asset.currency ? 1 : 0), 0);
    if (cashAssetsCount === 0) {
      const createCashAsset = await this.dialogsService.confirm(`There are no cash accounts in a different currency ` +
        `than ${asset.currency} available to exchange funds to!\nWould you like to create one now?.`);
      if (createCashAsset) {
        const cashAsset = await this.addCashAsset(account);
        if (!cashAsset || cashAsset.currency === asset.currency) { // account of same currency was created
          return;
        }
      } else {
        return;
      }
    }

    const result: CashExchangeResponse = await this.dialogsService.showAdaptableScreenModal(CashExchangeComponent, <CashExchangeData>{
      account: account,
      sourceAsset: asset,
    });
    if (result) {
      try {
        await this.exchange(asset, account, result.destinationAsset, account, result.amount, result.rate, result.fee);
        this.logger.info('Cash exchanged');
        const txData: ExchangeTransactionData = {
          asset: {
            accountDescription: account.description,
            accountId: account.id,
            id: asset.id,
            description: asset.description,
            currency: asset.currency,
          },
          date: result.transactionDate,
          otherAsset: {
            id: result.destinationAsset.id,
            currency: result.destinationAsset.currency,
            description: result.destinationAsset.description,
            accountDescription: account.description,
            accountId: account.id,
          },
          type: TransactionType.Exchange,
          fee: result.fee,
          amount: result.amount,
          rate: result.rate,
          value: result.amount * result.rate,
          description: result.description,
        };
        const tx = new ExchangeTransaction(txData);
        await this.addTransaction(tx);
      } catch (err) {
        this.logger.error('Could not exchange cash: ' + err, err);
      }
    }
  }

  /**
   * Prompts user to set an amount to credit a cash asset
   * @param asset cash asset to credit
   * @param account account that holds the asset
   */
  creditCashAsset(asset: Asset, account: PortfolioAccount) {
    const promise = this.changeCashAssetBalance(asset, account, TransactionType.CreditCash);
    return promise;
  }

  /**
   * Prompts user to set an amount to debit a cash asset
   * @param asset cash asset to credit
   * @param account account that holds the asset
   */
  debitCashAsset(asset: Asset, account: PortfolioAccount) {
    const promise = this.changeCashAssetBalance(asset, account, TransactionType.DebitCash);
    return promise;
  }

  async addCostTransaction(asset: Asset, account: PortfolioAccount) {
    const data: CostTransactionEditData = {
      asset: asset,
      account: account,
    };
    const result: CostTransactionEditResponse = await this.dialogsService.showAdaptableScreenModal(CostTransactionEditComponent, data);
    if (result) {
      const txData: CapitalCostTransactionData = {
        asset: {
          accountDescription: account.description,
          accountId: account.id,
          currency: result.cashAsset.currency,
          id: result.cashAsset.id,
          description: result.cashAsset.description,
        },
        otherAsset: {
          accountDescription: account.description,
          accountId: account.id,
          currency: asset.currency,
          id: asset.id,
          description: asset.description,
        },
        date: result.transactionDate,
        description: result.description,
        type: TransactionType.CapitalCost,
        fee: result.fee,
        value: result.amount,
      };

      let tx: Transaction = new CapitalCostTransaction(txData);

      try {
        if (!this.isFutureDate(result.transactionDate)) {
          if (result.updateCashAssetBalance) {
            result.cashAsset.amount = FloatingMath.fixRoundingError(result.cashAsset.amount - result.amount - result.fee);
            await this.portfolioService.updateAsset(result.cashAsset, account);
          }
          tx = await this.addTransaction(tx);
          this.logger.info('Cost added!');
          if (result.recurringTransaction && tx) {
            await this.addRecurringTransaction(tx, result.recurringTransaction);
          }
        } else {
          if (result.recurringTransaction) {
            await this.addRecurringTransaction(tx, result.recurringTransaction);
          } else {
            await this.scheduleTransaction(tx);
          }
        }
      } catch (err) {
        this.logger.error('Could not add cost transaction!', err);
      }
    }
  }

  /**
   * Deletes a given asset, after user approves the action. If asset is a tradeable asset, and a single position
   * is passed, delete the position instead
   * @param viewAsset asset to delete
   */
  async deleteAsset(viewAsset: ViewAsset) {
    const response = await this.dialogsService.confirm(`Are you sure you want to delete the selected asset?\n` +
      `You should only choose this action if the data for the asset is not accurate. ` +
      `Balances of other related assets will not be updated!`);
    if (response) {
      try {
        if (viewAsset.position) { // tradeable asset
          await this.deletePosition(viewAsset.position, <TradeableAsset>viewAsset.asset, viewAsset.account);
        } else {
          await this.portfolioService.removeAsset(viewAsset.asset, viewAsset.account);
        }
        this.logger.info(`${viewAsset.asset.description || 'asset'} deleted`);
      } catch (err) {
        this.logger.error(`Could not delete ${viewAsset.asset.description || 'asset'}!`, err);
      }
    }
  }

  /**
   * Prompts a user to transfer an asset and executes the transaction. For cash assets, partial amounts can
   * be transferred to another cash asset. For tradeable assets, only part of a single position or the entire
   * position/asset can be transferred.
   * User can mark the transaction as a recurring transaction.
   * @param sourceAsset asset to transfer from
   */
  async transferAsset(sourceAsset: ViewAsset) {
    try {
      const accounts = await this.portfolioService.getAccounts();
      const data: AssetTransferData = {
        accounts: accounts,
        sourceAccount: sourceAsset.account,
        sourceAsset: sourceAsset.asset,
        sourcePosition: sourceAsset.position,
      };
      const result: AssetTransferResponse = await this.dialogsService.showAdaptableScreenModal(AssetTransferComponent, data);

      if (result) {
        let destinationAsset = result.destinationAsset;
        let totalAmount = result.amount;
        let txType: TransactionType;
        // for tradeable assets, total amount means the number of units transferred, so don't add fee
        if (!sourceAsset.asset.isTradeable()) {
          totalAmount = FloatingMath.fixRoundingError(totalAmount + result.fee);
          txType = TransactionType.CashTransfer;
        } else {
          txType = TransactionType.Transfer;
        }

        const txData: TransferTransactionData = {
          asset: {
            accountDescription: sourceAsset.account.description,
            accountId: sourceAsset.account.id,
            id: sourceAsset.asset.id,
            description: sourceAsset.asset.description,
            currency: sourceAsset.asset.currency,
          },
          value: totalAmount,
          date: result.transactionDate,
          description: result.description,
          otherAsset: {
            id: null,
            currency: sourceAsset.asset.currency,
            description: null,
            accountDescription: result.destinationAccount.description,
            accountId: result.destinationAccount.id,
          },
          type: txType,
          fee: result.fee,
        };
        const tx = new TransferTransaction(txData);
        if (!this.isFutureDate(result.transactionDate)) {
          destinationAsset = await this.transfer(sourceAsset.asset, sourceAsset.account, sourceAsset.position,
            result.destinationAsset, result.destinationAccount, result.amount, result.fee);
          this.logger.info('Transfer done!');
          tx.otherAsset.id = destinationAsset.id;
          tx.otherAsset.currency = destinationAsset.currency;
          tx.otherAsset.description = destinationAsset.description;

          await this.addTransaction(tx);
          if (result.recurringTransaction && tx) {
            await this.addRecurringTransaction(tx, result.recurringTransaction);
          }
        } else if (sourceAsset.asset.isTradeable()) {
          throw new UserAppError(`Transaction date for tradeable assets can't be set in the future`);
        } else {
          if (result.recurringTransaction) {
            await this.addRecurringTransaction(tx, result.recurringTransaction);
          } else {
            await this.scheduleTransaction(tx);
          }
        }
      }
    } catch (err) {
      this.logger.error('Could not transfer assets: ' + err, err);
    }
  }

  /**
   * Displays a dialog where user can edit details about a given asset
   * @param viewAsset asset to edit
   */
  async editAsset(viewAsset: ViewAsset) {
    if (viewAsset.asset.type === AssetType.Cash || viewAsset.asset.type === AssetType.Debt) {
      await this.editCashAsset(viewAsset.asset, viewAsset.account);
    } else if (viewAsset.asset.type === AssetType.Deposit) {
      await this.editDeposit(<DepositAsset>viewAsset.asset, viewAsset.account);
    } else if (viewAsset.asset.isTradeable()) {
      await this.editTradeableAsset(viewAsset.position, <TradeableAsset>viewAsset.asset, viewAsset.account);
    } else {
      this.logger.error('Invalid asset type for: ' + viewAsset.asset.description);
    }
  }

  /**
   * Prompts user to add details about a new cash deposit and executes the transaction
   * @param account account to add the new deposit into.
   */
  async addDeposit(account: PortfolioAccount) {
    const cashAssetsCount = account.assets.reduce((acc, asset) => acc + (asset.type === AssetType.Cash ? 1 : 0), 0);
    if (cashAssetsCount === 0) {
      await this.dialogsService.error('There are no cash accounts available as source for the deposit!\nPlease add one first.');
    } else {
      const depositData: DepositAssetData = {
        currency: null,
        creationDate: new Date().toISOString(),
        maturityDate: new Date().toISOString(),
        amount: null,
        autoRenew: false,
        capitalize: false,
        description: null,
        interestRate: 0,
        interestTaxRate: 0,
        type: AssetType.Deposit,
        withholdInterestTax: false,
      };
      const data: DepositEditData = {
        asset: new DepositAsset(depositData),
        account: account
      };
      const result: DepositEditResponse = await this.dialogsService.showAdaptableScreenModal(DepositEditComponent, data);

      if (result) {
        try {
          if (result.debitAccount) {
            if (result.sourceAsset.amount < result.asset.amount) {
              throw new Error('Not enough balance in cash account');
            }
            result.sourceAsset.amount = FloatingMath.fixRoundingError(result.sourceAsset.amount - result.asset.amount);
            try {
              await this.portfolioService.updateAsset(result.sourceAsset, account);
            } catch (err) {
              this.logger.error('Could not update cash balance!', err);
            }
          }

          const newAsset: DepositAsset = <DepositAsset>await this.portfolioService.addAsset(result.asset, account);
          this.logger.info('Deposit created!');
          const txData: TransactionData = {
            asset: {
              accountDescription: account.description,
              accountId: account.id,
              id: newAsset.id,
              description: newAsset.description,
              currency: newAsset.currency,
            },
            value: newAsset.amount,
            date: newAsset.creationDate,
            description: `Fund deposit: ${newAsset.description}`,
            type: TransactionType.DebitCash,
            fee: 0,
          };
          this.addTransaction(new Transaction(txData));
        } catch (err) {
          this.logger.error(`Could not add deposit: ${err}`, err);
        }
      }

    }
  }

  /**
   * Prompts the user to edit details about a given deposit asset
   * @param asset deposit asset to edit
   * @param account account that holds the deposit asset
   */
  async editDeposit(asset: DepositAsset, account: PortfolioAccount): Promise<Asset> {
    try {
      const data: DepositEditData = {
        asset: asset,
        account: account
      };
      const result: DepositEditResponse = await this.dialogsService.showAdaptableScreenModal(DepositEditComponent, data);
      if (result) {
        asset = <DepositAsset>await this.portfolioService.updateAsset(result.asset, account);
        this.logger.info('Deposit edited!');
        return asset;
      }
    } catch (error) {
      this.logger.error(`Could not edit deposit: ${error}`, error);
    }
    return null;
  }

  /**
   * Liquidate a given deposit and optionally credit cash account with deposit amount and interest (if deposit reached maturity)
   * @param deposit deposit to liquidate
   * @param account account that holds the deposit
   */
  async liquidateDeposit(deposit: DepositAsset, account: PortfolioAccount) {

    const cashAssetsCount = account.assets
      .reduce((acc, asset) => acc + ((asset.type === AssetType.Cash && asset.currency === deposit.currency) ? 1 : 0), 0);
    if (cashAssetsCount === 0) {
      const createCashAsset = await this.dialogsService.confirm(`There are no ${deposit.currency} cash accounts available` +
        ` as destination for the deposit amount!\nWould you like to create one now?.`);
      if (createCashAsset) {
        const cashAsset = await this.addCashAsset(account, deposit.currency);
        if (!cashAsset || cashAsset.currency !== deposit.currency) { // account of different currency was created
          return;
        }
      } else {
        return;
      }
    }

    const data: DepositLiquidateData = {
      deposit: deposit,
      account: account,
    };
    const result: DepositLiquidateResponse = await this.dialogsService.showAdaptableScreenModal(DepositLiquidateComponent, data);

    if (result) {
      try {
        result.cashAsset.amount = FloatingMath.fixRoundingError(result.cashAsset.amount + deposit.amount);
        const asset1$ = this.portfolioService.removeAsset(deposit, account);
        const asset2$ = this.portfolioService.updateAsset(result.cashAsset, account);
        await Promise.all([asset1$, asset2$]);
        this.logger.info('Deposit liquidated');
        const txData: TransferTransactionData = {
          asset: {
            accountDescription: account.description,
            accountId: account.id,
            id: deposit.id,
            description: deposit.description,
            currency: deposit.currency,
          },
          value: deposit.amount,
          date: result.transactionDate,
          description: `Liquidated ${deposit.description}`,
          otherAsset: {
            id: result.cashAsset.id,
            currency: result.cashAsset.currency,
            description: result.cashAsset.description,
            accountDescription: account.description,
            accountId: account.id,
          },
          type: TransactionType.Transfer,
          fee: 0,
        };
        const tx = new TransferTransaction(txData);
        this.addTransaction(tx);

        if (result.transactionDate >= deposit.maturityDate && result.creditInterest) {
          const interestAmount = deposit.getPayableInterest();
          const withholdingTax = deposit.getWithholdingTax();
          await this.payInterest(interestAmount, 0, withholdingTax, new Date(result.transactionDate), deposit, result.cashAsset,
            account, true, true);
        }
      } catch (err) {
        this.logger.error('Could not liquidate deposit!', err);
      }
    }
  }

  /**
   * Prompts user to enter details about a buy transaction and executes it, optionally updating cash balance.
   * @param assetType type of tradeable asset
   * @param account account that holds/will hold the asset
   * @param asset optional. If present, adds a new position to the asset instead of creating a new one
   */
  async buyTradeableAsset(assetType: AssetType, account: PortfolioAccount, asset?: TradeableAsset) {
    const cashAssetsCount = account.assets.reduce((acc, curAsset) => acc + (curAsset.type === AssetType.Cash ? 1 : 0), 0);
    if (cashAssetsCount === 0) {
      const createCashAsset = await this.dialogsService.confirm(`There are no cash accounts available to debit for purchase!\n` +
        `Would you like to create one now?.`);
      if (createCashAsset) {
        const cashAsset = await this.addCashAsset(account);
        if (!cashAsset) { // account not created
          return;
        }
      } else {
        return;
      }
    }

    const data: AssetTradeData = {
      account: account,
      assetType: assetType,
      action: AssetTradeAction.BUY,
      asset: asset,
    };
    const response: AssetTradeResponse = await this.dialogsService.showAdaptableScreenModal(AssetTradeComponent, data);
    if (response) {
      try {
        const position: TradePosition = {
          amount: response.amount,
          buyDate: response.transactionDate,
          buyPrice: response.price,
          grossBuyPrice: FloatingMath.fixRoundingError(response.price + (response.fee / response.amount)),
        };

        // try to find if we already have an existing asset with the exact symbol (or description if symbol is missing)
        const normalizedSymbol = response.symbol.trim().toUpperCase();
        if (normalizedSymbol) {
          asset = <TradeableAsset>account.findAssetBySymbol(normalizedSymbol, response.assetType, response.cashAsset.currency);
        } else {
          asset = <TradeableAsset>account.findAssetByDescription(response.description, response.assetType, response.cashAsset.currency);
        }
        let isNewAsset: boolean;
        if (asset) {
          isNewAsset = false;
          asset.addPosition(position);
          asset.updateStats();
        } else {
          isNewAsset = true;
          const assetData: TradeableAssetData = {
            amount: response.amount,
            positions: [position],
            currency: response.cashAsset.currency,
            buyPrice: response.price,
            grossBuyPrice: position.grossBuyPrice,
            currentPrice: response.price,
            symbol: normalizedSymbol,
            type: response.assetType,
            lastQuoteUpdate: null,
            region: null,
            customRegions: [],
            description: null,
            cashAssetId: response.cashAsset.id,
          };
          asset = <TradeableAsset>AssetFactory.newInstance(assetType);
          Object.assign(asset, assetData);
          asset.cashAssetId = response.cashAsset.id;
        }

        this.updateCommonTradeableAssetProperties(asset, response);
        const transactionValue = FloatingMath.fixRoundingError(response.amount * response.price + response.fee);
        if (response.updateCashAssetBalance) {
          if (response.cashAsset.amount < transactionValue) {
            throw new Error('Not enough balance in cash account');
          }
          response.cashAsset.amount = FloatingMath.fixRoundingError(response.cashAsset.amount - transactionValue);
          await this.portfolioService.updateAsset(response.cashAsset, account);
        }
        let newAsset: Asset;
        if (isNewAsset) {
          newAsset = await this.portfolioService.addAsset(asset, account);
        } else {
          newAsset = await this.portfolioService.updateAsset(asset, account);
        }
        this.logger.info('Asset bought!');
        const txData: TradeTransactionData = {
          asset: {
            accountDescription: account.description,
            accountId: account.id,
            id: newAsset.id,
            description: newAsset.description,
            currency: newAsset.currency,
          },
          otherAsset: {
            id: response.cashAsset.id,
            currency: response.cashAsset.currency,
            description: response.cashAsset.description,
            accountDescription: account.description,
            accountId: account.id,
          },
          value: transactionValue,
          date: response.transactionDate,
          description: `Buy ${response.amount} ${response.description} @ ${response.price} ${newAsset.currency}`,
          type: TransactionType.Buy,
          fee: response.fee,
          amount: response.amount,
          rate: response.price,
        };
        const tx = new TradeTransaction(txData);
        this.addTransaction(tx);
      } catch (err) {
        this.logger.error(`Could not buy ${ASSET_TYPE_LABELS[assetType]}`, err);
      }
    }
  }

  /**
   * Prompts user to edit details about a given tradeable asset/position
   * @param position optional, if details about a specific position need to be edited
   * @param asset asset to edit
   * @param account account that holds the asset to edit
   */
  async editTradeableAsset(position: TradePosition, asset: TradeableAsset, account: PortfolioAccount) {
    const data: AssetTradeData = {
      account: account,
      asset: asset,
      assetType: asset.type,
      action: AssetTradeAction.EDIT,
      position: position,
    };
    const response: AssetTradeResponse = await this.dialogsService.showAdaptableScreenModal(AssetTradeComponent, data);
    if (response) {
      try {
        const newSymbol = response.symbol.trim().toUpperCase();
        if (position) {
          position.amount = response.amount;
          position.buyDate = response.transactionDate;
          position.buyPrice = response.price;
        }
        if (asset.currentPrice === asset.buyPrice) {
          // if current price quote was not given, then set current price to edited buy price
          asset.currentPrice = response.price;
        }
        if (asset.symbol !== newSymbol) {
          // allow quote to be refreshed if symbol is changed
          asset.lastQuoteUpdate = null;
        }
        asset.symbol = newSymbol;
        asset.type = response.assetType;
        this.updateCommonTradeableAssetProperties(asset, response);

        await this.portfolioService.updateAsset(asset, account);
        this.logger.info('Asset edited!');
      } catch (err) {
        this.logger.error(`Could not edit asset: ${err}`, err);
      }
    }
  }

  /**
   * Prompts user to enter details about a sell transaction for a given position and executes it, optionally updating cash balance
   * @param position position to sell from
   * @param asset asset that holds the position to sell from
   * @param account account that holds the asset
   */
  async sellTradeableAsset(position: TradePosition, asset: TradeableAsset, account: PortfolioAccount) {
    // ensure we have a matching cash asset
    const cashAssetsCount = account.assets
      .reduce((acc, currAsset) => acc + ((currAsset.type === AssetType.Cash && currAsset.currency === asset.currency) ? 1 : 0), 0);
    if (cashAssetsCount === 0) {
      const createCashAsset = await this.dialogsService.confirm(`There are no ${asset.currency} cash accounts available to credit` +
        ` after sell!\nWould you like to create one now?.`);
      if (createCashAsset) {
        const cashAsset = await this.addCashAsset(account, asset.currency);
        if (!cashAsset || cashAsset.currency !== asset.currency) { // account in required currency not created
          return;
        }
      } else {
        return;
      }
    }

    const data: AssetTradeData = {
      account: account,
      assetType: asset.type,
      asset: asset,
      action: AssetTradeAction.SELL,
      position: position,
    };
    const response: AssetTradeResponse = await this.dialogsService.showAdaptableScreenModal(AssetTradeComponent, data);
    if (response) {
      try {
        const trAsset = <TradeableAsset>asset;
        await this.sell(position, trAsset, account, response.amount, response.price, response.fee,
          response.updateCashAssetBalance, response.cashAsset);
        this.logger.info('Asset sold!');
        const txValue = FloatingMath.fixRoundingError(response.amount * response.price - response.fee);
        const txData: SellTransactionData = {
          asset: {
            accountDescription: account.description,
            accountId: account.id,
            id: asset.id,
            description: asset.description,
            currency: asset.currency,
          },
          otherAsset: {
            id: response.cashAsset.id,
            currency: response.cashAsset.currency,
            description: response.cashAsset.description,
            accountDescription: account.description,
            accountId: account.id,
          },
          value: txValue,
          date: response.transactionDate,
          description: `Sell ${response.amount} ${response.description} @ ${response.price} ${asset.currency}`,
          type: TransactionType.Sell,
          fee: response.fee,
          amount: response.amount,
          rate: response.price,
          buyDate: position.buyDate,
          buyPrice: position.buyPrice,
          grossBuyPrice: position.grossBuyPrice,
          positionId: position.id,
        };
        const tx = new SellTransaction(txData);
        this.addTransaction(tx);
      } catch (e) {
        this.logger.error(`Could not sell ${ASSET_TYPE_LABELS[asset.type]}`, e);
      }
    }
  }

  /**
     * Pay (part of) principal from a bond. If multiple positions are held, setup a transaction for each position
     * to better track capital gains. If all principal is paid, remove the bond asset from account.
     *
     * @param principalPayment the principal to pay
     * @param bond bond to pay principal from
     * @param account bond's account
     * @param txDate the payment date
     */
  async payBondPrincipal(principalPayment: number, bond: BondAsset, cashAsset: Asset, account: PortfolioAccount, txDate: Date,
    addNotification: boolean) {

    const txDescription = 'Principal payment for ' + bond.description;
    const newPrincipal = FloatingMath.fixRoundingError(bond.principalAmount - principalPayment);
    const initialBondPrincipal = bond.principalAmount;
    let paymentMade = false;
    let totalAmount = 0;
    let totalCost = 0;
    let totalGrossCost = 0;
    let totalValue = 0;
    let avgBuyPrice = 0;
    let avgGrossBuyPrice = 0;
    let oldestBuyDate: Date;
    for (const position of bond.positions) {
      const buyDate = new Date(position.buyDate);
      // only consider positions opened before the payment date
      if (DateUtils.compareDates(buyDate, txDate) < 0) {
        paymentMade = true;
        if (!oldestBuyDate || buyDate.getTime() < oldestBuyDate.getTime()) {
          oldestBuyDate = buyDate;
        }
        const paymentValue = principalPayment * position.amount;
        const discount = position.buyPrice / initialBondPrincipal;

        // treat bond redemption as a trade so it can be counted for capital gains
        const buyPrice = principalPayment * discount;
        const grossBuyPrice = principalPayment * (position.grossBuyPrice / initialBondPrincipal);

        totalAmount = totalAmount + position.amount;
        totalValue = FloatingMath.fixRoundingError(totalValue + paymentValue);
        totalCost = totalCost + position.amount * buyPrice;
        totalGrossCost = totalGrossCost + position.amount * grossBuyPrice;

        // update buy price for new principal
        position.buyPrice = newPrincipal * discount;
      }
    }
    if (paymentMade) {
      bond.updateStats(); // buy prices updated
      if (totalAmount > 0) {
        avgBuyPrice = totalCost / totalAmount;
        avgGrossBuyPrice = totalGrossCost / totalAmount;
      }
      const txData: SellTransactionData = {
        asset: {
          accountDescription: account.description,
          accountId: account.id,
          id: bond.id,
          description: bond.description,
          currency: bond.currency,
        },
        otherAsset: {
          id: cashAsset ? cashAsset.id : null,
          currency: bond.currency,
          description: cashAsset ? cashAsset.description : null,
          accountDescription: account.description,
          accountId: account.id,
        },
        date: txDate.toISOString(),
        description: txDescription,
        type: TransactionType.PrincipalPayment,
        fee: 0,
        value: totalValue,
        rate: principalPayment,
        amount: totalAmount,
        buyPrice: avgBuyPrice,
        grossBuyPrice: avgGrossBuyPrice,
        buyDate: oldestBuyDate.toISOString(),
        positionId: null,
      };
      let tx = new SellTransaction(txData);

      // we adjust principal (we do it here because we only pay principal if at least 1 matching position
      // exists)
      bond.principalAmount = newPrincipal;

      if (cashAsset) {
        cashAsset.amount = FloatingMath.fixRoundingError(cashAsset.amount + totalValue);
        await this.portfolioService.updateAsset(cashAsset, account);
        tx = <SellTransaction>await this.addTransaction(tx);
        if (addNotification) {
          this.portfolioService.addTransactionDoneNotification(tx.description, tx.id);
        }
      } else {
        await this.portfolioService.addPendingTransactionNotification('Pending bond principal payment', tx);
      }
    }

    // we update/remove bond regardless if any payment was made
    let bondRemoved = false;
    if (bond.principalAmount <= 0) {
      if (cashAsset) {
        // only remove bond from storage if the transaction is not pending
        await this.portfolioService.removeAsset(bond, account);
        bondRemoved = true;
      }
      // let the caller know that the bond was removed
      bond.pendingDelete = true;
    } else if (bond.principalPaymentSchedule.length > 0) {
      bond.principalPaymentSchedule.splice(0, 1);
    }
    if (!bondRemoved) {
      await this.portfolioService.updateAsset(bond, account);
    }

  }

  /**
   * Remove a specific transaction from storage, after asking confirmation from user
   * @param tx transaction to remove
   */
  async removeTransaction(tx: Transaction) {
    const response = await this.dialogsService.confirm('Are you sure you want to delete the selected transaction?');
    if (response) {
      try {
        await this.portfolioService.removeTransaction(tx);
        this.logger.info('Transaction deleted!');
      } catch (err) {
        this.logger.error(`Could not delete transaction: ${err}`, err);
      }

    }
  }

  /**
   * Display a dialog with details about a given recurring transaction
   * @param tx recurring transaction to show details for
   */
  async viewRecurringTransaction(tx: RecurringTransaction) {
    const response = await this.dialogsService.showModal(RecurringTransactionViewComponent, tx, false);
    if (response === 'edit') {
      return this.editRecurringTransaction(tx);

    }
  }

  /**
   * Prompt the user to edit details about a given recurring transaction
   * @param tx recurring transaction to edit details for
   */
  async editRecurringTransaction(tx: RecurringTransaction) {
    const accounts = await this.portfolioService.getAccounts();
    const data: RecurringTransactionEditData = {
      accounts,
      recTx: tx,
    };
    const responseTx: RecurringTransaction = await this.dialogsService.showAdaptableScreenModal(RecurringTransactionEditComponent, data);
    if (responseTx) {
      try {
        await this.portfolioService.updateRecurringTransaction(responseTx);
        this.logger.info('Transaction details updated!');
        return true;
      } catch (err) {
        this.logger.error(`Could not update transaction: ${err}`, err);
      }

    }
    return false;
  }

  /**
   * Remove a given recurring transaction, after user confirms action.
   * @param tx recurring transaction to remove
   */
  async removeRecurringTransaction(tx: RecurringTransaction) {
    const response = await this.dialogsService.confirm('Are you sure you want to delete the selected transaction?');
    if (response) {
      try {
        await this.portfolioService.removeRecurringTransaction(tx);
        this.logger.info('Transaction deleted!');
      } catch (err) {
        this.logger.error(`Could not delete transaction: ${err}`, err);
      }

    }
  }


  /**
   * Prompts user to enter details about an interest payment transaction and executes it.
   * @param asset asset that pays the interest
   * @param account account that holds the payer asset
   */
  async addInterestPayment(asset: Asset, account: PortfolioAccount) {
    const accountPresent = await this.requireCurrencyCashAsset(asset.currency, account);
    if (!accountPresent) {
      return false;
    }
    const tx = this.createInterestTransaction(null, 0, null, new Date(), asset, account, null);
    const data: InterestTxEditData = {
      account,
      tx,
    };
    const response: InterestTxEditResponse = await this.dialogsService.showAdaptableScreenModal(InterestTransactionEditComponent, data);
    if (response) {
      const cashAsset = account.getAssetById(tx.asset.id);
      await this.payInterest(response.tx.value, response.tx.fee, response.tx.withholdingTax, new Date(response.tx.date),
        asset, cashAsset, account, false, response.creditCashAsset);
    }
  }

  /**
   * Prompts user to add details about a dividend transaction and executes it, optionally updating cash balance.
   * @param asset asset that pays the dividend
   * @param account account that holds the dividend payer asset
   */
  async addDividendPayment(asset: Asset, account: PortfolioAccount) {
    const accountPresent = await this.requireCurrencyCashAsset(asset.currency, account);
    if (!accountPresent) {
      return false;
    }

    const dividendTxData: DividendTransactionData = {
      otherAsset: {
        accountDescription: account.description,
        accountId: account.id,
        id: asset.id,
        description: asset.description,
        currency: asset.currency,
      },
      asset: {
        id: null,
        currency: null,
        description: null,
        accountDescription: account.description,
        accountId: account.id,
      },
      amount: asset.amount,
      date: null,
      description: null,
      fee: null,
      rate: null,
      type: TransactionType.CashDividend,
      value: null,
    };
    const dividendTx = new DividendTransaction(dividendTxData);
    const data: DividendTxEditData = {
      account,
      dividendTx,
    };
    const response: DividendTxEditResponse = await this.dialogsService.showAdaptableScreenModal(DividendTransactionEditComponent,
      data);
    if (response) {
      try {
        if (!this.isFutureDate(response.dividendTx.date)) {
          await this.payDividend(account, dividendTx, response.creditCashAsset);
          if (response.recurringTransaction) {
            await this.addRecurringTransaction(dividendTx, response.recurringTransaction);
          }
        } else {
          if (response.recurringTransaction) {
            await this.addRecurringTransaction(dividendTx, response.recurringTransaction);
          } else {
            await this.scheduleTransaction(dividendTx);
          }
        }
      } catch (err) {
        this.logger.error(`Could not add dividend payment: ${err}`, err);
      }
    }
  }

  /**
   * Merge all positions of an asset into a single one, averaging the buy price
   * @param asset asset who's positions to merge
   * @param account account that holds the affected asset
   */
  async mergeAssetPositions(asset: TradeableAsset, account: PortfolioAccount) {
    const response = await this.dialogsService.confirm(`Are you sure you want to merge all positions into one? The action can't be undone`);
    if (response) {
      try {
        if (asset.positions.length > 1) {
          let grossBuyPrice = 0;
          let amount = 0;
          let value = 0;
          for (const pos of asset.positions) {
            value += pos.amount * pos.grossBuyPrice;
            amount = FloatingMath.fixRoundingError(amount + pos.amount);
          }
          if (amount) {
            grossBuyPrice = value / amount;
          }
          const firstPos = asset.positions[0];
          firstPos.amount = asset.amount;
          firstPos.buyPrice = asset.buyPrice;
          firstPos.grossBuyPrice = grossBuyPrice;
          asset.positions.splice(1);
        }
        await this.portfolioService.updateAsset(asset, account);
        this.logger.info('Positions merged!');
      } catch (err) {
        this.logger.error(`Could not merge positions: ${err}`, err);
      }

    }
  }

  /**
   * Export portfolio assets to a CSV file
   */
  async exportToCSV() {
    const separator = ';';
    const CRLF = '\r\n';
    const rows: PortfolioCSVRow[] = [];
    const HEADER_ROW = ['"Instrument"', '"Type"', '"Symbol"', '"Currency"', '"Region"', '"Account"', '"Amount"',
      '"Unit Buy Price"', '"Fees"', '"Cost"', '"Current Unit Price"', '"Current Value"', '"P/L"'];

    const accounts = await this.portfolioService.getAccounts();
    for (const acc of accounts) {
      for (const asset of acc.assets) {
        const row: PortfolioCSVRow = {
          account: acc.description,
          type: ASSET_TYPE_LABELS[asset.type],
          amount: asset.amount,
          currency: asset.currency,
          instrument: asset.description,
        };
        if (asset.isTradeable()) {
          const trAsset = <TradeableAsset>asset;
          row.region = trAsset.getRegionString();
          row.buyPrice = trAsset.buyPrice;
          row.fees = ((trAsset.grossBuyPrice - trAsset.buyPrice) * trAsset.amount) | 0;
          row.cost = trAsset.buyPrice * trAsset.amount + row.fees;
          row.currentPrice = trAsset.currentPrice;
          row.currentValue = trAsset.getCurrentValue();
          row.symbol = trAsset.symbol;
          row.profitLoss = row.currentValue - row.cost;
        } else {
          row.currentValue = row.amount;
        }
        rows.push(row);
      }
    }
    let csvData = HEADER_ROW.join(separator) + CRLF;
    for (const csvRow of rows) {
      // escape strings
      for (const propId in csvRow) {
        if (typeof csvRow[propId] === 'string') {
          csvRow[propId] = '"' + csvRow[propId].replace(/"/g, '""') + '"';
        }
      }
      const outputArr = [csvRow.instrument, csvRow.type, csvRow.symbol, csvRow.currency, csvRow.region,
      csvRow.account, csvRow.amount, csvRow.buyPrice, csvRow.fees, csvRow.cost, csvRow.currentPrice,
      csvRow.currentValue, csvRow.profitLoss];
      csvData += outputArr.join(separator) + CRLF;
    }
    return csvData;
  }

  /**
   * Executes (or schedules) an interest payment transaction. If destination cash asset is not
   * specified, adds it as a pending transaction, and notifies user.
   * @param tx interest transaction to execute
   * @param addNotification if `true` notifies user that transaction was executed
   */
  private async addInterestTransaction(tx: InterestTransaction, addNotification: boolean) {
    if (!this.isFutureDate(tx.date)) {
      if (tx.asset.id) {
        await this.addTransaction(tx);
        if (addNotification) {
          await this.portfolioService.addTransactionDoneNotification(tx.description, tx.id);
        } else {
          this.logger.info('Interest paid!');
        }
      } else {
        await this.portfolioService.addPendingTransactionNotification(`Pending interest payment`, tx);
      }
    } else {
      await this.scheduleTransaction(tx);
    }
  }

  /**
   * Adds a new transaction to storage, throwing an exception in case of error
   * @param tx transaction to add to storage
   */
  private async addTransaction(tx: Transaction) {
    try {
      return this.portfolioService.addTransaction(tx);
    } catch (err) {
      throw new Error(`Could not log transaction: ${err}`);
    }
  }

  /**
   * Adds a new recurring transaction to storage
   * @param tx transaction that will be made recurring
   * @param recurringTx recurring details
   */
  private async addRecurringTransaction(tx: Transaction, recurringTx: RecurringTransaction) {
    // we need a copy of the transaction object, as we will modify the data
    const txClone = tx.clone();
    // no need for id on transaction template
    delete txClone.id;
    recurringTx.tx = txClone;
    if (!this.isFutureDate(txClone.date)) {
      // transaction already executed so schedule next transaction date
      txClone.date = recurringTx.getNextTransactionDate().toISOString();
    }
    await this.portfolioService.addRecurringTransaction(recurringTx);
    this.logger.info('Transaction scheduled!');
  }

  /**
   * Schedule a transaction at a given date in the future
   * @param tx transaction to schedule
  */
  private async scheduleTransaction(tx: Transaction) {
    const recTxData: RecurringTransactionData = {
      inactive: false,
      autoApprove: true,
      period: 0,
      transactionsLeft: 1,
      tx: tx,
      type: RecurringTransactionType.Never,
    };
    const recTx = new RecurringTransaction(recTxData);
    await this.addRecurringTransaction(tx, recTx);
  }

  /**
   * Checks if a given date is in the future or not
   * @param date date to check
   * @return `true` if date is in the future, `false` otherwise
   */
  private isFutureDate(date: string) {
    return DateUtils.compareDates(new Date(date), new Date()) > 0;
  }

  /**
   * Prompts the user to debit or credit a given cash asset and executes the transaction.
   * User can mark the transaction as a recurring transaction.
   * @param asset asset to change balance for
   * @param account account that holds the asset
   * @param transactionType transaction type (credit or debit)
   */
  private async changeCashAssetBalance(asset: Asset, account: PortfolioAccount, transactionType: TransactionType) {
    const data: CashFundData = {
      asset: asset,
      transactionType: transactionType,
    };
    const result: CashFundResponse = await this.dialogsService.showAdaptableScreenModal(CashFundComponent, data);
    if (result) {
      const sign = (transactionType === TransactionType.CreditCash ? 1 : -1);
      const amount = result.amount * sign;
      let tx = this.prepareCashTransaction(asset, account, amount, result.description, result.transactionDate, result.fee);

      try {
        if (!this.isFutureDate(result.transactionDate)) {
          asset.amount = FloatingMath.fixRoundingError(asset.amount + amount - result.fee);
          await this.portfolioService.updateAsset(asset, account);
          this.logger.info('Account balance updated!');

          tx = await this.addTransaction(tx);
          if (result.recurringTransaction && tx) {
            await this.addRecurringTransaction(tx, result.recurringTransaction);
          }
        } else {
          if (result.recurringTransaction) {
            await this.addRecurringTransaction(tx, result.recurringTransaction);
          } else {
            await this.scheduleTransaction(tx);
          }
        }
      } catch (err) {
        this.logger.error('Could not change account balance!', err);
      }

    }
  }

  /**
   * Exchanges an amount from an asset to another one
   * @param sourceAsset asset to exchange from
   * @param sourceAccount account that holds the source asset
   * @param destinationAsset asset to exchange to
   * @param destinationAccount account that holds the destination asset
   * @param amount amount to exchange
   * @param rate rate of the exchange
   * @param fee fee for the exchange
   */
  private async exchange(sourceAsset: Asset, sourceAccount: PortfolioAccount, destinationAsset: Asset,
    destinationAccount: PortfolioAccount, amount: number, rate: number, fee: number) {
    let totalDebit: number;
    let totalCredit: number;
    let notEnoughBalance: boolean;
    if (amount < 0) {
      // exchanging debt, fee passed to destination
      totalDebit = amount;
      totalCredit = FloatingMath.fixRoundingError((amount - fee) * rate);
      notEnoughBalance = totalDebit < sourceAsset.amount;
    } else {
      // exchanging cash, fee substracted from source
      totalDebit = FloatingMath.fixRoundingError(amount + fee);
      totalCredit = FloatingMath.fixRoundingError(amount * rate);
      notEnoughBalance = sourceAsset.amount < totalDebit;
    }

    if (notEnoughBalance) {
      throw new Error('Not enough balance on source asset');
    }
    sourceAsset.amount = FloatingMath.fixRoundingError(sourceAsset.amount - totalDebit);
    const sourcePromise = this.portfolioService.updateAsset(sourceAsset, sourceAccount);
    destinationAsset.amount = FloatingMath.fixRoundingError(destinationAsset.amount + totalCredit);
    const destPromise = this.portfolioService.updateAsset(destinationAsset, destinationAccount);
    await Promise.all([sourcePromise, destPromise]);
  }

  /**
   * Creates a cash transaction object from given details
   * @param asset cash asset
   * @param account  account that holds the cash asset
   * @param amount transaction amount
   * @param description transaction description
   * @param transactionDate transaction date
   * @param fee transaction fee
   * @param withholdingTax withholding tax amount
   */
  private prepareCashTransaction(asset: Asset, account: PortfolioAccount, amount: number, description: string,
    transactionDate: string, fee?: number, withholdingTax?: number) {

    fee = fee || 0;
    const txValue = FloatingMath.fixRoundingError(amount - fee);
    const txData: TransactionData = {
      asset: {
        accountDescription: account.description,
        accountId: account.id,
        id: asset.id,
        description: asset.description,
        currency: asset.currency,
      },
      value: Math.abs(txValue),
      date: transactionDate,
      description: description,
      type: amount < 0 ? TransactionType.DebitCash : TransactionType.CreditCash,
      fee: fee,
      withholdingTax: withholdingTax,
    };
    const tx = new Transaction(txData);
    return tx;
  }

  /**
   * Adds a new cash transaction using given details
   * @param asset cash asset
   * @param account  account that holds the cash asset
   * @param amount transaction amount
   * @param description transaction description
   * @param transactionDate transaction date
   * @param fee transaction fee
   * @param withholdingTax withholding tax amount
   */
  private addCashTransaction(asset: Asset, account: PortfolioAccount, amount: number, description: string,
    transactionDate: string, fee?: number, withholdingTax?: number) {
    const tx = this.prepareCashTransaction(asset, account, amount, description, transactionDate,
      fee, withholdingTax);
    return this.addTransaction(tx);
  }

  /**
   * Creates an interest transaction object using given details
   * @param payAmount interest amount
   * @param fee transaction fee
   * @param withholdingTax withholding tax amount
   * @param txDate transaction date
   * @param payerAsset asset that pays the interest
   * @param account account that holds the payer asset
   * @param cashAsset cash asset that receives the interest
   */
  private createInterestTransaction(payAmount: number, fee: number, withholdingTax: number, txDate: Date, payerAsset: Asset,
    account: PortfolioAccount, cashAsset: Asset) {
    const txDescription = `Interest paid from ${payerAsset.description}`;
    const txData: InterestTransactionData = {
      asset: {
        accountDescription: account.description,
        accountId: account.id,
        currency: payerAsset.currency,
      },
      otherAsset: {
        accountDescription: account.description,
        accountId: account.id,
        currency: payerAsset.currency,
        id: payerAsset.id,
        description: payerAsset.description,
      },
      date: txDate.toISOString(),
      description: txDescription,
      type: TransactionType.CashInterest,
      fee: fee,
      value: payAmount,
      withholdingTax: withholdingTax,
    };
    if (cashAsset) {
      txData.asset.id = cashAsset.id;
      txData.asset.description = cashAsset.description;
    }

    const tx = new InterestTransaction(txData);
    return tx;
  }


  /**
   * Deletes a given position from a tradeable asset.
   * @param position trade position to delete
   * @param asset asset that holds the position
   * @param account account that holds the asset
   */
  private async deletePosition(position: TradePosition, asset: TradeableAsset, account: PortfolioAccount) {
    if (asset.positions.length === 1) {
      await this.portfolioService.removeAsset(asset, account);
    } else {
      const posIdx = asset.positions.indexOf(position);
      asset.positions.splice(posIdx, 1);
      await this.portfolioService.updateAsset(asset, account);
    }
  }


  /**
   * Get the historical total returns for a given asset (count realized gains and dividends)
   * @param asset asset to get stats for
   */
  private async getTotalReturnStats(asset: TradeableAsset) {
    const stats: TotalReturnStats = {
      dividends: 0,
      capitalCosts: 0,
      realizedGaines: 0,
      totalCost: 0,
      totalReturn: 0,
    };
    stats.totalReturn = asset.currentPrice * asset.amount;
    // we need to iterate through all transactions to find realized gains.
    const transactions = await this.portfolioService.getTransactions();
    for (const tx of transactions) {
      if (tx.asset.id === asset.id || (tx.isTwoWayTransaction() && (<TwoWayTransaction>tx).otherAsset.id === asset.id)) {
        if (tx.isDividend() || tx.isInterestPayment()) {
          stats.dividends += tx.value;
          stats.totalReturn += tx.value;
        } else if (tx.isCapitalCost()) {
          stats.capitalCosts += tx.value;
          stats.totalReturn -= tx.value;
        } else if (tx.isBuyTrade()) {
          stats.totalCost += tx.value;
        } else if (tx.isSellTrade()) {
          const sellTx = <SellTransaction>tx;
          stats.totalReturn += tx.value;
          stats.realizedGaines += sellTx.rate * sellTx.amount - sellTx.buyPrice * sellTx.amount;
        }
      }
    }
    if (stats.totalCost === 0) {
      // no buy transaction was recorded
      stats.totalCost = asset.buyPrice * asset.amount;
    }
    return stats;
  }

  /**
   * Ensures that an account has a cash asset for a specific currency, prompting the user to add one, if there is none.
   * @param requiredCurrency the required currency
   * @param account account that needs to have the cash asset in required currency
   */
  private async requireCurrencyCashAsset(requiredCurrency: string, account: PortfolioAccount) {
    const cashAssetsCount = account.assets
      .reduce((acc, currAsset) => acc + (currAsset.type === AssetType.Cash && currAsset.currency === requiredCurrency ? 1 : 0), 0);
    if (cashAssetsCount === 0) {
      const createCashAsset = await this.dialogsService.confirm(`There are no ${requiredCurrency} cash accounts available as ` +
        `destination for funds!\nWould you like to create one now?.`);
      if (createCashAsset) {
        const cashAsset = await this.addCashAsset(account);
        if (!cashAsset || cashAsset.currency !== requiredCurrency) { // account of different currency was created
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Executes a dividend/rent payment transaction, optionally crediting cash asset
   * @param account account that holds the payer asset
   * @param dividendTx dividend transaction to execute
   * @param creditCashAsset if `true` credits the cash asset with the dividend amount
   */
  private async payDividend(account: PortfolioAccount, dividendTx: DividendTransaction, creditCashAsset: boolean) {
    try {
      if (creditCashAsset) {
        const cashAsset = account.getAssetById(dividendTx.asset.id);
        cashAsset.amount = FloatingMath.fixRoundingError(cashAsset.amount + dividendTx.value);
        await this.portfolioService.updateAsset(cashAsset, account);
      }
      const asset = account.getAssetById(dividendTx.payerAsset.id);
      let paymentTypeStr = 'Dividend';
      if (asset) {
        if (asset.type === AssetType.RealEstate) {
          paymentTypeStr = 'Rent';
        }
      }
      await this.portfolioService.addTransaction(dividendTx);
      this.logger.info(`${paymentTypeStr} paid!`);
      return true;
    } catch (err) {
      this.logger.error(`Could not add transaction: ${err}`, err);
    }
    return false;
  }

  /**
   * Transfer a given amount of units from one asset to another. If a destination asset is not given, a new asset is created and
   * credited with the given amount.
   * If the transferred asset is tradeable, allow transferring only the entire amount if no position is given.
   * @param sourceAsset asset to transfer from
   * @param sourceAccount account that holds the source asset
   * @param position specific position to transfer from (for tradeable assets only)
   * @param destinationAsset asset to transfer to. Required for cash transfers only.
   * @param destinationAccount account that holds the destination asset
   * @param amount amount to transfer
   * @param fee transfer fee
   * @return Promise that resolves with the (new) destination asset
   */
  private async transfer(sourceAsset: Asset, sourceAccount: PortfolioAccount, position: TradePosition, destinationAsset: Asset,
    destinationAccount: PortfolioAccount, amount: number, fee: number): Promise<Asset> {
    let creditAmount = amount;
    let debitAmount = amount;
    if (debitAmount < 0 && !sourceAsset.isDebt()) {
      throw new Error(`Transfer amount can't be negative`);
    }
    if (sourceAsset.isCashOrDebt()) {
      if (debitAmount > 0) {
        debitAmount = FloatingMath.fixRoundingError(debitAmount + fee);
      } else {
        // transferring debt, pass fee to destination
        creditAmount = FloatingMath.fixRoundingError(amount - fee);
      }
    }
    if (position) {
      // we are transferring a position of a tradeable asset
      if (position.amount < debitAmount) {
        throw new Error('Transfer amount exceeds position balance');
      }
      position.amount = FloatingMath.fixRoundingError(position.amount - debitAmount);
      if (FloatingMath.equal(position.amount, 0)) {
        const trAsset = <TradeableAsset>sourceAsset;
        const posIdx = trAsset.positions.indexOf(position);
        trAsset.positions.splice(posIdx, 1);
      }
      sourceAsset.updateStats();
    } else {
      if (sourceAsset.isTradeable() && sourceAsset.amount !== debitAmount) {
        throw new Error('Transfer can only be made on part of a position or the entire asset');
      }
      if ((debitAmount < 0 && sourceAsset.amount > debitAmount) ||
        (debitAmount > 0 && sourceAsset.amount < debitAmount)) {
        throw new Error('Transfer amount exceeds balance');
      }
      sourceAsset.amount = FloatingMath.fixRoundingError(sourceAsset.amount - debitAmount);
    }
    let asset1$: Promise<any>;
    if (sourceAsset.amount === 0 && !sourceAsset.isCashOrDebt()) {
      // if asset is empty and is not a cash/debt asset, remove it
      asset1$ = this.portfolioService.removeAsset(sourceAsset, sourceAccount);
    } else {
      asset1$ = this.portfolioService.updateAsset(sourceAsset, sourceAccount);
    }

    let asset2$: Promise<Asset>;
    if (destinationAsset && destinationAsset.isCashOrDebt()) {
      destinationAsset.amount = FloatingMath.fixRoundingError(destinationAsset.amount + creditAmount);
      asset2$ = this.portfolioService.updateAsset(destinationAsset, destinationAccount);
    } else {
      let newPosition: TradePosition;
      let trDestAsset: TradeableAsset;
      let trSourceAsset: TradeableAsset;
      if (sourceAsset.isTradeable()) {
        // check if we already have positions of this asset on destination
        trSourceAsset = <TradeableAsset>sourceAsset;
        if (trSourceAsset.symbol) {
          trDestAsset = <TradeableAsset>destinationAccount.findAssetBySymbol(trSourceAsset.symbol, trSourceAsset.type,
            trSourceAsset.currency);
        } else {
          trDestAsset = <TradeableAsset>destinationAccount.findAssetByDescription(trSourceAsset.description, trSourceAsset.type,
            trSourceAsset.currency);
        }
      }

      if (position) {
        // transferring from one position only
        newPosition = {
          amount: amount,
          buyDate: position.buyDate,
          buyPrice: position.buyPrice,
          grossBuyPrice: position.grossBuyPrice,
        };
        if (trDestAsset) {
          trDestAsset.addPosition(newPosition);
        }
      } else if (trDestAsset) {
        // we are transferring all positions of the asset into an existing destination asset
        for (const pos of trSourceAsset.positions) {
          trDestAsset.addPosition(pos);
        }
      }
      if (!trDestAsset) {
        // create new asset on destination
        destinationAsset = sourceAsset.clone();
        if (destinationAsset.isTradeable()) {
          trDestAsset = <TradeableAsset>destinationAsset;
          if (newPosition) {
            // we are transferring one position only
            trDestAsset.positions = [newPosition];
          } else {
            // all positions are transferred. No need to do anything, as positions are already copied
          }
          trDestAsset.updateStats();
        } else {
          destinationAsset.amount = creditAmount;
        }
        destinationAsset.id = null;
        asset2$ = this.portfolioService.addAsset(destinationAsset, destinationAccount);
      } else {
        asset2$ = this.portfolioService.updateAsset(trDestAsset, destinationAccount);
      }
    }

    const responses = await Promise.all([asset1$, asset2$]);

    return responses[1]; // return destination asset;
  }


  /**
   * Sell (part of) a tradeable asset position.
   * @param position position to sell from
   * @param asset asset that holds the position
   * @param account account that holds the asset
   * @param amount amount to sell
   * @param price price to sell 1 unit
   * @param fee selling fee
   * @param updateCashAssetBalance if `true` credits cash balance with amount from sell
   * @param cashAsset cash asset to credit
   */
  private async sell(position: TradePosition, asset: TradeableAsset, account: PortfolioAccount, amount: number, price: number, fee: number,
    updateCashAssetBalance: boolean, cashAsset: Asset) {

    if (position.amount < amount) {
      throw new Error('Amount to sell exceeds position amount');
    }
    position.amount = FloatingMath.fixRoundingError(position.amount - amount);
    if (FloatingMath.equal(position.amount, 0)) {
      this.deletePosition(position, asset, account);
    } else {
      await this.portfolioService.updateAsset(asset, account);
    }
    if (updateCashAssetBalance) {
      const transactionValue = amount * price - fee;
      cashAsset.amount = FloatingMath.fixRoundingError(cashAsset.amount + transactionValue);
      await this.portfolioService.updateAsset(cashAsset, account);
    }
  }

  /**
   * Updates properties that are common for all tradeable asset types from user provided data.
   * @param asset asset to update
   * @param response updated user provided asset data
   */
  private async updateCommonTradeableAssetProperties(asset: TradeableAsset, response: AssetTradeResponse) {
    asset.description = response.description;
    asset.region = response.region || AssetRegion.Unspecified;
    if (asset.type === AssetType.Bond) {
      const bond = <BondAsset>asset;
      bond.maturityDate = response.maturityDate;
      bond.principalAmount = response.principalAmount;
      bond.couponRate = response.couponRate;
      bond.interestPaymentSchedule = response.interestPaymentSchedule;
      bond.principalPaymentSchedule = response.principalPaymentSchedule;
      bond.previousInterestPaymentDate = response.previousInterestPaymentDate;
      bond.interestTaxRate = response.interestTaxRate;
      bond.withholdInterestTax = response.withholdInterestTax;
    }
  }
}
