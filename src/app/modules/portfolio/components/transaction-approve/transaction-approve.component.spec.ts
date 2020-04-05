import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionApproveComponent, TransactionApproveData } from './transaction-approve.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
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
const dialogData: TransactionApproveData = {
  tx: new Transaction(txData),
  account: SAMPLE_ACCOUNTS.account1,
};

describe('TransactionApproveComponent', () => {
  let component: TransactionApproveComponent;
  let fixture: ComponentFixture<TransactionApproveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
        MatIconModule,
        FormsModule,
        MatSelectModule,
        MatFormFieldModule,
        ReactiveFormsModule,
      ],
      declarations: [
        TransactionApproveComponent,
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
    fixture = TestBed.createComponent(TransactionApproveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
