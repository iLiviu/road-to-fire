import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatButtonModule, MatIconModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule,
  MatFormFieldModule, MatSelectModule, MatToolbarModule, MatInputModule, MatCheckboxModule, MatCardModule, MatProgressSpinnerModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PaymentDateAddComponent, PaymentDateAddData, PaymentAmountType } from './payment-date-add.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';

const dialogData: PaymentDateAddData = {
  amountCaption: '',
  amountType: PaymentAmountType.Currency,
  currency: 'EUR',
  defaultAmount: 0,
  maturityDate: new Date(),
};

describe('PaymentDateAddComponent', () => {
  let component: PaymentDateAddComponent;
  let fixture: ComponentFixture<PaymentDateAddComponent>;

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
        MatProgressSpinnerModule,
      ],

      declarations: [
        PaymentDateAddComponent,
        CurrencySymbolPipe,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {}
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData,
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentDateAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
