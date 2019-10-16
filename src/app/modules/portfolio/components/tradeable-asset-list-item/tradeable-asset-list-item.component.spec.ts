import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeableAssetListItemComponent } from './tradeable-asset-list-item.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatMenuModule, MatIconModule, MatListModule } from '@angular/material';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { ViewAsset } from '../../models/view-asset';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';

describe('TradeableAssetListItemComponent', () => {
  let component: TradeableAssetListItemComponent;
  let fixture: ComponentFixture<TradeableAssetListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        NoopAnimationsModule,
        MatListModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: AssetManagementService, useClass: MockAssetManagementService },
      ],
      declarations: [TradeableAssetListItemComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeableAssetListItemComponent);
    component = fixture.componentInstance;
    component.viewAsset = new ViewAsset(SAMPLE_ASSETS.stockAsset1, SAMPLE_ACCOUNTS.account1);
    component.viewAsset.position = SAMPLE_ASSETS.stockAsset1.positions[0];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
