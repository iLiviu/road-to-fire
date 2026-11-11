import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RecurringTransactionViewComponent } from './recurring-transaction-view.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { RecurringTransaction, RecurringTransactionType, RecurringTransactionData } from '../../models/recurring-transaction';
import { Transaction, TransactionType, TransactionData } from '../../models/transaction';
import { ExchangeTransaction, ExchangeTransactionData } from '../../models/exchange-transaction';
import { TransferTransaction } from '../../models/transfer-transaction';
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
        RecurringTransactionViewComponent,
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
    fixture = TestBed.createComponent(RecurringTransactionViewComponent);
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

  it('should configure properly for exchange recurring transaction', () => {
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
      description: 'Monthly Exchange',
      fee: 2,
      type: TransactionType.Exchange,
      value: 100,
      amount: 100,
      rate: 1.1,
    };
    const exchangeTx = new ExchangeTransaction(exchangeData);
    const recExchange = new RecurringTransaction({
      autoApprove: true,
      inactive: false,
      period: 1,
      transactionsLeft: 5,
      type: RecurringTransactionType.Monthly,
      tx: exchangeTx,
    });

    const exchangeFixture = TestBed.createComponent(RecurringTransactionViewComponent);
    const exchangeComp = exchangeFixture.componentInstance;
    exchangeComp.recTx = recExchange;
    exchangeComp.tx = exchangeTx;
    exchangeComp.exchangeTx = exchangeTx;
    exchangeFixture.detectChanges();

    expect(exchangeComp.exchangeTx).toBeTruthy();
    expect(exchangeComp.transactionTypeLabel).toBe('Exchange');
    expect(exchangeComp.typeBadgeClass).toBe('exchange');
  });

  it('should configure properly for transfer recurring transaction', () => {
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
      description: 'Weekly Transfer',
      fee: 0,
      type: TransactionType.CashTransfer,
      value: 50,
    });
    const recTransfer = new RecurringTransaction({
      autoApprove: false,
      inactive: false,
      period: 1,
      transactionsLeft: -1,
      type: RecurringTransactionType.Weekly,
      tx: transferTx,
    });

    const transferFixture = TestBed.createComponent(RecurringTransactionViewComponent);
    const transferComp = transferFixture.componentInstance;
    transferComp.recTx = recTransfer;
    transferComp.tx = transferTx;
    transferComp.transferTx = transferTx;
    transferFixture.detectChanges();

    expect(transferComp.transferTx).toBeTruthy();
    expect(transferComp.transactionTypeLabel).toBe('Cash Transfer');
    expect(transferComp.typeBadgeClass).toBe('transfer');
  });
});
