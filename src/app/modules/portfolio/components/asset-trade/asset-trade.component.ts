import { Component, OnInit, Inject, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { UntypedFormGroup, UntypedFormControl, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { startWith, map, takeUntil } from 'rxjs/operators';
import {
  AssetType, Asset, ASSET_TYPE_LABELS
} from '../../models/asset';
import { PortfolioAccount } from '../../models/portfolio-account';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { APP_CONSTS, ExchangeDetails, SymbolDetails } from 'src/app/config/app.constants';
import { TradePosition, TradeableAsset } from '../../models/tradeable-asset';
import { BondAsset, BondInterestPaymentEvent, BondPrincipalPaymentEvent } from '../../models/bond-asset';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { RecurringTransactionType } from '../../models/recurring-transaction';
import {
  PaymentDateAddComponent, PaymentDateAddData, PaymentDateAddResponse, PaymentAmountType
} from '../payment-date-add/payment-date-add.component';
import { AssetRegion, ASSET_REGION_LABELS } from '../../models/asset-region';
import { AssetOperationAction, AssetOperationData } from '../../models/asset-operation-data';




/**
 * Data passed to the `AssetTradeComponent` dialog
 */
export interface AssetTradeUserInputData {
  account: PortfolioAccount;
  assetType: AssetType;
  action: AssetOperationAction;
  position?: TradePosition;
  asset?: TradeableAsset;
}


// TODO: add support for custom asset regions

/**
 * Validates if transaction value is positive and does not exceed the cash asset balance
 * @param priceCtrl price FormControl
 * @param feeCtrl fee FormControl
 * @param cashAssetCtrl cashAsset FormControl
 */
const transactionValueValidator = (priceCtrl: UntypedFormControl, feeCtrl: UntypedFormControl, cashAssetCtrl: UntypedFormControl) => {
  return (control: UntypedFormControl): ValidationErrors | null => {
    const amount: number = control.value;
    const fee = feeCtrl.value;
    const price = priceCtrl.value;
    const value = amount * price + fee;
    return cashAssetCtrl.value && (value <= 0 || value > (<Asset>cashAssetCtrl.value).amount) ? { 'invalidTransaction': true } : null;
  };
};


/**
 * Component that provides a UI to buy, sell or edit an asset
 */
@Component({
  selector: 'app-asset-trade',
  templateUrl: './asset-trade.component.html',
  styleUrls: ['./asset-trade.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetTradeComponent implements OnInit, OnDestroy, AfterViewInit {

  amount: UntypedFormControl;
  assetCurrency: string;
  assetForm: UntypedFormGroup;
  assetLabel: string;
  bondLikeAsset: boolean;
  cashAsset: UntypedFormControl;
  currentPrice: UntypedFormControl;
  description: UntypedFormControl;
  couponRate: UntypedFormControl;
  cashAssets: Asset[];
  exchange: UntypedFormControl;
  exchangeTradedAsset: boolean;
  fee: UntypedFormControl;
  filteredSupportedExchanges: Observable<ExchangeDetails[]>;
  filteredSuggestedSymbols: Observable<SymbolDetails[]>;
  hasAmount: boolean;
  isMutualFund: boolean;
  interestPaymentSchedule: BondInterestPaymentEvent[] = [];
  interestTaxRate: UntypedFormControl;
  maturityDate: UntypedFormControl;
  previousInterestPaymentDate: UntypedFormControl;
  price: UntypedFormControl;
  principalAmount: UntypedFormControl;
  principalPaymentSchedule: BondPrincipalPaymentEvent[] = [];
  region: UntypedFormControl;
  singleTabEdit: boolean;
  stockLikeAsset: boolean;
  stockType: UntypedFormControl;
  symbol: UntypedFormControl;
  supportedExchanges: ExchangeDetails[];
  suggestedSymbols: SymbolDetails[];
  todayDate: Date;
  transactionDate: UntypedFormControl;
  updateCashAssetBalance: UntypedFormControl;
  withholdInterestTax: UntypedFormControl;


  readonly AssetTradeAction = AssetOperationAction;
  readonly AssetType = AssetType;
  readonly AssetRegion = AssetRegion;
  readonly RecurringTransactionType = RecurringTransactionType;
  readonly ASSET_REGION_LABELS = ASSET_REGION_LABELS;

  private readonly componentDestroyed$ = new Subject();


  constructor(public dialogRef: MatDialogRef<AssetTradeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetTradeUserInputData, public dialogs: DialogsService, private cdr: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.hasAmount = this.data.assetType !== AssetType.P2P && this.data.assetType !== AssetType.RealEstate;
    let defaultAmount: number;
    if (this.hasAmount) {
      defaultAmount = null;
    } else {
      defaultAmount = 1;
    }
    this.bondLikeAsset = this.data.assetType === AssetType.Bond || this.data.assetType === AssetType.P2P;
    this.exchangeTradedAsset = this.data.assetType !== AssetType.RealEstate && this.data.assetType !== AssetType.P2P &&
      this.data.assetType !== AssetType.Forex;
    this.singleTabEdit = !this.bondLikeAsset || this.data.action === AssetOperationAction.SELL;
    this.stockLikeAsset = Asset.isStockLike(this.data.assetType);

    if (this.stockLikeAsset || this.data.assetType === AssetType.Bond) {
      this.supportedExchanges = APP_CONSTS.SUPPORTED_EXCHANGES.EQUITY;
      this.suggestedSymbols = APP_CONSTS.SUGGESTED_SYMBOLS.EQUITY;
    } else if (this.data.assetType === AssetType.Commodity) {
      this.supportedExchanges = APP_CONSTS.SUPPORTED_EXCHANGES.COMMODITY;
      this.suggestedSymbols = APP_CONSTS.SUGGESTED_SYMBOLS.COMMODITY;
    } else if (this.data.assetType === AssetType.Cryptocurrency) {
      this.supportedExchanges = APP_CONSTS.SUPPORTED_EXCHANGES.CRYPTO;
      this.suggestedSymbols = APP_CONSTS.SUGGESTED_SYMBOLS.CRYPTO;
    } else {
      this.supportedExchanges = [];
      this.suggestedSymbols = [];
    }
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.assetLabel = ASSET_TYPE_LABELS[this.data.assetType];
    this.cashAssets = this.data.account.assets
      .filter(asset => asset.type === AssetType.Cash && (!this.data.asset || asset.currency === this.data.asset.currency));
    let defaultCashAsset = null;
    if (this.data.asset) {
      this.assetCurrency = this.data.asset.currency;
      defaultCashAsset = this.data.account.getAssetById(this.data.asset.cashAssetId);
    }

    this.cashAsset = new UntypedFormControl(defaultCashAsset);
    this.symbol = new UntypedFormControl();
    this.description = new UntypedFormControl();
    this.region = new UntypedFormControl();
    this.price = new UntypedFormControl(1, [Validators.min(0)]);
    this.currentPrice = new UntypedFormControl(null, [Validators.min(0)]);
    this.principalAmount = new UntypedFormControl(null, [Validators.min(0)]);
    this.maturityDate = new UntypedFormControl();
    this.couponRate = new UntypedFormControl(0);
    this.previousInterestPaymentDate = new UntypedFormControl();
    this.withholdInterestTax = new UntypedFormControl();
    this.interestTaxRate = new UntypedFormControl();
    this.fee = new UntypedFormControl(0);
    this.transactionDate = new UntypedFormControl(new Date());
    this.amount = new UntypedFormControl(defaultAmount);
    this.updateCashAssetBalance = new UntypedFormControl(this.data.assetType !== AssetType.Forex);
    this.exchange = new UntypedFormControl();
    this.stockType = new UntypedFormControl();
    this.stockType.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe((value) => {
      this.isMutualFund = TradeableAsset.isMutualFund(value);
    });
    this.filteredSupportedExchanges = this.exchange.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterSupportedExchanges(value))
      );
    this.filteredSuggestedSymbols = this.symbol.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterSuggestedSymbols(value))
      );

    this.updateAmountValidators();
    this.price.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity());
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity());
    this.cashAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        if (this.cashAsset.value) {
          this.assetCurrency = this.cashAsset.value.currency;
        }
        this.amount.updateValueAndValidity();
      });
    if (this.data.asset) {
      if (this.data.assetType !== AssetType.RealEstate) {
        const symbolParts = this.data.asset.parseSymbol();
        this.exchange.setValue(symbolParts.marketCode);
        this.symbol.setValue(symbolParts.shortSymbol);
      } else {
        this.symbol.setValue(this.data.asset.symbol);
      }
      if (this.data.action === AssetOperationAction.EDIT) {
        this.currentPrice.setValue(this.data.asset.currentPrice);
      }
      this.description.setValue(this.data.asset.description);
      this.region.setValue(this.data.asset.region);
      if (this.data.position) {
        this.amount.setValue(this.data.position.amount);
        this.price.setValue(this.data.position.buyPrice);
        const totalFees = FloatingMath.fixRoundingError((this.data.position.grossBuyPrice -
          this.data.position.buyPrice) * this.data.position.amount);
        this.fee.setValue(totalFees);
        if (this.data.action === AssetOperationAction.EDIT) {
          this.transactionDate.setValue(this.data.position.buyDate);
        }
      }
      if (this.bondLikeAsset) {
        const bond = <BondAsset>this.data.asset;
        this.principalAmount.setValue(bond.principalAmount);
        this.couponRate.setValue(FloatingMath.fixRoundingError(bond.couponRate * 100));
        this.maturityDate.setValue(bond.maturityDate);
        this.previousInterestPaymentDate.setValue(bond.previousInterestPaymentDate);
        this.interestTaxRate.setValue(FloatingMath.fixRoundingError(bond.interestTaxRate * 100));
        this.withholdInterestTax.setValue(bond.withholdInterestTax);
        this.interestPaymentSchedule = [...bond.interestPaymentSchedule];
        this.principalPaymentSchedule = [...bond.principalPaymentSchedule];
      } else if (this.data.asset.isStockLike()) {
        this.stockType.setValue(this.data.asset.type);
      }
    }

    this.assetForm = new UntypedFormGroup({
      cashAsset: this.cashAsset,
      symbol: this.symbol,
      description: this.description,
      region: this.region,
      amount: this.amount,
      price: this.price,
      currentPrice: this.currentPrice,
      fee: this.fee,
      transactionDate: this.transactionDate,
      updateCashAssetBalance: this.updateCashAssetBalance,
      exchange: this.exchange,
      stockType: this.stockType,

    });

    if (this.bondLikeAsset) {
      this.assetForm.addControl('couponRate', this.couponRate);
      this.assetForm.addControl('maturityDate', this.maturityDate);
      this.assetForm.addControl('principalAmount', this.principalAmount);
      this.assetForm.addControl('previousInterestPaymentDate', this.previousInterestPaymentDate);
      this.assetForm.addControl('interestTaxRate', this.interestTaxRate);
      this.assetForm.addControl('withholdInterestTax', this.withholdInterestTax);
    }
  }

  ngAfterViewInit() {
    // if form is valid and we are not editing the asset, mark it as dirty to enable Save button
    if (this.data.action !== AssetOperationAction.EDIT && this.assetForm.valid) {
      this.assetForm.markAsDirty();
    }
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  /**
   * Triggered when user clicks "Automatically debit/credit cash account balance" checkbox
   */
  updateCashAssetBalanceToggled() {
    this.updateAmountValidators();
    this.amount.updateValueAndValidity();
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const totalPaymentsAmount = this.principalPaymentSchedule.reduce((acc, curValue) => acc + curValue.amount, 0);
      if (this.principalAmount.value && totalPaymentsAmount > this.principalAmount.value) {
        this.dialogs.error('The sum of principal payments exceed the principal value!');
        return;
      }
      const interestPayment = this.interestPaymentSchedule.find(
        (payment) => DateUtils.compareDates(new Date(payment.paymentDate), new Date(this.maturityDate.value)) > 0);
      if (interestPayment) {
        this.dialogs.error('At least 1 interest payment date is greater than maturity date!');
        return;
      }
      if (this.interestPaymentSchedule.length > 0 && !this.previousInterestPaymentDate.value) {
        this.dialogs.error('The date of previous interest payment is required in order to calculate days passed between payments, ' +
          'if interest payments are added!');
        return;
      }
      const principalPayment = this.principalPaymentSchedule.find(
        (payment) => DateUtils.compareDates(new Date(payment.date), new Date(this.maturityDate.value)) > 0);
      if (principalPayment) {
        this.dialogs.error('At least 1 principal payment date is greater than maturity date!');
        return;
      }

      let fullSymbol = this.symbol.value || '';
      if (this.exchange.value) {
        fullSymbol = this.exchange.value.toUpperCase() + ':' + fullSymbol;
      }
      if (Asset.isStockLike(this.data.assetType)) {
        this.data.assetType = this.stockType.value;
      }
      const data: AssetOperationData = {
        action: this.data.action,
        amount: this.amount.value,
        price: this.price.value,
        currentPrice: this.currentPrice.value,
        cashAsset: this.cashAsset.value,
        couponRate: this.couponRate.value / 100,
        description: this.description.value,
        fee: this.fee.value,
        maturityDate: getDateAsISOString(this.maturityDate.value),
        principalAmount: this.principalAmount.value,
        region: this.region.value,
        symbol: fullSymbol,
        transactionDate: getDateAsISOString(this.transactionDate.value),
        updateCashAssetBalance: this.updateCashAssetBalance.value,
        assetType: this.data.assetType,
        interestPaymentSchedule: this.interestPaymentSchedule,
        interestTaxRate: (this.interestTaxRate.value || 0) / 100,
        principalPaymentSchedule: this.principalPaymentSchedule,
        previousInterestPaymentDate: getDateAsISOString(this.previousInterestPaymentDate.value),
        withholdInterestTax: this.withholdInterestTax.value || false,
      };
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close(null);
    }
  }

  /**
   * Filter only exchanges that match the user's input text
   * @param value user input text
   */
  private filterSupportedExchanges(value: string): ExchangeDetails[] {
    const filterValue = value.toLowerCase();

    return this.supportedExchanges
      .filter(exchange => exchange.name.toLowerCase().includes(filterValue) || exchange.code.toLowerCase().includes(filterValue));
  }

  /**
   * Filter only symbols that match the user's input text
   * @param value user input text
   */
  private filterSuggestedSymbols(value: string): ExchangeDetails[] {
    const filterValue = value.toLowerCase();

    return this.suggestedSymbols
      .filter(symbol => symbol.name.toLowerCase().includes(filterValue) || symbol.code.toLowerCase().includes(filterValue));
  }

  /**
   * Set amount field validators depending on action being done (buy/sell/edit)
   */
  private updateAmountValidators() {
    if (this.data.action === AssetOperationAction.BUY) {
      const validators = [Validators.min(Number.EPSILON)];
      if (this.updateCashAssetBalance.value) {
        validators.push(transactionValueValidator(this.price, this.fee, this.cashAsset));
      }
      this.amount.setValidators(validators);
    } else if (this.data.action === AssetOperationAction.SELL) {
      this.amount.setValidators([Validators.min(Number.EPSILON), Validators.max(this.data.position.amount)]);
    } else {
      this.amount.setValidators([Validators.min(Number.EPSILON)]);
    }

  }

  async addInterestPayment() {
    if (!this.maturityDate.value) {
      this.dialogs.error('Please set bond maturity date first!');
      return;
    }

    const data: PaymentDateAddData = {
      maturityDate: new Date(this.maturityDate.value),
      amountType: PaymentAmountType.Percentage,
      amountCaption: 'Coupon rate',
      defaultAmount: this.couponRate.value,
    };
    const response: PaymentDateAddResponse = await this.dialogs.showModal(PaymentDateAddComponent, data);


    if (response) {
      const rate = (response.amount === this.couponRate.value) ? null : response.amount / 100;
      for (const paymentDate of response.dates) {
        const payment: BondInterestPaymentEvent = {
          couponRate: rate,
          paymentDate: getDateAsISOString(paymentDate),
        };
        this.interestPaymentSchedule.push(payment);
      }
      this.interestPaymentSchedule.sort((a, b) => a.paymentDate < b.paymentDate ? -1 : 1);
      this.assetForm.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  async addPrincipalPayment() {
    if (!this.maturityDate.value) {
      this.dialogs.error('Please set bond maturity date first!');
      return;
    }

    const data: PaymentDateAddData = {
      maturityDate: new Date(this.maturityDate.value),
      amountType: PaymentAmountType.Currency,
      currency: this.assetCurrency,
      amountCaption: 'Payment amount',
      defaultAmount: null,
    };
    const response: PaymentDateAddResponse = await this.dialogs.showModal(PaymentDateAddComponent, data);

    if (response) {
      for (const paymentDate of response.dates) {
        const payment: BondPrincipalPaymentEvent = {
          amount: response.amount,
          date: getDateAsISOString(paymentDate),
        };
        this.principalPaymentSchedule.push(payment);
      }
      this.principalPaymentSchedule.sort((a, b) => a.date < b.date ? -1 : 1);
      this.assetForm.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  checkAllPayments(list: MatSelectionList) {
    const notSelected = list.selectedOptions.selected.length !== list.options.length;
    if (notSelected) {
      list.selectAll();
    } else {
      list.deselectAll();
    }
  }

  deleteInterestPayments(list: MatSelectionList) {
    const elements = list.options.toArray();
    let listChanged = false;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i].selected) {
        this.interestPaymentSchedule.splice(i, 1);
        listChanged = true;
      }
    }
    if (listChanged) {
      this.assetForm.markAsDirty();
      this.cdr.markForCheck();
    }

  }

  deletePrincipalPayments(list: MatSelectionList) {
    const elements = list.options.toArray();
    let listChanged = false;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i].selected) {
        this.principalPaymentSchedule.splice(i, 1);
        listChanged = true;
      }
    }
    if (listChanged) {
      this.assetForm.markAsDirty();
      this.cdr.markForCheck();
    }
  }

}
