import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

import { RecurringTransactionEditComponent, RecurringTransactionEditData } from './recurring-transaction-edit.component';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { PortfolioService } from '../../services/portfolio.service';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { RecurringTransaction, RecurringTransactionData, RecurringTransactionType } from '../../models/recurring-transaction';
import { TransactionData, Transaction, TransactionType } from '../../models/transaction';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';

const txData: TransactionData = {
  asset: {
    accountDescription: SAMPLE_ACCOUNTS.account1.description,
    accountId: SAMPLE_ACCOUNTS.account1.id,
    currency: SAMPLE_ASSETS.EURCashAsset.currency,
    description: SAMPLE_ASSETS.EURCashAsset.description,
    id: SAMPLE_ASSETS.EURCashAsset.id,
  },
  date: new Date().toISOString(),
  description: 'debit',
  fee: 0,
  type: TransactionType.DebitCash,
  value: 1,
};
const tx = new Transaction(txData);
const recTxData: RecurringTransactionData = {
  autoApprove: false,
  inactive: false,
  period: 1,
  transactionsLeft: 0,
  type: RecurringTransactionType.Daily,
  tx: tx,
};
const dialogData: RecurringTransactionEditData = {
  recTx: new RecurringTransaction(recTxData),
  accounts: Object.values(SAMPLE_ACCOUNTS),
};

describe('RecurringTransactionEditComponent', () => {
  let component: RecurringTransactionEditComponent;
  let fixture: ComponentFixture<RecurringTransactionEditComponent>;

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
        RecurringTransactionEditComponent,
        RecurringTransactionInputComponent,
        EditDialogComponent,
        CurrencySymbolPipe,
      ],
      providers: [
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: PortfolioService, useClass: MockPortfolioService },
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close')
          }
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData
        }
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecurringTransactionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate gross and total debit amount correctly', () => {
    component.amount.setValue(100);
    component.fee.setValue(5);
    fixture.detectChanges();

    expect(component.grossAmount).toBe(100);
    expect(component.feeAmount).toBe(5);
    expect(component.totalDebitAmount).toBe(105);
    expect(component.netAmount).toBe(105);
  });

  it('should render form rows and summary card', () => {

    const summaryCard = fixture.debugElement.query(By.css('.order-summary-card'));
    expect(summaryCard).toBeTruthy();

    const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
    expect(formRows.length).toBeGreaterThanOrEqual(2);
  });
});
