import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { DividendTransactionEditComponent, DividendTxEditData } from './dividend-transaction-edit.component';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { DividendTransaction, DividendTransactionData } from '../../models/dividend-transaction';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';
import { TransactionType } from '../../models/transaction';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';

const txData: DividendTransactionData = {
  amount: 10,
  otherAsset: {
    accountDescription: SAMPLE_ACCOUNTS.account1.description,
    accountId: SAMPLE_ACCOUNTS.account1.id,
    currency: SAMPLE_ASSETS.stockAsset1.currency,
    description: SAMPLE_ASSETS.stockAsset1.description,
    id: SAMPLE_ASSETS.stockAsset1.id,
  },
  date: new Date().toISOString(),
  description: 'Dividend',
  fee: 0,
  asset: {
    accountDescription: SAMPLE_ACCOUNTS.account1.description,
    accountId: SAMPLE_ACCOUNTS.account1.id,
    currency: SAMPLE_ASSETS.stockAsset1.currency,
    description: SAMPLE_ASSETS.EURCashAsset.description,
    id: SAMPLE_ASSETS.EURCashAsset.id,
  },
  rate: 2.5,
  type: TransactionType.CashDividend,
  value: 25,
};
const dialogData: DividendTxEditData = {
  dividendTx: new DividendTransaction(txData),
  account: SAMPLE_ACCOUNTS.account1,
};

describe('DividendTransactionEditComponent', () => {
  let component: DividendTransactionEditComponent;
  let fixture: ComponentFixture<DividendTransactionEditComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatToolbarModule,
        MatInputModule,
        MatCheckboxModule,
        MatCardModule,
      ],

      declarations: [
        DividendTransactionEditComponent,
        RecurringTransactionInputComponent,
        EditDialogComponent,
        CurrencySymbolPipe,
      ],
      providers: [
        { provide: DialogsService, useClass: MockDialogsService },
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close')
          }
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DividendTransactionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate gross, tax, and total proceeds correctly', () => {
    // Initially amount is 10, rate is 2.5, fee is 0, withholdTax is false
    expect(component.grossDividendValue).toBe(25);
    expect(component.taxAmount).toBe(0);
    expect(component.totalDividendValue).toBe(25);

    // Enable withhold tax and set tax rate
    component.withholdTax.setValue(true);
    component.taxRate.setValue(10);
    component.fee.setValue(2);
    fixture.detectChanges();

    expect(component.grossDividendValue).toBe(25);
    expect(component.taxAmount).toBe(2.5);
    expect(component.totalDividendValue).toBe(20.5);
  });

  it('should render form rows and summary card matching AssetTrade layout', () => {
    const summaryCard = fixture.debugElement.query(By.css('.order-summary-card'));
    expect(summaryCard).toBeTruthy();

    const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
    expect(formRows.length).toBeGreaterThanOrEqual(2);

    const positionPill = fixture.debugElement.query(By.css('.position-info-pill'));
    expect(positionPill).toBeTruthy();
  });
});
