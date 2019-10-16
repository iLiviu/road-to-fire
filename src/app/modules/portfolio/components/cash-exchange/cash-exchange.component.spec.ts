import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashExchangeComponent, CashExchangeData } from './cash-exchange.component';
import {
  MatButtonModule, MatIconModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatSelectModule,
  MatToolbarModule, MatInputModule, MatDialogRef, MAT_DIALOG_DATA
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';

const dialogData: CashExchangeData = {
  account: SAMPLE_ACCOUNTS.account1,
  sourceAsset: SAMPLE_ACCOUNTS.account1.assets[0],
};

describe('CashExchangeComponent', () => {
  let component: CashExchangeComponent;
  let fixture: ComponentFixture<CashExchangeComponent>;

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
    fixture = TestBed.createComponent(CashExchangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
