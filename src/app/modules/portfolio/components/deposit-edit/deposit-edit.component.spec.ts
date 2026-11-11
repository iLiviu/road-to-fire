import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DepositEditComponent, DepositEditData } from './deposit-edit.component';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
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
import { SAMPLE_ACCOUNTS, SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';

const dialogData: DepositEditData = {
  account: SAMPLE_ACCOUNTS.account1,
  asset: SAMPLE_ASSETS.depositAsset1,
};

describe('DepositEditComponent', () => {
  let component: DepositEditComponent;
  let fixture: ComponentFixture<DepositEditComponent>;

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
        DepositEditComponent,
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
    fixture = TestBed.createComponent(DepositEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate gross amount and interest correctly', () => {
    component.amount.setValue(1000);
    component.interestRate.setValue(5);
    component.creationDate.setValue(new Date(2026, 0, 1));
    component.maturityDate.setValue(new Date(2027, 0, 1));
    component.withholdInterestTax.setValue(true);
    component.interestTaxRate.setValue(10);
    fixture.detectChanges();

    expect(component.grossAmount).toBe(1000);
    expect(component.termDays).toBe(365);
    expect(component.estGrossInterest).toBe(50);
    expect(component.estPayableInterest).toBe(45);
  });

  it('should render form rows and summary card', () => {

    const summaryCard = fixture.debugElement.query(By.css('.order-summary-card'));
    expect(summaryCard).toBeTruthy();

    const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
    expect(formRows.length).toBeGreaterThanOrEqual(4);
  });
});
