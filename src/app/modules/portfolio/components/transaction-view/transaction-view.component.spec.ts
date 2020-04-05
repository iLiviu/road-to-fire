import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionViewComponent } from './transaction-view.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TransactionData, TransactionType, Transaction } from '../../models/transaction';
import { SAMPLE_ACCOUNTS, SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';

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
const dialogData = new Transaction(txData);

describe('TransactionViewComponent', () => {
  let component: TransactionViewComponent;
  let fixture: ComponentFixture<TransactionViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
        MatIconModule,
      ],
      declarations: [
        TransactionViewComponent,
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
    fixture = TestBed.createComponent(TransactionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
