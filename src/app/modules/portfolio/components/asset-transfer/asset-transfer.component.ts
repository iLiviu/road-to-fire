import { Component, OnInit, Inject, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { FloatingMath, getDateAsISOString } from 'src/app/shared/util';
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
 * Validates the value of the amount control for cash, debt, and tradeable asset transfers.
 * @param sourceAsset source asset being transferred from
 * @param maxAmount maximum available amount on source (asset amount or position amount)
 * @param feeCtrl form control that holds the fee value
 * @param destinationAssetCtrl form control that holds the destination asset
 */
const amountValidator = (
  sourceAsset: Asset,
  maxAmount: number,
  feeCtrl: UntypedFormControl,
  destinationAssetCtrl: UntypedFormControl,
) => {
  return (control: UntypedFormControl): ValidationErrors | null => {
    const amount = control.value;
    if (amount === null || amount === undefined || typeof amount !== 'number' || Number.isNaN(amount)) {
      return { invalidRange: true };
    }

    const fee = Math.max(0, Number(feeCtrl?.value) || 0);
    const destAsset: Asset | null = destinationAssetCtrl?.value || null;
    let invalidRange: boolean;

    if (sourceAsset?.isDebt()) {
      if (destAsset?.isDebt()) {
        // Debt -> Debt: negative amount only, capped by source negative balance (fee passed to destination)
        invalidRange = amount >= 0 || amount < maxAmount;
      } else if (destAsset) {
        // Debt -> Cash: positive amount only, no max limit on negative source balance
        invalidRange = amount <= 0;
      } else {
        // Destination not yet selected: allow positive (Debt -> Cash) or valid negative (Debt -> Debt)
        invalidRange = amount === 0 || (amount < 0 && amount < maxAmount);
      }
    } else {
      // Cash or tradeable source: ending balance must not fall below 0
      const maxSourceAmount = FloatingMath.fixRoundingError(maxAmount - fee);
      if (destAsset?.isDebt()) {
        // Cash -> Debt: destination debt ending balance must be <= 0
        const maxDestAmount = FloatingMath.fixRoundingError(-destAsset.amount);
        const effectiveMax = Math.min(maxSourceAmount, maxDestAmount);
        invalidRange = amount <= 0 || amount > effectiveMax;
      } else {
        invalidRange = amount <= 0 || amount > maxSourceAmount;
      }
    }

    return invalidRange ? { invalidRange: true } : null;
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
  assetForm: UntypedFormGroup;
  amount: UntypedFormControl;
  cashOrDebtTransfer: boolean;
  debtFlag: number;
  description: UntypedFormControl;
  destinationAccount: UntypedFormControl;
  destinationAsset: UntypedFormControl;
  destinationCashAssets: Asset[] = [];
  enableRecurringTransaction: UntypedFormControl;
  fee: UntypedFormControl;
  fullAssetTransfer: boolean;
  hasAmount: boolean;
  maxAmount: number;
  transactionDate: UntypedFormControl;

  readonly AssetType = AssetType;

  @ViewChild('recurringTransaction') private readonly recurringTransaction: RecurringTransactionInputComponent;
  private readonly componentDestroyed$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<AssetTransferComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetTransferData,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
    this.debtFlag = (this.data.sourceAsset.amount < 0) ? 1 : 0;
    this.cashOrDebtTransfer = this.data.sourceAsset.isCashOrDebt();
    this.hasAmount = this.data.sourceAsset.type !== AssetType.P2P && this.data.sourceAsset.type !== AssetType.RealEstate;

    // for tradeable assets, if we are not transferring a position, then all positions must be transferred
    this.fullAssetTransfer = this.data.sourceAsset.isTradeable() && (!this.data.sourcePosition || !this.hasAmount);

    // check if we are transferring a position
    if (this.data.sourcePosition) {
      this.maxAmount = this.data.sourcePosition.amount;
    } else {
      this.maxAmount = this.data.sourceAsset.amount;
    }

    this.data.accounts.sort((a, b) => a.description < b.description ? -1 : 1);
    this.description = new UntypedFormControl('Transfer');
    this.transactionDate = new UntypedFormControl(new Date());
    this.destinationAccount = new UntypedFormControl();
    this.destinationAccount.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.onDestinationAccountChanged());
    this.destinationAsset = new UntypedFormControl();
    this.destinationAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.amount.updateValueAndValidity();
        this.cdr.markForCheck();
      });
    this.enableRecurringTransaction = new UntypedFormControl();
    this.fee = new UntypedFormControl(0, [Validators.min(0)]);
    this.fee.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.amount.updateValueAndValidity();
        this.cdr.markForCheck();
      });
    this.amount = new UntypedFormControl(
      this.fullAssetTransfer ? this.maxAmount : 0,
      [amountValidator(this.data.sourceAsset, this.maxAmount, this.fee, this.destinationAsset)],
    );
    this.amount.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.assetForm = new UntypedFormGroup({
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

    this.assetForm.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  /**
   * Title displayed in dialog header
   */
  get dialogTitle(): string {
    return `Transfer from ${this.data.sourceAsset?.description || ''}`;
  }

  /**
   * Gross transaction / transfer amount
   */
  get grossAmount(): number {
    return Number(this.amount?.value) || 0;
  }

  /**
   * Total transfer value factoring in fee
   */
  get totalTransferValue(): number {
    const feeVal = Number(this.fee?.value) || 0;
    return this.grossAmount < 0 ? this.grossAmount : FloatingMath.fixRoundingError(this.grossAmount + feeVal);
  }

  /**
   * Validation error message for the transfer amount field
   */
  get amountErrorMessage(): string {
    const destAsset: Asset | null = this.destinationAsset?.value || null;
    if (this.data.sourceAsset?.isDebt()) {
      if (destAsset?.isDebt()) {
        return this.maxAmount < 0
          ? `Amount must be between ${this.maxAmount} and 0`
          : 'No debt available to transfer';
      }
      if (destAsset) {
        return 'Amount must be greater than 0';
      }
      return 'Amount must be non-zero';
    }
    const feeVal = Math.max(0, Number(this.fee?.value) || 0);
    const maxSource = FloatingMath.fixRoundingError(this.maxAmount - feeVal);
    const maxAllowed = destAsset?.isDebt()
      ? Math.max(0, Math.min(maxSource, FloatingMath.fixRoundingError(-destAsset.amount)))
      : Math.max(0, maxSource);
    return `Amount must be between 0 and ${maxAllowed}`;
  }

  /**
   * Icon for position info pill
   */
  get pillIcon(): string {
    if (this.cashOrDebtTransfer) {
      return this.data.sourceAsset?.isDebt() ? 'credit_card' : 'account_balance_wallet';
    }
    return 'inventory_2';
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
        fee: this.fee?.value || 0,
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
    if (!this.destinationAccount.value) {
      this.destinationCashAssets = [];
      this.destinationAsset.setValue(null);
      this.cdr.markForCheck();
      return;
    }
    this.destinationCashAssets = (<PortfolioAccount>this.destinationAccount.value).assets?.filter(
      asset => asset.isCashOrDebt() &&
        (this.data.sourceAsset.isDebt() || (!asset.isDebt() || asset.amount < 0)) &&
        asset.id !== this.data.sourceAsset.id &&
        asset.currency === this.data.sourceAsset.currency) || [];
    this.destinationCashAssets.sort((a, b) => a.description < b.description ? -1 : 1);
    this.destinationAsset.setValue(this.destinationCashAssets.length > 0 ? this.destinationCashAssets[0] : null);
    this.cdr.markForCheck();
  }
}
