import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransactionViewComponent } from './transaction-view.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TransactionData, TransactionType, Transaction } from '../../models/transaction';
import { ExchangeTransaction, ExchangeTransactionData } from '../../models/exchange-transaction';
import { TransferTransaction } from '../../models/transfer-transaction';
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      declarations: [
        TransactionViewComponent,
        FormatDatePipe,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close'),
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
    fixture = TestBed.createComponent(TransactionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.displayName).toBe('debit');
    expect(component.transactionTypeLabel).toBe('Debit Cash');
    expect(component.typeBadgeClass).toBe('debit');
  });

  it('should close dialog when cancel is called', () => {
    component.cancel();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should correctly configure for exchange transaction', () => {
    const exchangeData: ExchangeTransactionData = {
      asset: {
        accountDescription: 'Account 1',
        accountId: 1,
        currency: 'EUR',
        description: 'EUR Cash',
      },
      otherAsset: {
        accountDescription: 'Account 1',
        accountId: 1,
        currency: 'USD',
        description: 'USD Cash',
      },
      date: new Date().toISOString(),
      description: 'Exchange EUR to USD',
      fee: 1,
      type: TransactionType.Exchange,
      value: 110,
      amount: 100,
      rate: 1.1,
    };
    const exchangeTx = new ExchangeTransaction(exchangeData);
    const exchangeFixture = TestBed.createComponent(TransactionViewComponent);
    const exchangeComp = exchangeFixture.componentInstance;
    exchangeComp.tx = exchangeTx;
    exchangeComp.exchangeTx = exchangeTx;
    exchangeFixture.detectChanges();

    expect(exchangeComp.exchangeTx).toBeTruthy();
    expect(exchangeComp.transactionTypeLabel).toBe('Exchange');
    expect(exchangeComp.typeBadgeClass).toBe('exchange');
  });

  it('should correctly configure for transfer transaction', () => {
    const transferTx = new TransferTransaction(<TransferTransaction>{
      asset: {
        accountDescription: 'Account 1',
        accountId: 1,
        currency: 'EUR',
        description: 'EUR Cash',
      },
      otherAsset: {
        accountDescription: 'Account 2',
        accountId: 2,
        currency: 'EUR',
        description: 'EUR Cash',
      },
      date: new Date().toISOString(),
      description: 'Transfer EUR',
      fee: 0,
      type: TransactionType.CashTransfer,
      value: 50,
    });
    const transferFixture = TestBed.createComponent(TransactionViewComponent);
    const transferComp = transferFixture.componentInstance;
    transferComp.tx = transferTx;
    transferComp.transferTx = transferTx;
    transferFixture.detectChanges();

    expect(transferComp.transferTx).toBeTruthy();
    expect(transferComp.transactionTypeLabel).toBe('Cash Transfer');
    expect(transferComp.typeBadgeClass).toBe('transfer');
  });

  it('should return correct label and badge class for credit transactions', () => {
    const creditTx = new Transaction({
      asset: {
        accountDescription: 'Account 1',
        accountId: 1,
        currency: 'EUR',
        description: 'EUR Cash',
      },
      date: new Date().toISOString(),
      description: 'Salary',
      fee: 0,
      type: TransactionType.CreditCash,
      value: 1000,
    });
    const creditFixture = TestBed.createComponent(TransactionViewComponent);
    const creditComp = creditFixture.componentInstance;
    creditComp.tx = creditTx;
    creditComp.isCredit = true;
    creditFixture.detectChanges();

    expect(creditComp.transactionTypeLabel).toBe('Credit Cash');
    expect(creditComp.typeBadgeClass).toBe('credit');
  });
});
