import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CashExchangeComponent, CashExchangeData } from './cash-exchange.component';
import { MatButtonModule } from '@angular/material/button';
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
import { SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';
import { Asset, AssetType } from '../../models/asset';

const destAsset = new Asset({
  currency: 'USD',
  description: 'USD Cash',
  id: 99,
  amount: 500,
  type: AssetType.Cash,
});

const dialogData: CashExchangeData = {
  account: SAMPLE_ACCOUNTS.account1,
  sourceAsset: SAMPLE_ACCOUNTS.account1.assets[0],
};

describe('CashExchangeComponent', () => {
  let component: CashExchangeComponent;
  let fixture: ComponentFixture<CashExchangeComponent>;

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
      ],
      declarations: [
        CashExchangeComponent,
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
    fixture = TestBed.createComponent(CashExchangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate credited amount correctly', () => {
    component.destinationAsset.setValue(destAsset);
    component.amount.setValue(100);
    component.rate.setValue(1.1);
    component.fee.setValue(5);
    fixture.detectChanges();

    // debtFlag is 0 for cash, so (100 - 0) * 1.1 = 110
    expect(component.creditedAmount).toBe(110);
  });

  it('should render form rows, position pill, and summary card when destination is selected', () => {
    const positionPill = fixture.debugElement.query(By.css('.position-info-pill'));
    expect(positionPill).toBeTruthy();

    const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
    expect(formRows.length).toBeGreaterThanOrEqual(3);

    // Summary card only visible when destination is selected
    component.destinationAsset.setValue(destAsset);
    fixture.detectChanges();

    const summaryCard = fixture.debugElement.query(By.css('.order-summary-card'));
    expect(summaryCard).toBeTruthy();
  });
});
