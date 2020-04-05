import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountComponent } from './account.component';
import { TopToolbarComponent } from '../../components/top-toolbar/top-toolbar.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { LoggerService } from 'src/app/core/services/logger.service';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';
import { EventsService } from 'src/app/core/services/events.service';
import { PortfolioService } from '../../services/portfolio.service';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { MockStorageService } from 'src/app/core/mocks/storage.service.mock';
import { StorageService } from 'src/app/core/services/storage.service';
import { RefreshQuotesButtonComponent } from '../../components/refresh-quotes-button/refresh-quotes-button.component';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { SwipeTabsDirective } from 'src/app/shared/directives/swipe-tabs.directive';
import { TradeableAssetSumCardComponent } from '../../components/tradeable-asset-sum-card/tradeable-asset-sum-card.component';
import { CashBalancesCardComponent } from '../../components/cash-balances-card/cash-balances-card.component';
import { EcoFabSpeedDialModule } from '@ecodev/fab-speed-dial';
import { TransactionsListComponent } from '../../components/transactions-list/transactions-list.component';
import { CashAssetListComponent } from '../../components/cash-asset-list/cash-asset-list.component';
import { TradeableAssetListComponent } from '../../components/tradeable-asset-list/tradeable-asset-list.component';
import { TransactionsListItemComponent } from '../../components/transactions-list-item/transactions-list-item.component';
import { CashListItemComponent } from '../../components/cash-list-item/cash-list-item.component';
import { DepositListItemComponent } from '../../components/deposit-list-item/deposit-list-item.component';
import { TradeableAssetListItemComponent } from '../../components/tradeable-asset-list-item/tradeable-asset-list-item.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { FormsModule } from '@angular/forms';

describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatTabsModule,
        MatCheckboxModule,
        RouterTestingModule,
        MatDialogModule,
        EcoFabSpeedDialModule,
        FormsModule,
        MatToolbarModule,
        MatBadgeModule,
        MatCardModule,
        ScrollingModule,
        MatSelectModule,
        MatFormFieldModule,

      ],
      declarations: [
        AccountComponent,
        TopToolbarComponent,
        RefreshQuotesButtonComponent,
        NotificationsButtonComponent,
        SwipeTabsDirective,
        TradeableAssetSumCardComponent,
        CashBalancesCardComponent,
        TransactionsListComponent,
        TransactionsListItemComponent,
        CashAssetListComponent,
        CashListItemComponent,
        DepositListItemComponent,
        TradeableAssetListComponent,
        TradeableAssetListItemComponent,
        FormatDatePipe,
      ],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: AssetManagementService, useClass: MockAssetManagementService },
        { provide: StorageService, useClass: MockStorageService },
        EventsService,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
