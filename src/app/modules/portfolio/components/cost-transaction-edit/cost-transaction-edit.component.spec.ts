import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CostTransactionEditComponent, CostTransactionEditData } from './cost-transaction-edit.component';
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
        CostTransactionEditComponent,
        RecurringTransactionInputComponent,
        EditDialogComponent,
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
    fixture = TestBed.createComponent(CostTransactionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate gross and total cost value correctly', () => {
    component.amount.setValue(250);
    component.fee.setValue(15);
    fixture.detectChanges();

    expect(component.grossAmount).toBe(250);
    expect(component.totalCostValue).toBe(265);
  });

  it('should render form rows, and summary card', () => {

    const summaryCard = fixture.debugElement.query(By.css('.order-summary-card'));
    expect(summaryCard).toBeTruthy();

    const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
    expect(formRows.length).toBeGreaterThanOrEqual(2);
  });
});
