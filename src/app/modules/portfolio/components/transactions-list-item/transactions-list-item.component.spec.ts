import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionsListItemComponent } from './transactions-list-item.component';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatListModule, MatCheckboxModule } from '@angular/material';
import { Transaction, TransactionType, TransactionData } from '../../models/transaction';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';
import { FormsModule } from '@angular/forms';

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


describe('TransactionsListItemComponent', () => {
  let component: TransactionsListItemComponent;
  let fixture: ComponentFixture<TransactionsListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatCheckboxModule,
        FormsModule,
        MatSelectModule,
        NoopAnimationsModule,
      ],
      declarations: [
        TransactionsListItemComponent,
        FormatDatePipe,
      ],
      providers: [
        { provide: AssetManagementService, useClass: MockAssetManagementService }
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionsListItemComponent);
    component = fixture.componentInstance;
    component.tx = tx;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
