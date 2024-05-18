import { Component, OnInit, Inject, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PortfolioAccount } from '../../models/portfolio-account';
import { Asset, AssetType } from '../../models/asset';
import { FormArray, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CSV_IMPORT_COLUMN_IDS, TransactionsImportTemplate } from '../../models/transactions-import-template';
import { Transaction, TransactionData, TransactionType } from '../../models/transaction';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MatStepper } from '@angular/material/stepper';
import { PortfolioService } from '../../services/portfolio.service';
import { InputDialogType } from 'src/app/modules/dialogs/components/input-dialog/input-dialog.component';
import { ParsedCSVTransaction, TransactionsImportService } from '../../services/tx-import-service';
import { AssetOperationAction } from '../../models/asset-operation-data';
import { FloatingMath } from 'src/app/shared/util';
import { TradeTransaction, TradeTransactionData } from '../../models/trade-transaction';
import { SellTransaction, SellTransactionData } from '../../models/sell-transaction';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { LoggerService } from 'src/app/core/services/logger.service';
import { APP_CONSTS, ExchangeDetails } from 'src/app/config/app.constants';
import { map, startWith } from 'rxjs/operators';

/**
 * Data passed to the `TransactionsImportComponent` dialog
 */
export interface TransactionsImportData {
  account: PortfolioAccount;
  baseCurrency: string;
}

/**
 * Component to import a list of transactions from a given CSV file
 */
@Component({
  selector: 'app-transactions-import',
  templateUrl: './transactions-import.component.html',
  styleUrls: ['./transactions-import.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsImportComponent implements OnInit, OnDestroy {
  CSV_IMPORT_COLUMN_IDS = CSV_IMPORT_COLUMN_IDS;
  NEXT_BUTTON_CAPTIONS = ["Next", "Preview", "Import"];

  readonly AssetType = AssetType;

  filteredSupportedExchanges: Observable<ExchangeDetails[]>;
  supportedExchanges: ExchangeDetails[];
  currentForm: UntypedFormGroup;
  fileForm: UntypedFormGroup;
  fileLoaded: FormControl<boolean>;
  mapForm: UntypedFormGroup;
  template: FormControl<TransactionsImportTemplate>;
  fieldSeparator: FormControl<string>;
  exchange: FormControl<string>;
  decimalSeparator: FormControl<string>
  buyString: FormControl<string>;
  sellString: FormControl<string>;
  cashCreditString: FormControl<string>;
  cashDebitString: FormControl<string>;
  cashAsset: FormControl<Asset>;
  customDateFormat: FormControl<string>;
  dateFormat: FormControl<number>;
  includeFirstRow: FormControl<boolean>;
  updateCashAssetBalance: FormControl<boolean>;
  columnIDs: FormArray<FormControl<number>>;
  cashAssets: Asset[];
  isHandset: boolean;
  csvBuffer: string;
  displayedColumns: string[];
  csvRows: string[][];
  displayedCSVRows: string[][];
  parseComplete: boolean = true;
  templates: TransactionsImportTemplate[];
  transactionsData: ParsedCSVTransaction[];
  transactions: Transaction[];
  transactionsLoaded: boolean;

  private subscription: Subscription;


  constructor(public dialogRef: MatDialogRef<TransactionsImportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionsImportData, public dialogs: DialogsService,
    public portfolioService: PortfolioService, private cdr: ChangeDetectorRef,
    private txImportService: TransactionsImportService, private breakpointObserver: BreakpointObserver,
    private logger: LoggerService) {
  }


  async ngOnInit() {
    this.subscription = this.breakpointObserver.observe([Breakpoints.Small, Breakpoints.XSmall])
      .subscribe((state) => {
        this.isHandset = state.matches;
        this.cdr.markForCheck();
      });

    this.cashAssets = this.data.account.assets
      .filter(asset => asset.type === AssetType.Cash);

    this.fileLoaded = new FormControl<boolean>(null);
    this.fileForm = new UntypedFormGroup({
      fileLoaded: this.fileLoaded,
    });

    this.exchange = new FormControl<string>("");
    this.buyString = new FormControl<string>("Buy");
    this.sellString = new FormControl<string>("Sell");
    this.cashDebitString = new FormControl<string>("Out|Withdrawal");
    this.cashCreditString = new FormControl<string>("In|Deposit");
    this.decimalSeparator = new FormControl<string>(this.getDecimalSeparator());
    this.fieldSeparator = new FormControl<string>(',');
    this.cashAsset = new FormControl<Asset>(this.cashAssets.length === 1 ? this.cashAssets[0] : null);
    this.includeFirstRow = new FormControl<boolean>(false);
    this.dateFormat = new FormControl<number>(0);
    this.customDateFormat = new FormControl<string>("YYYY-MM-DD hh:mm:ss");
    this.template = new FormControl<TransactionsImportTemplate>(null);
    this.updateCashAssetBalance = new FormControl<boolean>(true);
    this.columnIDs = new FormArray<FormControl<number>>([]);
    this.transactionsLoaded = false;

    this.mapForm = new UntypedFormGroup({
      exchange: this.exchange,
      buyString: this.buyString,
      cashCreditString: this.cashCreditString,
      cashDebitString: this.cashDebitString,
      cashAsset: this.cashAsset,
      decimalSeparator: this.decimalSeparator,
      fieldSeparator: this.fieldSeparator,
      includeFirstRow: this.includeFirstRow,
      dateFormat: this.dateFormat,
      customDateFormat: this.customDateFormat,
      template: this.template,
      updateCashAssetBalance: this.updateCashAssetBalance,
      columnIDs: this.columnIDs,
      sellString: this.sellString,
    });

    this.supportedExchanges = APP_CONSTS.SUPPORTED_EXCHANGES.EQUITY;
    this.filteredSupportedExchanges = this.exchange.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterSupportedExchanges(value))
      );

    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /** 
   * Event fired when selected step has changed
   */
  stepChanged(event: StepperSelectionEvent) {
    switch (event.selectedIndex) {
      case 0:
        this.currentForm = null;
        break;
      case 1:
        this.currentForm = this.mapForm;
        break;
      case 2:
        this.preview();        
    }
  }

  nextStep(stepper: MatStepper) {
    switch (stepper.selectedIndex) {
      case 0:
        stepper.next();
        break;
      case 1:
        stepper.next();
        break;
      case 2:
        this.import();
    }
  }

  /**
   * Parse the CSV rows and use the data to build & display the buy/sell transactions list
   */
  preview() {
    this.transactionsLoaded = false;
    this.transactions = [];
    try {
      const template = this.buildTemplate();
      const response = this.txImportService.createTransactionsData(this.displayedCSVRows, this.decimalSeparator.value, template,
        this.data.account, this.cashAsset.value, AssetType.Stock, this.updateCashAssetBalance.value, this.exchange.value);
      if (response.skippedRows.length > 0) {
        response.skippedRows.sort();
        this.dialogs.warn(`The following rows were skipped due to errors:\n ${response.skippedRows.join(", ")} `);
      }
      this.transactionsData = response.transactionsData;
      for (let parsedTxData of this.transactionsData) {
        const operationData = parsedTxData.operationData;
        if (operationData.action === AssetOperationAction.BUY) {
          const transactionValue = FloatingMath.fixRoundingError(operationData.amount * operationData.price + operationData.fee);
          const txData: TradeTransactionData = {
            asset: {
              accountDescription: this.data.account.description,
              accountId: this.data.account.id,
              id: null,
              description: operationData.description,
              currency: operationData.cashAsset.currency,
            },
            otherAsset: {
              id: operationData.cashAsset.id,
              currency: operationData.cashAsset.currency,
              description: operationData.cashAsset.description,
              accountDescription: this.data.account.description,
              accountId: this.data.account.id,
            },
            value: transactionValue,
            date: operationData.transactionDate,
            description: `Buy ${operationData.amount} ${operationData.description} @ ${operationData.price} ${operationData.cashAsset.currency}`,
            type: TransactionType.Buy,
            fee: operationData.fee,
            amount: operationData.amount,
            rate: operationData.price,
          };
          const tx = new TradeTransaction(txData);
          this.transactions.push(tx);
        } else if (operationData.action === AssetOperationAction.SELL) {
          const transactionValue = FloatingMath.fixRoundingError(operationData.amount * operationData.price - operationData.fee);
          const txData: SellTransactionData = {
            asset: {
              accountDescription: this.data.account.description,
              accountId: this.data.account.id,
              id: null,
              description: null,
              currency: operationData.cashAsset.currency,
            },
            otherAsset: {
              id: operationData.cashAsset.id,
              currency: operationData.cashAsset.currency,
              description: operationData.cashAsset.description,
              accountDescription: this.data.account.description,
              accountId: this.data.account.id,
            },
            value: transactionValue,
            date: operationData.transactionDate,
            description: `Sell ${operationData.amount} ${operationData.description} @ ${operationData.price} ${operationData.cashAsset.currency}`,
            type: TransactionType.Sell,
            fee: operationData.fee,
            amount: operationData.amount,
            rate: operationData.price,
            buyDate: null,
            buyPrice: null,
            grossBuyPrice: null,
            positionId: null,
          };
          const tx = new SellTransaction(txData);
          this.transactions.push(tx);
        } else if (operationData.action === AssetOperationAction.CREDIT || operationData.action === AssetOperationAction.DEBIT) {
          const txValue = FloatingMath.fixRoundingError(operationData.amount - operationData.fee);
          const txData: TransactionData = {
            asset: {
              accountDescription: this.data.account.description,
              accountId: this.data.account.id,
              id: operationData.cashAsset.id,
              description: operationData.cashAsset.description,
              currency: operationData.cashAsset.currency,
            },
            value: Math.abs(txValue),
            date: operationData.transactionDate,
            description: ((operationData.action === AssetOperationAction.CREDIT) ? "Credit" : "Debit") + ` ${operationData.amount} ${operationData.cashAsset.currency}`,
            type: (operationData.action === AssetOperationAction.CREDIT) ? TransactionType.CreditCash : TransactionType.DebitCash,
            fee: operationData.fee,
            withholdingTax: 0,
          };
          const tx = new Transaction(txData);
          this.transactions.push(tx);
        }
      }
    } catch (e) {
      this.dialogs.error(e);
    }
    this.transactionsLoaded = true;
  }

  import() {
    this.dialogRef.close(this.transactionsData);
  }


  /**
   * Save the current import configuration as a template
   */
  async saveTemplate() {
    const name = await this.dialogs.input("Enter template name:", "", this.template.value ? this.template.value.name : "",
      InputDialogType.TEXT, "[a-zA-Z0-9 ]+");
    if (!name || name.trim() === "") {
      return;
    }
    try {
      let template = this.buildTemplate();
      template.name = name;
      await this.portfolioService.addTransactionsImportTemplate(template);
      await this.loadTemplates();
      // we need to get the new template object
      template = this.templates.find((tpl: TransactionsImportTemplate) => tpl.name === name);
      this.template.setValue(template);
    } catch (err) {
      this.logger.error(err);
      this.dialogs.error(err,'Could not save template');
    }
  }

  async applyTemplate() {
    const selectedTpl = this.template.value;
    if (selectedTpl) {
      const parseNeeded = selectedTpl.fieldSeparator !== this.fieldSeparator.value;
      this.decimalSeparator.setValue(selectedTpl.decimalSeparator);
      this.exchange.setValue(selectedTpl.exchangeCode);
      this.fieldSeparator.setValue(selectedTpl.fieldSeparator);
      this.includeFirstRow.setValue(selectedTpl.includeFirstRow);
      this.dateFormat.setValue(selectedTpl.useCustomDateFormat ? 1 : 0);
      this.customDateFormat.setValue(selectedTpl.customDateFormat);
      this.buyString.setValue(selectedTpl.buyString);
      this.sellString.setValue(selectedTpl.sellString);
      this.cashCreditString.setValue(selectedTpl.cashCreditString);
      this.cashDebitString.setValue(selectedTpl.cashDebitString);

      if (parseNeeded) {
        this.parseCSV();
      } else {
        this.updateCSVRows();
      }

      for (let col of this.columnIDs.controls) {
        col.setValue(CSV_IMPORT_COLUMN_IDS.IGNORE);
      }
      for (let colId in selectedTpl.columns) {
        if (selectedTpl.columns[colId] !== null && selectedTpl.columns[colId] < this.columnIDs.length) {
          this.columnIDs.at(selectedTpl.columns[colId]).setValue(+colId);
        }
      }

      this.cdr.markForCheck();
    }
  }

  /**
   * Delete the selected template
   */
  async deleteTemplate() {
    if (this.template.value) {
      const response = await this.dialogs.confirm("Delete selected template?", "");
      if (!response) {
        return;
      }
      try {
        await this.portfolioService.removeTransactionsImportTemplate(this.template.value);
        this.templates.splice(this.templates.indexOf(this.template.value), 1);
        this.template.setValue(null);
      } catch (err) {
        this.dialogs.error("Could not delete selected template!");
      }
    }
  }

  /**
 * Import data from CSV file
 * @param fileInput file containing app data
 * @param stepper import stepper
 */
  async importDataFromFile(fileInput: any, stepper: MatStepper) {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      this.csvBuffer = e.target.result;
      this.fileLoaded.setValue(true);
      this.template.setValue(null);
      stepper.next();
      this.parseCSV();
    };
    reader.readAsText(fileInput.target.files[0]);
    fileInput.target.value = null;
  }

  /**
   * Parse the user provided CSV file and display the result as a table
   */
  parseCSV() {
    try {
      this.csvRows = this.txImportService.parseCSVInput(this.csvBuffer, this.fieldSeparator.value);
      this.parseComplete = true;
      this.displayCSV();
    } catch (err) {
      this.csvRows = [];
      this.parseComplete = false;
    }

  }

  cancel() {
    this.dialogRef.close();
  }

  updateCSVRows() {
    if (this.includeFirstRow.value) {
      this.displayedCSVRows = this.csvRows.slice();
    } else {
      this.displayedCSVRows = this.csvRows.slice(1);
    }

  }

  /**
   * Create a new TransactionsImportTemplate and set it's properties with the 
   * @returns the resulting template
   */
  private buildTemplate() {
    const template = new TransactionsImportTemplate();
    template.decimalSeparator = this.decimalSeparator.value;
    template.exchangeCode = this.exchange.value;
    template.fieldSeparator = this.fieldSeparator.value;
    template.includeFirstRow = this.includeFirstRow.value;
    template.useCustomDateFormat = this.dateFormat.value == 1;
    template.customDateFormat = this.customDateFormat.value;
    template.buyString = this.buyString.value;
    template.sellString = this.sellString.value;
    template.cashCreditString = this.cashCreditString.value;
    template.cashDebitString = this.cashDebitString.value;
    template.columns = [];
    for (let i = 0; i < this.columnIDs.value.length; i++) {
      if (this.columnIDs.value[i] !== CSV_IMPORT_COLUMN_IDS.IGNORE) {
        if (template.columns[this.columnIDs.value[i]] === undefined) {
          template.columns[this.columnIDs.value[i]] = i;
        } else {
          throw new Error(`Column ${i + 1} is mapped to the same field as column ${template.columns[this.columnIDs.value[i]] + 1}`);
        }
      }
    }

    return template;
  }

  private displayCSV() {
    this.displayedCSVRows = [];
    let columnsNo = 0;
    if (this.csvRows.length > 0) {
      columnsNo = this.csvRows[0].length;
    }
    this.displayedColumns = [];
    this.columnIDs.clear();
    for (let i = 1; i <= columnsNo; i++) {
      this.displayedColumns.push(`Column ${i}`);
      this.columnIDs.push(new FormControl<number>(CSV_IMPORT_COLUMN_IDS.IGNORE));
    }
    this.updateCSVRows();
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
   * Return the current locale's decimal separator
   * @returns decimal separator character
   */
  private getDecimalSeparator() {
    const n = 1.1;
    const separator = n.toLocaleString().substring(1, 2);
    return separator;
  }

  /** 
   * Load the import templates from storage
   */
  private async loadTemplates() {
    this.templates = await this.portfolioService.getTransactionsImportTemplates();
  }


}
