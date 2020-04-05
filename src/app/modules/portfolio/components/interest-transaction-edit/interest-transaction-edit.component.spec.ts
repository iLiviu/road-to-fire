import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { InterestTransactionEditComponent, InterestTxEditData } from './interest-transaction-edit.component';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { InterestTransactionData, InterestTransaction } from '../../models/interest-transaction';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';
import { TransactionType } from '../../models/transaction';

const txData: InterestTransactionData = {
  asset: {
    accountDescription: SAMPLE_ACCOUNTS.account1.description,
    accountId: SAMPLE_ACCOUNTS.account1.id,
    currency: SAMPLE_ASSETS.EURCashAsset.currency,
    id: SAMPLE_ASSETS.EURCashAsset.id,
    description: SAMPLE_ASSETS.EURCashAsset.description,
  },
  otherAsset: {
    accountDescription: SAMPLE_ACCOUNTS.account1.description,
    accountId: SAMPLE_ACCOUNTS.account1.id,
    currency: SAMPLE_ASSETS.bondAsset1.currency,
    id: SAMPLE_ASSETS.bondAsset1.id,
    description: SAMPLE_ASSETS.bondAsset1.description,
  },
  date: new Date().toISOString(),
  description: 'interest tx',
  fee: 0,
  type: TransactionType.CashInterest,
  value: 1,
};
const dialogData: InterestTxEditData = {
  tx: new InterestTransaction(txData),
  account: SAMPLE_ACCOUNTS.account1,
};

describe('InterestTransactionEditComponent', () => {
  let component: InterestTransactionEditComponent;
  let fixture: ComponentFixture<InterestTransactionEditComponent>;

  beforeEach(async(() => {
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
        InterestTransactionEditComponent,
        EditDialogComponent,
        CurrencySymbolPipe,
      ],
      providers: [
        { provide: DialogsService, useClass: MockDialogsService },
        {
          provide: MatDialogRef,
          useValue: {}
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterestTransactionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
