import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashFundComponent, CashFundData } from './cash-fund.component';
import {
  MatButtonModule, MatIconModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule,
  MatSelectModule, MatToolbarModule, MatInputModule, MatDialogRef, MAT_DIALOG_DATA, MatCheckboxModule, MatCardModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';
import { TransactionType } from '../../models/transaction';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { AbsoluteValuePipe } from 'src/app/shared/pipes/absolute-value.pipe';

const dialogData: CashFundData = {
  asset: SAMPLE_ASSETS.EURCashAsset,
  transactionType: TransactionType.CreditCash,
};

describe('CashFundComponent', () => {
  let component: CashFundComponent;
  let fixture: ComponentFixture<CashFundComponent>;

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
    fixture = TestBed.createComponent(CashFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
