import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CashAssetListComponent } from './cash-asset-list.component';
import { DepositListItemComponent } from '../deposit-list-item/deposit-list-item.component';
import { CashListItemComponent } from '../cash-list-item/cash-list-item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { AssetType } from '../../models/asset';
import { ViewAsset } from '../../models/view-asset';

describe('CashAssetListComponent', () => {
  let component: CashAssetListComponent;
  let fixture: ComponentFixture<CashAssetListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      declarations: [
        CashAssetListComponent,
        CashListItemComponent,
        DepositListItemComponent,
        FormatDatePipe,
      ],
      providers: [
        { provide: AssetManagementService, useClass: MockAssetManagementService }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashAssetListComponent);
    component = fixture.componentInstance;
    component.assets = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter by currency correctly', () => {
    const mockAssets: ViewAsset[] = [
      {
        asset: { id: '1', type: AssetType.Cash, currency: 'EUR', description: 'Checking EUR', amount: 1000 },
        account: { id: 'acc1', description: 'Bank A' },
        currentValue: 1000,
        initialValue: 1000,
        profitLoss: 0,
        profitLossPercent: 0
      } as unknown as ViewAsset,
      {
        asset: { id: '2', type: AssetType.Cash, currency: 'USD', description: 'Checking USD', amount: 500 },
        account: { id: 'acc2', description: 'Bank B' },
        currentValue: 500,
        initialValue: 500,
        profitLoss: 0,
        profitLossPercent: 0
      } as unknown as ViewAsset,
    ];

    component.assets = mockAssets;
    component.ngOnChanges({ assets: {} as any });
    fixture.detectChanges();

    expect(component.currencies).toEqual(['EUR', 'USD']);
    expect(component.filteredAssets.length).toBe(2);

    component.selectCurrency('EUR');
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].asset.currency).toBe('EUR');

    component.selectCurrency('ALL');
    expect(component.filteredAssets.length).toBe(2);
  });

  it('should sort assets by balance and name', () => {
    const mockAssets: ViewAsset[] = [
      {
        asset: { id: '1', type: AssetType.Cash, currency: 'EUR', description: 'Alpha', amount: 100 },
        account: { id: 'acc1', description: 'Bank A' },
        currentValue: 100,
      } as unknown as ViewAsset,
      {
        asset: { id: '2', type: AssetType.Cash, currency: 'EUR', description: 'Beta', amount: 500 },
        account: { id: 'acc2', description: 'Bank B' },
        currentValue: 500,
      } as unknown as ViewAsset,
    ];

    component.assets = mockAssets;
    component.ngOnChanges({ assets: {} as any });

    // Default sort is value desc
    expect(component.filteredAssets[0].asset.description).toBe('Beta');
    expect(component.filteredAssets[1].asset.description).toBe('Alpha');

    // Sort by name asc
    component.setSort('name');
    expect(component.filteredAssets[0].asset.description).toBe('Alpha');
    expect(component.filteredAssets[1].asset.description).toBe('Beta');
  });
});
