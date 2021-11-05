import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AssetTradeComponent, AssetTradeData, AssetTradeAction } from './asset-trade.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { SwipeTabsDirective } from 'src/app/shared/directives/swipe-tabs.directive';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';
import { AssetType } from '../../models/asset';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const dialogData: AssetTradeData = {
  account: SAMPLE_ACCOUNTS.account1,
  assetType: AssetType.Stock,
  action: AssetTradeAction.BUY,
};

describe('AssetTradeComponent', () => {
  let component: AssetTradeComponent;
  let fixture: ComponentFixture<AssetTradeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatListModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatToolbarModule,
        MatDialogModule,
        NoopAnimationsModule,
      ],
      declarations: [AssetTradeComponent,
        EditDialogComponent,
        SwipeTabsDirective,
        CurrencySymbolPipe,
        FormatDatePipe,
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
    fixture = TestBed.createComponent(AssetTradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
