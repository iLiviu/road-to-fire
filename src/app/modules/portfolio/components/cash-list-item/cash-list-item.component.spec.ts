import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashListItemComponent } from './cash-list-item.component';
import { MatListModule, MatButtonModule, MatMenuModule, MatIconModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { ViewAsset } from '../../models/view-asset';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';

describe('CashListItemComponent', () => {
  let component: CashListItemComponent;
  let fixture: ComponentFixture<CashListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: AssetManagementService, useClass: MockAssetManagementService },
      ],
      declarations: [
        CashListItemComponent,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashListItemComponent);
    component = fixture.componentInstance;
    component.viewAsset = new ViewAsset(SAMPLE_ASSETS.EURCashAsset, SAMPLE_ACCOUNTS.account1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
