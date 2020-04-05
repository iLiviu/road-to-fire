import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { getDateAsISOString, FloatingMath, DateUtils } from 'src/app/shared/util';
import { InterestTransaction } from '../../models/interest-transaction';

export interface InterestTxEditData {
  account: PortfolioAccount;
  tx: InterestTransaction;
}

/**
 * Holds the response from the `InterestTransactionEditComponent` dialog
 */
export interface InterestTxEditResponse {
  tx: InterestTransaction;
  creditCashAsset: boolean;
}

/**
 * Component to display a UI for editing data for an interest transaction
 */

@Component({
  selector: 'app-interest-transaction-edit',
  templateUrl: './interest-transaction-edit.component.html',
  styleUrls: ['./interest-transaction-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterestTransactionEditComponent implements OnInit {

  assetCurrency: string;
  assetForm: FormGroup;
  amount: FormControl;
  asset: Asset;
  account: PortfolioAccount;
  cashAssets: Asset[];
  cashAsset: FormControl;
  fee: FormControl;
  isScheduledTx = false;
  taxRate: FormControl;
  transactionDate: FormControl;
  todayDate: Date;
  tx: InterestTransaction;
  updateCashAssetBalance: FormControl;
  withholdTax: FormControl;


  constructor(public dialogRef: MatDialogRef<InterestTransactionEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InterestTxEditData) { }

  ngOnInit() {
    this.tx = this.data.tx;
    this.account = this.data.account;
    let defaultCashAsset = null;
    if (this.tx.asset.id) {
      defaultCashAsset = this.data.account.getAssetById(this.data.tx.asset.id);
    }

    this.cashAsset = new FormControl(defaultCashAsset);
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.amount = new FormControl(this.tx.value, [Validators.min(Number.EPSILON)]);
    this.fee = new FormControl(this.tx.fee || 0, [Validators.min(0)]);
    let txDate: Date;
    if (this.tx.date) {
      txDate = new Date(this.tx.date);
    } else {
      txDate = new Date();
    }
    this.assetCurrency = this.tx.payerAsset.currency;
    this.transactionDate = new FormControl(txDate);
    this.withholdTax = new FormControl(this.tx.withholdingTax > 0);
    let calculatedTaxRate = 0;
    if (this.tx.value) {
      calculatedTaxRate = this.tx.withholdingTax / this.tx.value;
    }
    this.taxRate = new FormControl(FloatingMath.fixRoundingError(calculatedTaxRate * 100), [Validators.min(0), Validators.max(100)]);
    this.updateCashAssetBalance = new FormControl(true);
    this.assetForm = new FormGroup({
      amount: this.amount,
      cashAsset: this.cashAsset,
      fee: this.fee,
      taxRate: this.taxRate,
      transactionDate: this.transactionDate,
      withholdTax: this.withholdTax,
      updateCashAssetBalance: this.updateCashAssetBalance,
    });

    this.loadData();
  }

  /**
   * Fired when the value of the transaction date input control changes
   */
  onTxDateChanged() {
    this.isScheduledTx = DateUtils.compareDates(new Date(this.transactionDate.value), this.todayDate) > 0;
    if (this.isScheduledTx) {
      this.updateCashAssetBalance.disable();
    } else {
      this.updateCashAssetBalance.enable();
    }
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      this.tx.value = this.amount.value || 0;
      const cashAsset: Asset = this.cashAsset.value;
      this.tx.asset.id = cashAsset.id;
      this.tx.asset.currency = cashAsset.currency;
      this.tx.asset.description = cashAsset.description;
      this.tx.date = getDateAsISOString(this.transactionDate.value);
      this.tx.description = `Interest from ${this.asset.description}`;
      this.tx.fee = this.fee.value || 0;
      let txValue = this.amount.value;
      if (this.withholdTax.value && this.taxRate.value) {
        const tax = txValue * ((this.taxRate.value / 100));
        txValue -= tax;
        this.tx.withholdingTax = tax;
      }
      if (this.fee.value) {
        txValue -= this.fee.value;
      }
      this.tx.value = txValue;
      const response: InterestTxEditResponse = {
        creditCashAsset: this.updateCashAssetBalance.value,
        tx: this.tx,
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
    this.asset = this.account.getAssetById(this.tx.payerAsset.id);
    this.cashAssets = this.account.assets
      .filter(asset => asset.type === AssetType.Cash && (asset.currency === this.asset.currency));
    let cash: Asset;
    if (this.tx.asset.id) {
      cash = this.account.getAssetById(this.tx.asset.id);
    }
    this.cashAsset.setValue(cash);
  }
}
