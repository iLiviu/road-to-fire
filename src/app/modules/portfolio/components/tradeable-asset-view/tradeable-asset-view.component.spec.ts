import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeableAssetViewComponent, TradeableAssetViewData } from './tradeable-asset-view.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { ViewAsset } from '../../models/view-asset';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';

const viewAsset = new ViewAsset(SAMPLE_ASSETS.stockAsset1, SAMPLE_ACCOUNTS.account1);
viewAsset.position = SAMPLE_ASSETS.stockAsset1.positions[0];
const dialogData: TradeableAssetViewData = {
  totalReturnStats: {
    capitalCosts: 0,
    dividends: 0,
    realizedGaines: 0,
    totalCost: 0,
    totalReturn: 0,
  },
  viewAsset: viewAsset,
};

describe('TradeableAssetViewComponent', () => {
  let component: TradeableAssetViewComponent;
  let fixture: ComponentFixture<TradeableAssetViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
        MatIconModule,
      ],
      declarations: [
        TradeableAssetViewComponent,
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
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeableAssetViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
