import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashEditComponent } from './cash-edit.component';
import {
  MatButtonModule, MatIconModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule,
  MatDialogRef, MAT_DIALOG_DATA, MatSelectModule, MatToolbarModule, MatInputModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';
import { Asset } from '../../models/asset';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';

const dialogData: Asset = SAMPLE_ASSETS.EURCashAsset;

describe('CashEditComponent', () => {
  let component: CashEditComponent;
  let fixture: ComponentFixture<CashEditComponent>;

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
        CashEditComponent,
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
    fixture = TestBed.createComponent(CashEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
