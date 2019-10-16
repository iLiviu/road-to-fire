import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashAssetViewComponent } from './cash-asset-view.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { MatButtonModule, MatIconModule, MatDialogModule, MatDividerModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewAsset } from '../../models/view-asset';
import { SAMPLE_ACCOUNTS, SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';

const dialogData: ViewAsset = new ViewAsset(SAMPLE_ASSETS.EURCashAsset, SAMPLE_ACCOUNTS.account1);

describe('CashAssetViewComponent', () => {
  let component: CashAssetViewComponent;
  let fixture: ComponentFixture<CashAssetViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatDividerModule,
        NoopAnimationsModule,
      ],
      declarations: [
        CashAssetViewComponent,
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
    fixture = TestBed.createComponent(CashAssetViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
