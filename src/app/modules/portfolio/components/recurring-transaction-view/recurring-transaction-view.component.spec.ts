import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringTransactionViewComponent } from './recurring-transaction-view.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { RecurringTransaction, RecurringTransactionType, RecurringTransactionData } from '../../models/recurring-transaction';
import { Transaction, TransactionType, TransactionData } from '../../models/transaction';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';

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
const dialogData = new RecurringTransaction(recTxData);


describe('RecurringTransactionViewComponent', () => {
  let component: RecurringTransactionViewComponent;
  let fixture: ComponentFixture<RecurringTransactionViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
      ],
      declarations: [
        RecurringTransactionViewComponent,
        FormatDatePipe,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {}
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData
        }
      ],

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecurringTransactionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
