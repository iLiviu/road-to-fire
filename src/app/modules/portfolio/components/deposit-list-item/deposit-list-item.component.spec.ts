import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositListItemComponent } from './deposit-list-item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { ViewAsset } from '../../models/view-asset';
import { SAMPLE_ASSETS, SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';

describe('DepositListItemComponent', () => {
  let component: DepositListItemComponent;
  let fixture: ComponentFixture<DepositListItemComponent>;

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
        DepositListItemComponent,
        FormatDatePipe
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositListItemComponent);
    component = fixture.componentInstance;
    component.viewAsset = new ViewAsset(SAMPLE_ASSETS.depositAsset1, SAMPLE_ACCOUNTS.account1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
