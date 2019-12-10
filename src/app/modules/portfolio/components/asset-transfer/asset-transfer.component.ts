import { Component, OnInit, Inject, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subscription, Subject } from 'rxjs';

import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { getDateAsISOString } from 'src/app/shared/util';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { RecurringTransaction } from '../../models/recurring-transaction';
import { takeUntil } from 'rxjs/operators';
import { TradePosition } from '../../models/tradeable-asset';

/**
 * Data passed by caller to `AssetTransferComponent` dialog
 */
export interface AssetTransferData {
  sourceAsset: Asset;
  sourceAccount: PortfolioAccount;
  sourcePosition: TradePosition;
  accounts: PortfolioAccount[];
}

/**
 * Data passed along to caller when `AssetTransferComponent` dialog is closed
 */
export interface AssetTransferResponse {
  destinationAccount: PortfolioAccount;
  destinationAsset?: Asset;
  transactionDate: string;
  description: string;
  amount: number;
  fee: number;
  recurringTransaction: RecurringTransaction;
}

/**
 * Validates the value of the amount control. If we are transferring debt,
 * fee will be passed to destination so do not substract from max amount.
 * @param maxAmount maximum allowed amount
 * @param feeCtrl form control that holds the fee value
 */
const amountValidator = (maxAmount: number, feeCtrl: FormControl) => {
  return (control: FormControl): ValidationErrors | null => {
    const amount = control.value;
    let invalidRange: boolean;
    if (maxAmount < 0) {
      // validate debt and ignore fee
      invalidRange = amount >= 0 || amount < maxAmount;
    } else {
      invalidRange = amount <= 0 || amount > (maxAmount - feeCtrl.value);

    }
    return invalidRange ? { 'invalidRange': true } : null;
  };
};

/**
 * Component that provides a UI to transfer an asset to a different account.
 * For tradeable assets, a transfer can be made either for part of a single position or
 * for all positions (can't transfer only a part of multiple positions at once).
 */
@Component({
  selector: 'app-asset-transfer',
  templateUrl: './asset-transfer.component.html',
  styleUrls: ['./asset-transfer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetTransferComponent implements OnInit, OnDestroy {

  todayDate: Date;
  assetForm: FormGroup;
  amount: FormControl;
  cashOrDebtTransfer: boolean;
  debtFlag: number;
  description: FormControl;
  destinationAccount: FormControl;
  destinationAsset: FormControl;
  destinationCashAssets: Asset[] = [];
  enableRecurringTransaction: FormControl;
  fee: FormControl;
  fullAssetTransfer: boolean;
  maxAmount: number;
  transactionDate: FormControl;

  readonly AssetType = AssetType;

  @ViewChild('recurringTransaction', { static: false }) private readonly recurringTransaction: RecurringTransactionInputComponent;
  private readonly componentDestroyed$ = new Subject();

  constructor(public dialogRef: MatDialogRef<AssetTransferComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetTransferData) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.debtFlag = (this.data.sourceAsset.amount < 0) ? 1 : 0;
    this.cashOrDebtTransfer = this.data.sourceAsset.isCashOrDebt();

    // for tradeable assets, if we are not transferring a position, then all positions must be transferred
    this.fullAssetTransfer = this.data.sourceAsset.isTradeable() && !this.data.sourcePosition;

    // check if we are transferring a position
    if (this.data.sourcePosition) {
      this.maxAmount = this.data.sourcePosition.amount;
    } else {
      this.maxAmount = this.data.sourceAsset.amount;
    }

    this.data.accounts.sort((a, b) => a.description < b.description ? -1 : 1);
    this.description = new FormControl('Transfer');
    this.transactionDate = new FormControl(new Date());
    this.destinationAccount = new FormControl();
    this.destinationAccount.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.onDestinationAccountChanged());
    this.destinationAsset = new FormControl();
    this.enableRecurringTransaction = new FormControl();
    this.fee = new FormControl(0, [Validators.min(0)]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.amount.updateValueAndValidity());
    this.amount = new FormControl(this.fullAssetTransfer ? this.maxAmount : 0, [amountValidator(this.maxAmount, this.fee)]);

    this.assetForm = new FormGroup({
      amount: this.amount,
      destinationAccount: this.destinationAccount,
      description: this.description,
      enableRecurringTransaction: this.enableRecurringTransaction,
      transactionDate: this.transactionDate,
    });
    if (this.cashOrDebtTransfer) {
      this.assetForm.addControl('destinationAsset', this.destinationAsset);
      this.assetForm.addControl('fee', this.fee);
    } else {
      // non-cash assets can't be transferred to same account
      this.data.accounts = this.data.accounts.filter((account) => account.id !== this.data.sourceAccount.id);
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      const data: AssetTransferResponse = {
        amount: this.amount.value,
        destinationAccount: this.destinationAccount.value,
        destinationAsset: this.destinationAsset.value,
        transactionDate: getDateAsISOString(this.transactionDate.value),
        description: this.description.value,
        fee: this.fee.value,
        recurringTransaction: this.enableRecurringTransaction.value ? this.recurringTransaction.getRecurringTransactionDetails() : null,
      };
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close(null);
    }
  }

  /**
   * Triggered when destination account changes and updates the destination cash & debt assets.
   * Debt can only be transferred to another debt, while cash can be transferred to either debt or cash.
   */
  private onDestinationAccountChanged() {
    this.destinationCashAssets = (<PortfolioAccount>this.destinationAccount.value).assets.filter(
      asset => asset.isCashOrDebt() &&
        ((this.data.sourceAsset.amount > 0) || asset.isDebt()) &&
        asset.id !== this.data.sourceAsset.id &&
        asset.currency === this.data.sourceAsset.currency);
    this.destinationCashAssets.sort((a, b) => a.description < b.description ? -1 : 1);
    this.destinationAsset.setValue(null);
  }
}
