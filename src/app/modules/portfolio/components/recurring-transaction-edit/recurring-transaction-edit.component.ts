import { Component, OnInit, Inject, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Transaction, TransactionType } from '../../models/transaction';
import { RecurringTransactionType, RecurringTransaction } from '../../models/recurring-transaction';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PortfolioAccount } from '../../models/portfolio-account';
import { PortfolioService } from '../../services/portfolio.service';
import { Asset, AssetType } from '../../models/asset';
import { Subject } from 'rxjs';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { getDateAsISOString } from 'src/app/shared/util';
import { takeUntil } from 'rxjs/operators';
import { TransferTransaction } from '../../models/transfer-transaction';
import { TwoWayTransaction } from '../../models/two-way-transaction';

export interface RecurringTransactionEditData {
  recTx: RecurringTransaction;
  accounts: PortfolioAccount[];
}

/**
 * Component that displays a UI for editing a recurring transaction (only cash debit/credit & transfer transactions
 * are supported).
 */
@Component({
  selector: 'app-recurring-transaction-edit',
  templateUrl: './recurring-transaction-edit.component.html',
  styleUrls: ['./recurring-transaction-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringTransactionEditComponent implements OnInit, OnDestroy {

  accounts: PortfolioAccount[];
  assetForm: FormGroup;
  amount: FormControl;
  description: FormControl;
  destinationAccount: FormControl;
  destinationAsset: FormControl;
  destinationCashAssets: Asset[] = [];
  fee: FormControl;
  isCashDestination: boolean;
  isCredit: boolean;
  isDebit: boolean;
  isEditableSource: boolean;
  recTx: RecurringTransaction;
  sourceAccount: FormControl;
  sourceCashAssets: Asset[] = [];
  sourceAsset: FormControl;
  tx: Transaction;
  transactionDate: FormControl;
  twoWayTx: TwoWayTransaction;
  txOccurrence: string;
  withholdingTax: FormControl;

  readonly TransactionType = TransactionType;
  readonly RecurringTransactionType = RecurringTransactionType;
  readonly AssetType = AssetType;

  private componentDestroyed$ = new Subject();
  @ViewChild('recTxInput', { static: false }) private readonly recTxInput: RecurringTransactionInputComponent;

  constructor(public dialogRef: MatDialogRef<RecurringTransactionEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RecurringTransactionEditData) {

    this.recTx = data.recTx;
    this.accounts = data.accounts;
  }

  ngOnInit() {
    this.tx = this.recTx.tx;
    if (this.tx.type === TransactionType.DebitCash || this.tx.type === TransactionType.CreditCash) {
      // nothing special
    } else if (this.tx.isDividend() || this.tx.isInterestPayment()) {
      this.withholdingTax = new FormControl(this.recTx.tx.withholdingTax, [Validators.min(0)]);
    } else if (this.recTx.tx.isTransfer() || this.recTx.tx.isPrincipalPayment()) {
      this.twoWayTx = <TwoWayTransaction>this.tx;
      this.isCashDestination = this.tx.isTrade();
    } else {
      throw new Error('Unsupported transaction type');
    }
    this.isEditableSource = !this.recTx.tx.isTrade();
    this.isCredit = this.tx.isCredit();
    this.isDebit = this.tx.isDebit();

    this.amount = new FormControl(this.recTx.tx.value);
    this.fee = new FormControl(this.recTx.tx.fee, [Validators.min(0)]);
    this.amount.setValidators([Validators.min(Number.EPSILON)]);
    this.description = new FormControl(this.recTx.tx.description);
    this.transactionDate = new FormControl(new Date(this.recTx.tx.date));

    this.assetForm = new FormGroup({
      amount: this.amount,
      description: this.description,
      fee: this.fee,
      transactionDate: this.transactionDate,
    });
    if (this.withholdingTax) {
      this.assetForm.addControl('withholdingTax', this.withholdingTax);
    }

    this.loadData();
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  onDestinationAccountChanged() {
    if (this.sourceAsset.value) {
      this.destinationCashAssets = (<PortfolioAccount>this.destinationAccount.value).assets.filter(
        asset => asset.type === AssetType.Cash &&
          asset.id !== this.sourceAsset.value.id &&
          asset.currency === this.sourceAsset.value.currency);
      this.destinationCashAssets.sort((a, b) => a.description < b.description ? -1 : 1);
    } else {
      this.destinationCashAssets = [];
    }
  }

  onSourceAccountChanged() {
    if (this.sourceAccount.value) {
      this.sourceCashAssets = (<PortfolioAccount>this.sourceAccount.value).assets.filter(
        asset => asset.type === AssetType.Cash);
      this.sourceCashAssets.sort((a, b) => a.description < b.description ? -1 : 1);
    } else {
      this.sourceCashAssets = [];
    }
  }

  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      this.recTx = this.recTxInput.getRecurringTransactionDetails();
      this.tx.description = this.description.value;
      this.tx.fee = this.fee.value || 0;
      if (this.withholdingTax) {
        this.tx.withholdingTax = this.withholdingTax.value;
      }
      this.tx.value = this.amount.value;
      this.tx.date = getDateAsISOString(this.transactionDate.value);
      if (this.isEditableSource) {
        const account: PortfolioAccount = this.sourceAccount.value;
        const asset: Asset = this.sourceAsset.value;
        this.tx.asset.accountId = account.id;
        this.tx.asset.accountDescription = account.description;
        this.tx.asset.currency = asset.currency;
        this.tx.asset.description = asset.description;
        this.tx.asset.id = asset.id;
      }
      if (this.twoWayTx) {
        const destAcc: PortfolioAccount = this.destinationAccount.value;
        const destAsset: Asset = this.destinationAsset.value;
        this.twoWayTx.otherAsset.id = destAsset.id;
        this.twoWayTx.otherAsset.currency = destAsset.currency;
        this.twoWayTx.otherAsset.description = destAsset.description;
        this.twoWayTx.otherAsset.accountDescription = destAcc.description;
        this.twoWayTx.otherAsset.accountId = destAcc.id;
      }
      this.dialogRef.close(this.recTx);
    } else {
      this.dialogRef.close(null);
    }
  }

  private loadData() {
    const account = this.getAccountById(this.tx.asset.accountId);
    this.sourceAccount = new FormControl(account);
    this.sourceAccount.markAsTouched();
    this.assetForm.addControl('sourceAccount', this.sourceAccount);
    this.sourceAccount.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.onSourceAccountChanged();
        this.sourceAsset.setValue(null);
      });
    this.onSourceAccountChanged();
    let srcAsset: Asset;
    if (account) {
      srcAsset = account.getAssetById(this.tx.asset.id);
      if (srcAsset && srcAsset.type === AssetType.Cash) {
        this.isCashDestination = true;
      }
    }
    this.sourceAsset = new FormControl(srcAsset);
    this.sourceAsset.markAsTouched();
    this.assetForm.addControl('sourceAsset', this.sourceAsset);
    this.sourceAsset.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        if (this.destinationAccount) {
          this.onDestinationAccountChanged();
        }
        if (this.destinationAsset) {
          this.destinationAsset.setValue(null);
        }
      });

    if (this.twoWayTx) {
      const destAccount = this.getAccountById(this.twoWayTx.otherAsset.accountId);
      this.destinationAccount = new FormControl(destAccount);
      this.destinationAccount.markAsTouched();
      this.destinationAccount.valueChanges
        .pipe(takeUntil(this.componentDestroyed$))
        .subscribe(() => {
          this.onDestinationAccountChanged();
          this.destinationAsset.setValue(null);
        });
      this.assetForm.addControl('destinationAccount', this.destinationAccount);
      this.onDestinationAccountChanged();
      let destAsset: Asset;
      if (destAccount) {
        destAsset = destAccount.getAssetById(this.twoWayTx.otherAsset.id);
        if (destAsset && destAsset.type === AssetType.Cash) {
          this.isCashDestination = true;
        }
      }
      this.destinationAsset = new FormControl(destAsset);
      this.destinationAsset.markAsTouched();
      this.assetForm.addControl('destinationAsset', this.destinationAsset);
    }

  }

  getAccountById(id: number) {
    return this.accounts.find((acc) => acc.id === id);
  }
}
