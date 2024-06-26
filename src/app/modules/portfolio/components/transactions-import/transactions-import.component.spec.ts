import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransactionsImportComponent } from './transactions-import.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewAsset } from '../../models/view-asset';
import { SAMPLE_ACCOUNTS, SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';

const dialogData: ViewAsset = new ViewAsset(SAMPLE_ASSETS.EURCashAsset, SAMPLE_ACCOUNTS.account1);

describe('TransactionsImportComponent', () => {
  let component: TransactionsImportComponent;
  let fixture: ComponentFixture<TransactionsImportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatDividerModule,
        NoopAnimationsModule,
      ],
      declarations: [
        TransactionsImportComponent,
        FormatDatePipe,
      ],
      providers: [
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
    fixture = TestBed.createComponent(TransactionsImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
