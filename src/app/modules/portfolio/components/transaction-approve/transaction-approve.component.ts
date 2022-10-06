import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';

import {
  TransactionType,
  Transaction
} from '../../models/transaction';
import { Asset, AssetType } from '../../models/asset';
import { ExchangeTransaction } from '../../models/exchange-transaction';
import { TransferTransaction } from '../../models/transfer-transaction';
import { TradeTransaction } from '../../models/trade-transaction';
import { TwoWayTransaction } from '../../models/two-way-transaction';
import { PortfolioAccount } from '../../models/portfolio-account';

export interface TransactionApproveData {
  tx: Transaction;
  account: PortfolioAccount;
}

/**
 * Component to display a UI for allowing the user to approve a pending transaction.
 */
@Component({
  selector: 'app-transaction-approve',
  templateUrl: './transaction-approve.component.html',
  styleUrls: ['./transaction-approve.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionApproveComponent implements OnInit {

  cashAssets: Asset[] = [];
  exchangeTx: ExchangeTransaction;
  isCredit: boolean;
  isDebit: boolean;
  mainAsset: UntypedFormControl;
  otherAsset: UntypedFormControl;
  transferTx: TransferTransaction;
  tradeTx: TradeTransaction;
  twoWayTx: TwoWayTransaction;
  tx: Transaction;
  txForm: UntypedFormGroup;

  readonly TransactionType = TransactionType;


  constructor(public dialogRef: MatDialogRef<TransactionApproveComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionApproveData) {
    this.tx = data.tx;
    if (this.tx.isExchange()) {
      this.exchangeTx = <ExchangeTransaction>this.tx;
      this.twoWayTx = <TwoWayTransaction>this.tx;
    } else if (this.tx.isTransfer()) {
      this.transferTx = <TransferTransaction>this.tx;
      this.twoWayTx = <TwoWayTransaction>this.tx;
    } else if (this.tx.isTrade()) {
      this.tradeTx = <TradeTransaction>this.tx;
      this.twoWayTx = <TwoWayTransaction>this.tx;
    } else {
    }
    this.isCredit = this.tx.isCredit();
    this.isDebit = this.tx.isDebit();
  }


  ngOnInit() {
    this.init();
  }

  async init() {
    this.txForm = new UntypedFormGroup({});

    let cashAssetsNeeded = false;
    if (!this.tx.asset.id) {
      this.mainAsset = new UntypedFormControl(null, [Validators.required]);
      this.txForm.addControl('mainAsset', this.mainAsset);
      cashAssetsNeeded = true;
    }

    if ((this.twoWayTx && !this.twoWayTx.otherAsset.id)) {
      this.otherAsset = new UntypedFormControl(null, [Validators.required]);
      this.txForm.addControl('otherAsset', this.otherAsset);
      cashAssetsNeeded = true;
    }

    if (cashAssetsNeeded) {
      this.cashAssets = this.data.account.assets.filter(
        asset => asset.type === AssetType.Cash && (asset.currency === this.tx.asset.currency)
      );
    }
  }

  /**
   * Fired if user approves the transaction
   */
  approve() {
    if (this.txForm.valid) {
      if (!this.tx.asset.id) {
        const mainAsset: Asset = this.mainAsset.value;
        this.tx.asset.id = mainAsset.id;
        this.tx.asset.description = mainAsset.description;
      }

      if (this.twoWayTx && !this.twoWayTx.otherAsset.id) {
        const otherAsset: Asset = this.otherAsset.value;
        this.twoWayTx.otherAsset.id = otherAsset.id;
        this.twoWayTx.otherAsset.description = otherAsset.description;
      }
      this.dialogRef.close(true);
    }
  }
}
