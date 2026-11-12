import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AssetTransferComponent, AssetTransferData } from './asset-transfer.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { SAMPLE_ACCOUNTS, SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';
import { Asset, AssetType } from '../../models/asset';
import { PortfolioAccount } from '../../models/portfolio-account';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';

const dialogData: AssetTransferData = {
  accounts: [SAMPLE_ACCOUNTS.account1, SAMPLE_ACCOUNTS.account2],
  sourceAccount: SAMPLE_ACCOUNTS.account1,
  sourceAsset: SAMPLE_ASSETS.EURCashAsset,
  sourcePosition: null,
};

describe('AssetTransferComponent', () => {
  let component: AssetTransferComponent;
  let fixture: ComponentFixture<AssetTransferComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogModule,
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatToolbarModule,
      ],
      declarations: [
        AssetTransferComponent,
        EditDialogComponent,
        RecurringTransactionInputComponent,
        CurrencySymbolPipe,
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
    fixture = TestBed.createComponent(AssetTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate gross and total transfer value correctly', () => {
    component.amount.setValue(5);
    component.fee.setValue(1);
    fixture.detectChanges();

    expect(component.grossAmount).toBe(5);
    expect(component.totalTransferValue).toBe(6);
  });

  it('should render form rows, position pill, and summary card', () => {
    const positionPill = fixture.debugElement.query(By.css('.position-info-pill'));
    expect(positionPill).toBeTruthy();

    const summaryCard = fixture.debugElement.query(By.css('.order-summary-card'));
    expect(summaryCard).toBeTruthy();

    const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
    expect(formRows.length).toBeGreaterThanOrEqual(3);
  });

  it('should populate destination cash assets on destination account change', () => {
    component.destinationAccount.setValue(SAMPLE_ACCOUNTS.account2);
    fixture.detectChanges();

    expect(component.destinationCashAssets.length).toBe(1);
    expect(component.destinationAsset.value).toBe(SAMPLE_ASSETS.EURCashAsset2);
  });

  describe('amountValidator', () => {
    const createComponentWithData = (sourceAsset: Asset, destAssets: Asset[] = []) => {
      const sourceAccount = new PortfolioAccount({
        id: 10,
        description: 'Source Account',
        assets: [sourceAsset],
      });
      const destAccount = new PortfolioAccount({
        id: 20,
        description: 'Dest Account',
        assets: destAssets,
      });
      const customData: AssetTransferData = {
        accounts: [sourceAccount, destAccount],
        sourceAccount,
        sourceAsset,
        sourcePosition: null,
      };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          FormsModule,
          ReactiveFormsModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatCheckboxModule,
          MatButtonModule,
          MatDatepickerModule,
          MatNativeDateModule,
          MatDialogModule,
          NoopAnimationsModule,
          MatCardModule,
          MatIconModule,
          MatToolbarModule,
        ],
        declarations: [
          AssetTransferComponent,
          EditDialogComponent,
          RecurringTransactionInputComponent,
          CurrencySymbolPipe,
        ],
        providers: [
          { provide: DialogsService, useClass: MockDialogsService },
          { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
          { provide: MAT_DIALOG_DATA, useValue: customData },
        ],
      });
      const localFixture = TestBed.createComponent(AssetTransferComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
      return { localFixture, localComponent };
    };

    it('should validate Cash -> Cash transfers including fee and floating point edge cases', () => {
      const cashSource = new Asset({ id: 1, amount: 100.3, currency: 'EUR', description: 'Cash', type: AssetType.Cash });
      const cashDest = new Asset({ id: 2, amount: 50, currency: 'EUR', description: 'Cash 2', type: AssetType.Cash });
      const { localComponent } = createComponentWithData(cashSource, [cashDest]);

      localComponent.destinationAsset.setValue(cashDest);
      localComponent.fee.setValue(0.1);

      localComponent.amount.setValue(100.2);
      expect(localComponent.amount.valid).toBeTrue();

      localComponent.amount.setValue(100.21);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(0);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(-5);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(null);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(Number.NaN);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();
    });

    it('should validate Cash -> Debt transfers so debt ending balance stays <= 0 and cash >= 0', () => {
      const cashSource = new Asset({ id: 1, amount: 500, currency: 'EUR', description: 'Cash', type: AssetType.Cash });
      const cashDest = new Asset({ id: 2, amount: 0, currency: 'EUR', description: 'Cash 2', type: AssetType.Cash });
      const debtDest = new Asset({ id: 3, amount: -200, currency: 'EUR', description: 'Debt', type: AssetType.Debt });
      const zeroDebtDest = new Asset({ id: 4, amount: 0, currency: 'EUR', description: 'Zero Debt', type: AssetType.Debt });
      const { localComponent } = createComponentWithData(cashSource, [cashDest, debtDest, zeroDebtDest]);

      // Start on Cash -> Cash with 300 (valid), then switch to Debt(-200) -> becomes invalid
      localComponent.destinationAsset.setValue(cashDest);
      localComponent.amount.setValue(300);
      expect(localComponent.amount.valid).toBeTrue();

      localComponent.destinationAsset.setValue(debtDest);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      // Exact payoff (-200 + 200 = 0) is valid
      localComponent.amount.setValue(200);
      expect(localComponent.amount.valid).toBeTrue();

      // Fee reduces available source cash below debt balance
      localComponent.fee.setValue(350);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();
      localComponent.amount.setValue(150);
      expect(localComponent.amount.valid).toBeTrue();

      // Zero-balance debt cannot receive cash
      localComponent.fee.setValue(0);
      localComponent.destinationAsset.setValue(zeroDebtDest);
      localComponent.amount.setValue(1);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();
    });

    it('should validate Debt -> Debt transfers allowing max negative balance and ignoring fee on source', () => {
      const debtSource = new Asset({ id: 1, amount: -500, currency: 'EUR', description: 'Debt 1', type: AssetType.Debt });
      const debtDest = new Asset({ id: 2, amount: -200, currency: 'EUR', description: 'Debt 2', type: AssetType.Debt });
      const { localComponent } = createComponentWithData(debtSource, [debtDest]);

      localComponent.destinationAsset.setValue(debtDest);
      localComponent.fee.setValue(50);

      localComponent.amount.setValue(-500);
      expect(localComponent.amount.valid).toBeTrue();

      localComponent.amount.setValue(-100);
      expect(localComponent.amount.valid).toBeTrue();

      localComponent.amount.setValue(-500.01);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(0);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(100);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();
    });

    it('should reject all Debt -> Debt transfers when source debt balance is 0', () => {
      const zeroDebtSource = new Asset({ id: 1, amount: 0, currency: 'EUR', description: 'Debt 1', type: AssetType.Debt });
      const debtDest = new Asset({ id: 2, amount: -200, currency: 'EUR', description: 'Debt 2', type: AssetType.Debt });
      const { localComponent } = createComponentWithData(zeroDebtSource, [debtDest]);

      localComponent.destinationAsset.setValue(debtDest);

      localComponent.amount.setValue(-1);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(0);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(1);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();
    });

    it('should validate Debt -> Cash transfers allowing any positive amount with no max limit', () => {
      const debtSource = new Asset({ id: 1, amount: -100, currency: 'EUR', description: 'Debt 1', type: AssetType.Debt });
      const cashDest = new Asset({ id: 2, amount: 50, currency: 'EUR', description: 'Cash', type: AssetType.Cash });
      const { localComponent } = createComponentWithData(debtSource, [cashDest]);

      localComponent.destinationAsset.setValue(cashDest);
      localComponent.fee.setValue(25);

      localComponent.amount.setValue(1000000);
      expect(localComponent.amount.valid).toBeTrue();

      localComponent.amount.setValue(0.01);
      expect(localComponent.amount.valid).toBeTrue();

      localComponent.amount.setValue(0);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(-50);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();
    });

    it('should allow Debt -> Cash even when source debt balance is 0', () => {
      const zeroDebtSource = new Asset({ id: 1, amount: 0, currency: 'EUR', description: 'Debt 1', type: AssetType.Debt });
      const cashDest = new Asset({ id: 2, amount: 0, currency: 'EUR', description: 'Cash', type: AssetType.Cash });
      const { localComponent } = createComponentWithData(zeroDebtSource, [cashDest]);

      localComponent.destinationAsset.setValue(cashDest);

      localComponent.amount.setValue(500);
      expect(localComponent.amount.valid).toBeTrue();

      localComponent.amount.setValue(0);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();

      localComponent.amount.setValue(-10);
      expect(localComponent.amount.hasError('invalidRange')).toBeTrue();
    });
  });
});
