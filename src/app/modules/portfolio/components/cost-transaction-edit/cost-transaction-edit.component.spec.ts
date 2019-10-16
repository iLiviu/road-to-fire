import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CostTransactionEditComponent, CostTransactionEditData } from './cost-transaction-edit.component';
import {
  MatButtonModule, MatIconModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule,
  MatFormFieldModule, MatSelectModule, MatToolbarModule, MatInputModule, MatCheckboxModule, MatCardModule, MatDialogRef, MAT_DIALOG_DATA
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecurringTransactionInputComponent } from '../recurring-transaction-input/recurring-transaction-input.component';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { SAMPLE_ACCOUNTS, SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';

const dialogData: CostTransactionEditData = {
  account: SAMPLE_ACCOUNTS.account1,
  asset: SAMPLE_ASSETS.REAsset1,
};

describe('CostTransactionEditComponent', () => {
  let component: CostTransactionEditComponent;
  let fixture: ComponentFixture<CostTransactionEditComponent>;

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
        CostTransactionEditComponent,
        RecurringTransactionInputComponent,
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
    fixture = TestBed.createComponent(CostTransactionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
