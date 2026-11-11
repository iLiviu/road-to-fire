import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { TradeableAssetViewComponent, TradeableAssetViewData } from './tradeable-asset-view.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { ViewAsset } from '../../models/view-asset';
import { AssetType } from '../../models/asset';
import { BondAsset } from '../../models/bond-asset';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';

const viewAsset = new ViewAsset(SAMPLE_ASSETS.stockAsset1, SAMPLE_ACCOUNTS.account1);
viewAsset.position = SAMPLE_ASSETS.stockAsset1.positions[0];
const dialogData: TradeableAssetViewData = {
  totalReturnStats: {
    capitalCosts: 0,
    dividends: 0,
    realizedGaines: 0,
    totalCost: 100,
    totalReturn: 120,
  },
  viewAsset: viewAsset,
};

describe('TradeableAssetViewComponent', () => {
  let component: TradeableAssetViewComponent;
  let fixture: ComponentFixture<TradeableAssetViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      declarations: [
        TradeableAssetViewComponent,
        FormatDatePipe,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close'),
          }
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData
        }
      ],
    })
      .compileComponents();

    const iconRegistry = TestBed.inject(MatIconRegistry);
    const sanitizer = TestBed.inject(DomSanitizer);
    iconRegistry.addSvgIconLiteral('certificate', sanitizer.bypassSecurityTrustHtml('<svg></svg>'));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeableAssetViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.displayName).toBe(SAMPLE_ASSETS.stockAsset1.description);
    expect(component.assetTypeLabel).toBe('Stock');
    expect(component.typeBadgeClass).toBe('stock');
    expect(component.totalPL).toBe(20);
    expect(component.totalPLPercent).toBe(0.2);
  });

  it('should copy to clipboard and provide temporary feedback', () => {
    spyOn(component, 'copyToClipboard').and.callThrough();
    component.copyToClipboard('Test text');
    expect(component.copied).toBeTrue();
  });

  it('should close dialog when cancel is called', () => {
    component.cancel();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should configure properly for bond asset', () => {
    const bondAsset = new BondAsset({ ...SAMPLE_ASSETS.bondAsset1, type: AssetType.Bond });
    const bondView = new ViewAsset(bondAsset, SAMPLE_ACCOUNTS.account1);
    bondView.position = bondAsset.positions[0];
    const bondFixture = TestBed.createComponent(TradeableAssetViewComponent);
    const bondComp = bondFixture.componentInstance;
    bondComp.data = {
      totalReturnStats: {
        capitalCosts: 0,
        dividends: 0,
        realizedGaines: 0,
        totalCost: 50,
        totalReturn: 60,
      },
      viewAsset: bondView,
    };
    bondComp.ngOnInit();
    bondFixture.detectChanges();

    expect(bondComp.bondAsset).toBeTruthy();
    expect(bondComp.assetTypeLabel).toBe('Bond');
    expect(bondComp.typeBadgeClass).toBe('bond');
  });
});
