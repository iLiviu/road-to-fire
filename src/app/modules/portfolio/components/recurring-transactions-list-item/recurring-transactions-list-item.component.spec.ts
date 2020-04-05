import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RecurringTransactionsListItemComponent } from './recurring-transactions-list-item.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
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


describe('RecurringTransactionsListItemComponent', () => {
  let component: RecurringTransactionsListItemComponent;
  let fixture: ComponentFixture<RecurringTransactionsListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule,
      ],
      declarations: [
        RecurringTransactionsListItemComponent,
        FormatDatePipe,
      ],
      providers: [
        { provide: AssetManagementService, useClass: MockAssetManagementService }
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
  });

  it('should create', async(() => {
    fixture = TestBed.createComponent(RecurringTransactionsListItemComponent);
    component = fixture.componentInstance;
    component.recTx = recTx;
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component).toBeTruthy();
    });
  }));
});
