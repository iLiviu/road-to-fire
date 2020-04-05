import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringTransactionInputComponent } from './recurring-transaction-input.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
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
const recTx = new RecurringTransaction(recTxData);


describe('RecurringTransactionInputComponent', () => {
  let component: RecurringTransactionInputComponent;
  let fixture: ComponentFixture<RecurringTransactionInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        NoopAnimationsModule,
        MatInputModule,
        MatSelectModule,
        MatFormFieldModule,
        MatCheckboxModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      declarations: [RecurringTransactionInputComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecurringTransactionInputComponent);
    component = fixture.componentInstance;
    component.parentForm = new FormGroup({});
    component.recTx = recTx;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
