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
});
