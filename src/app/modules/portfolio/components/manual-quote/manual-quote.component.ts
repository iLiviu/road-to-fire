import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { PortfolioAccount } from '../../models/portfolio-account';
import { TradeableAsset } from '../../models/tradeable-asset';
import { AccountAsset } from '../../models/account-asset';

interface AssetData {
  account: PortfolioAccount;
  asset: TradeableAsset;
  formCtrl: FormControl;
}

/**
 * Component to provide a UI for manually entering quotes for assets for which quotes
 * couldn't be retrieved automatically (they are not traded on exchanges or are traded on exchanges
 * that are not supported)
 */
@Component({
  selector: 'app-manual-quote',
  templateUrl: './manual-quote.component.html',
  styleUrls: ['./manual-quote.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualQuoteComponent implements OnInit {

  quotesForm: FormGroup;
  quotesFormAssets: FormArray;
  assets: AssetData[];

  constructor(public dialogRef: MatDialogRef<ManualQuoteComponent>,
    @Inject(MAT_DIALOG_DATA) public accountAssets: AccountAsset[]) {
  }

  ngOnInit() {
    this.quotesFormAssets = new FormArray([]);
    this.quotesForm = new FormGroup({
      quotesFormAssets: this.quotesFormAssets,
    });
    this.loadData();
  }

  /**
   * Create form controls for all assets passed
   */
  loadData() {
    this.assets = [];
    this.quotesFormAssets.controls.length = 0;

    for (const accAsset of this.accountAssets) {
      const tradeableAsset = <TradeableAsset>accAsset.asset;
      const ctrl = new FormControl(tradeableAsset.currentPrice, [Validators.min(0.00001), Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]);
      this.quotesFormAssets.push(ctrl);
      this.assets.push({
        account: accAsset.account,
        asset: tradeableAsset,
        formCtrl: ctrl,
      });
    }
  }

  /**
   * Fired when user closed the dialog. Saves user provided quotes.
   */
  saveQuotes() {
    const timestamp = new Date().toISOString();
    for (let i = 0; i < this.assets.length; i++) {
      const assetData = this.assets[i];

      assetData.asset.currentPrice = +assetData.formCtrl.value;
      assetData.asset.lastQuoteUpdate = timestamp;
    }
    this.dialogRef.close(true);
  }
}
