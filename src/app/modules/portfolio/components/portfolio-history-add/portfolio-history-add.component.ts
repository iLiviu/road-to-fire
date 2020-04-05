import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import { AssetType } from '../../models/asset';
import { binarySearch, FloatingMath, DateUtils } from 'src/app/shared/util';
import { PortfolioHistoryEntry, PortfolioAssetValue, PortfolioHistoryDataField } from '../../models/portfolio-history';

export interface PortfolioHistoryAddComponentInput {
  baseCurrency: string;
  portfolioHistoryEntries: PortfolioHistoryEntry[];
  fieldToEdit: PortfolioHistoryDataField;
}

@Component({
  selector: 'app-portfolio-history-add',
  templateUrl: './portfolio-history-add.component.html',
  styleUrls: ['./portfolio-history-add.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioHistoryAddComponent implements OnInit {

  todayDate: Date;
  portfolioDate: FormControl;
  historyForm: FormGroup;
  assets: FormArray;
  selectedEntry: PortfolioHistoryEntry;

  readonly AssetType = AssetType;


  constructor(public dialogRef: MatDialogRef<PortfolioHistoryAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PortfolioHistoryAddComponentInput) { }

  ngOnInit() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);

    this.portfolioDate = new FormControl();

    this.historyForm = new FormGroup({
      [AssetType.Cash]: new FormControl(),
      [AssetType.Bond]: new FormControl(),
      [AssetType.Commodity]: new FormControl(),
      [AssetType.Cryptocurrency]: new FormControl(),
      [AssetType.Debt]: new FormControl(),
      [AssetType.P2P]: new FormControl(),
      [AssetType.RealEstate]: new FormControl(),
      [AssetType.Stock]: new FormControl(),
      portfolioDate: this.portfolioDate,
    });
  }

  /**
   * Actions to take when the user closed the dialog
   * Builds a PortfolioHistoryEntry from user provided input and returns it to caller
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      let newEntry: PortfolioHistoryEntry;
      // if we are updating an existing entry, copy the data we are not editing
      if (this.selectedEntry) {
        newEntry = Object.assign({}, this.selectedEntry);
      } else {
        const selectedDate = new Date(this.portfolioDate.value);
        selectedDate.setHours(0, 0, 0, 0);
        newEntry = {
          date: selectedDate.toISOString(),
          assets: [],
          value: 0,
          assetsUnrealizedPL: [],
          unrealizedPL: 0,
        };
      }

      const assetsToEdit: PortfolioAssetValue[] = [];
      let assetsValue = 0;

      // tslint:disable-next-line: forin
      for (const assetType in AssetType) {
        const ctrl = this.historyForm.controls[assetType];
        if (ctrl && ctrl.value) {
          const value: PortfolioAssetValue = {
            type: +assetType,
            value: ctrl.value,
          };
          assetsToEdit.push(value);
          assetsValue += ctrl.value;
        }
      }

      if (this.data.fieldToEdit === PortfolioHistoryDataField.Assets) {
        newEntry.assets = assetsToEdit;
        newEntry.value = assetsValue;
      } else {
        newEntry.assetsUnrealizedPL = assetsToEdit;
        newEntry.unrealizedPL = assetsValue;
      }

      this.dialogRef.close(newEntry);
    } else {
      this.dialogRef.close(null);
    }
  }

  /**
   * Fired when date input changes. If historic portfolio data exists for the input date,
   * populate the user fields with values from that date.
   */
  onDateChanged() {
    this.selectedEntry = null;
    const selectedDate = new Date(this.portfolioDate.value);
    selectedDate.setHours(0, 0, 0, 0);
    const entry: PortfolioHistoryEntry = {
      date: selectedDate.toISOString(),
      assets: [],
      value: 0,
      unrealizedPL: 0,
      assetsUnrealizedPL: [],
    };
    const idx = binarySearch<PortfolioHistoryEntry>(this.data.portfolioHistoryEntries, entry,
      (a: PortfolioHistoryEntry, b: PortfolioHistoryEntry) => {
        return DateUtils.compareDates(new Date(a.date), new Date(b.date));
      });
    if (idx >= 0) {
      this.selectedEntry = this.data.portfolioHistoryEntries[idx];
      // clear all fields
      for (const assetType in AssetType) {
        // tslint:disable-next-line: forin
        const ctrl = this.historyForm.controls[assetType];
        if (ctrl) {
          ctrl.setValue(0);
        }
      }

      let assetsToEdit: PortfolioAssetValue[];
      if (this.data.fieldToEdit === PortfolioHistoryDataField.Assets) {
        assetsToEdit = this.selectedEntry.assets;
      } else {
        assetsToEdit = this.selectedEntry.assetsUnrealizedPL;
      }

      for (const value of assetsToEdit) {
        const ctrl = this.historyForm.controls[value.type];
        if (ctrl) {
          ctrl.setValue(FloatingMath.round2Decimals(value.value));
        }
      }
    }
  }

}
