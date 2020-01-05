import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { DividendTransaction } from '../../models/dividend-transaction';
import { TitleCasePipe } from '@angular/common';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { RecurringTransaction } from '../../models/recurring-transaction';

export interface DividendTxEditData {
  dividendTx: DividendTransaction;
  account: PortfolioAccount;
}

export interface DividendTxEditResponse {
  dividendTx: DividendTransaction;
  creditCashAsset: boolean;
  recurringTransaction: RecurringTransaction;
}

/**
 * Validates if an input is a valid integer
 * @param control form control that needs to be validated
 */
const integerValidator = (control: FormControl): ValidationErrors | null => {
  return !Number.isInteger(control.value) ? { 'invalidInt': true } : null;
};

/**
 * Component to display a UI for editing data for a dividend transaction
 */
@Component({
  selector: 'app-dividend-transaction-edit',
  templateUrl: './dividend-transaction-edit.component.html',
  styleUrls: ['./dividend-transaction-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DividendTransactionEditComponent implements OnInit {

  dividendTx: DividendTransaction;
  asset: Asset;
  account: PortfolioAccount;
  assetCurrency: string;
  assetForm: FormGroup;
  amount: FormControl;
  cashAssets: Asset[];
  cashAsset: FormControl;
  dividend: FormControl;
  enableRecurringTransaction: FormControl;
  fee: FormControl;
  isScheduledTx = false;
  taxRate: FormControl;
  transactionDate: FormControl;
  todayDate: Date;
  updateCashAssetBalance: FormControl;
  withholdTax: FormControl;
  paymentTypeStr = 'dividend';
  isRentable: boolean;

  @ViewChild('recurringTransaction', { static: false }) private readonly recurringTransaction: RecurringTransactionInputComponent;

  constructor(public dialogRef: MatDialogRef<DividendTransactionEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DividendTxEditData) { }

  ngOnInit() {
    let defaultCashAsset = null;
    if (this.data.dividendTx.asset.id) {
      defaultCashAsset = this.data.account.getAssetById(this.data.dividendTx.asset.id);
    }

    this.account = this.data.account;
    this.dividendTx = this.data.dividendTx;
    this.cashAsset = new FormControl(defaultCashAsset);
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.amount = new FormControl(null, [Validators.min(1), integerValidator]);
    this.dividend = new FormControl(this.dividendTx.rate, [Validators.min(0)]);
    this.enableRecurringTransaction = new FormControl();
    this.fee = new FormControl(this.dividendTx.fee || 0, [Validators.min(0)]);
    let txDate: Date;
    if (this.dividendTx.date) {
      txDate = new Date(this.dividendTx.date);
    } else {
      txDate = new Date();
    }
    this.assetCurrency = this.dividendTx.payerAsset.currency;
    this.transactionDate = new FormControl(txDate);
    this.withholdTax = new FormControl(this.dividendTx.withholdingTax > 0);
    let calculatedTaxRate = 0;
    if (this.dividendTx.amount && this.dividendTx.rate) {
      calculatedTaxRate = this.dividendTx.withholdingTax / (this.dividendTx.amount * this.dividendTx.rate);
    }
    this.taxRate = new FormControl(FloatingMath.fixRoundingError(calculatedTaxRate * 100), [Validators.min(0), Validators.max(100)]);
    this.updateCashAssetBalance = new FormControl(true);
    this.assetForm = new FormGroup({
      amount: this.amount,
      cashAsset: this.cashAsset,
      dividend: this.dividend,
      enableRecurringTransaction: this.enableRecurringTransaction,
      fee: this.fee,
      taxRate: this.taxRate,
      transactionDate: this.transactionDate,
      withholdTax: this.withholdTax,
      updateCashAssetBalance: this.updateCashAssetBalance,
    });

    this.loadData();
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      this.dividendTx.amount = this.amount.value || 0;
      const cashAsset: Asset = this.cashAsset.value;
      this.dividendTx.asset.id = cashAsset.id;
      this.dividendTx.asset.currency = cashAsset.currency;
      this.dividendTx.asset.description = cashAsset.description;
      this.dividendTx.date = getDateAsISOString(this.transactionDate.value);
      const paymentTypeStr = new TitleCasePipe().transform(this.paymentTypeStr);
      this.dividendTx.description = `${paymentTypeStr} from ${this.asset.description}`;
      this.dividendTx.fee = this.fee.value || 0;
      this.dividendTx.rate = this.dividend.value || 0;
      let divValue = this.dividendTx.amount * this.dividendTx.rate;
      if (this.withholdTax.value && this.taxRate.value) {
        const tax = divValue * ((this.taxRate.value / 100));
        divValue -= tax;
        this.dividendTx.withholdingTax = tax;
      }
      if (this.fee.value) {
        divValue -= this.fee.value;
      }
      this.dividendTx.value = divValue;
      const response: DividendTxEditResponse = {
        creditCashAsset: this.updateCashAssetBalance.value,
        dividendTx: this.dividendTx,
        recurringTransaction: this.enableRecurringTransaction.value ? this.recurringTransaction.getRecurringTransactionDetails() : null,
      };
      this.dialogRef.close(response);
    } else {
      this.dialogRef.close(null);
    }
  }

  /**
   * Load account and asset data
  */
  private loadData() {
    this.asset = this.account.getAssetById(this.dividendTx.payerAsset.id);
    this.isRentable = this.asset.type === AssetType.RealEstate;
    if (this.isRentable) {
      this.paymentTypeStr = 'rent';
    }
    this.cashAssets = this.account.assets
      .filter(asset => asset.type === AssetType.Cash && (asset.currency === this.asset.currency));
    let cash: Asset;
    if (this.dividendTx.asset.id) {
      cash = this.account.getAssetById(this.dividendTx.asset.id);
    }
    this.cashAsset.setValue(cash);
    this.amount.setValue(this.dividendTx.amount || this.asset.amount);
  }

  onTxDateChanged() {
    this.isScheduledTx = DateUtils.compareDates(new Date(this.transactionDate.value), this.todayDate) > 0;
    if (this.isScheduledTx) {
      this.updateCashAssetBalance.disable();
    } else {
      this.updateCashAssetBalance.enable();
    }
  }
}
