import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CashFundComponent, CashFundData } from './cash-fund.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';
import { TransactionType } from '../../models/transaction';
import { Asset, AssetType } from '../../models/asset';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { AbsoluteValuePipe } from 'src/app/shared/pipes/absolute-value.pipe';

const dialogData: CashFundData = {
  asset: SAMPLE_ASSETS.EURCashAsset,
  transactionType: TransactionType.CreditCash,
};

describe('CashFundComponent', () => {
  let component: CashFundComponent;
  let fixture: ComponentFixture<CashFundComponent>;

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
        CashFundComponent,
        RecurringTransactionInputComponent,
        EditDialogComponent,
        CurrencySymbolPipe,
        AbsoluteValuePipe,
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
    fixture = TestBed.createComponent(CashFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate gross and total transaction value correctly', () => {
    component.amount.setValue(100);
    component.fee.setValue(5);
    fixture.detectChanges();

    expect(component.grossAmount).toBe(100);
    // For Credit: amount - fee = 95
    expect(component.totalTransactionValue).toBe(95);

    // Switch to Debit
    component.isCreditTx = false;
    fixture.detectChanges();

    // For Debit: amount + fee = 105
    expect(component.totalTransactionValue).toBe(105);
  });

  it('should render form rows, position pill, and summary card', () => {
    const positionPill = fixture.debugElement.query(By.css('.position-info-pill'));
    expect(positionPill).toBeTruthy();

    const summaryCard = fixture.debugElement.query(By.css('.order-summary-card'));
    expect(summaryCard).toBeTruthy();

    const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
    expect(formRows.length).toBeGreaterThanOrEqual(2);
  });

  describe('balance validators', () => {
    it('should invalidate amount when crediting causes balance to fall below 0', () => {
      // Balance is 0
      component.data.asset = SAMPLE_ASSETS.EURCashAsset2;
      component.data.transactionType = TransactionType.CreditCash;
      component.isCreditTx = true;
      component.ngOnInit();

      // Amount = 1, Fee = 2 => newBalance = 0 + 1 - 2 = -1 < 0
      component.amount.setValue(1);
      component.fee.setValue(2);
      component.amount.markAsDirty();
      fixture.detectChanges();

      expect(component.amount.errors?.invalidRange).toBeTrue();
      expect(component.assetForm.valid).toBeFalse();

      // Amount = 2, Fee = 2 => newBalance = 0 + 2 - 2 = 0 >= 0
      component.amount.setValue(2);
      fixture.detectChanges();

      expect(component.amount.errors).toBeNull();
      expect(component.assetForm.valid).toBeTrue();
    });

    it('should invalidate amount when debiting causes balance to fall below 0', () => {
      // Balance is 0
      component.data.asset = SAMPLE_ASSETS.EURCashAsset2;
      component.data.transactionType = TransactionType.DebitCash;
      component.isCreditTx = false;
      component.ngOnInit();

      // Amount = 1, Fee = 2 => newBalance = 0 - 1 - 2 = -3 < 0
      component.amount.setValue(1);
      component.fee.setValue(2);
      component.amount.markAsDirty();
      fixture.detectChanges();

      expect(component.amount.errors?.invalidRange).toBeTrue();
      expect(component.assetForm.valid).toBeFalse();

      // Amount = 1, Fee = 0 => newBalance = 0 - 1 - 0 = -1 < 0
      component.fee.setValue(0);
      fixture.detectChanges();

      expect(component.amount.errors?.invalidRange).toBeTrue();
      expect(component.assetForm.valid).toBeFalse();
    });

    it('should validate correctly when debiting an account with positive balance', () => {
      // Balance is 10
      component.data.asset = SAMPLE_ASSETS.EURCashAsset;
      component.data.transactionType = TransactionType.DebitCash;
      component.isCreditTx = false;
      component.ngOnInit();

      // Amount = 8, Fee = 2 => newBalance = 10 - 8 - 2 = 0 >= 0
      component.amount.setValue(8);
      component.fee.setValue(2);
      fixture.detectChanges();

      expect(component.amount.errors).toBeNull();
      expect(component.assetForm.valid).toBeTrue();

      // Amount = 9, Fee = 2 => newBalance = 10 - 9 - 2 = -1 < 0
      component.amount.setValue(9);
      fixture.detectChanges();

      expect(component.amount.errors?.invalidRange).toBeTrue();
      expect(component.assetForm.valid).toBeFalse();
    });

    it('should validate correctly when crediting an account with positive balance', () => {
      // Balance is 10
      component.data.asset = SAMPLE_ASSETS.EURCashAsset;
      component.data.transactionType = TransactionType.CreditCash;
      component.isCreditTx = true;
      component.ngOnInit();

      // Amount = 1, Fee = 2 => newBalance = 10 + 1 - 2 = 9 >= 0
      component.amount.setValue(1);
      component.fee.setValue(2);
      fixture.detectChanges();

      expect(component.amount.errors).toBeNull();
      expect(component.assetForm.valid).toBeTrue();

      // Amount = 1, Fee = 12 => newBalance = 10 + 1 - 12 = -1 < 0
      component.fee.setValue(12);
      fixture.detectChanges();

      expect(component.amount.errors?.invalidRange).toBeTrue();
      expect(component.assetForm.valid).toBeFalse();
    });

    it('should re-validate amount when fee changes', () => {
      component.data.asset = SAMPLE_ASSETS.EURCashAsset2; // balance 0
      component.data.transactionType = TransactionType.CreditCash;
      component.isCreditTx = true;
      component.ngOnInit();

      component.amount.setValue(1);
      component.fee.setValue(0);
      fixture.detectChanges();

      expect(component.amount.errors).toBeNull();

      // Increasing fee causes resulting balance to fall below 0
      component.fee.setValue(2);
      fixture.detectChanges();

      expect(component.amount.errors?.invalidRange).toBeTrue();
      expect(component.assetForm.valid).toBeFalse();
    });

    it('should correctly validate debt assets', () => {
      const debtAsset = new Asset({
        amount: -100,
        id: 99,
        currency: 'EUR',
        description: 'Debt',
        type: AssetType.Debt,
      });

      // Debt Credit: paying off debt cannot exceed 0
      component.data.asset = debtAsset;
      component.data.transactionType = TransactionType.CreditCash;
      component.isCreditTx = true;
      component.ngOnInit();

      component.amount.setValue(105);
      component.fee.setValue(5);
      fixture.detectChanges();
      // newBalance = -100 + 105 - 5 = 0 <= 0 -> valid
      expect(component.amount.errors).toBeNull();

      component.amount.setValue(110);
      fixture.detectChanges();
      // newBalance = -100 + 110 - 5 = 5 > 0 -> invalid
      expect(component.amount.errors?.invalidRange).toBeTrue();

      // Debt Debit: borrowing more money is valid as long as amount is positive
      component.data.transactionType = TransactionType.DebitCash;
      component.isCreditTx = false;
      component.ngOnInit();

      component.amount.setValue(50);
      component.fee.setValue(5);
      fixture.detectChanges();
      expect(component.amount.errors).toBeNull();
    });
  });
});
