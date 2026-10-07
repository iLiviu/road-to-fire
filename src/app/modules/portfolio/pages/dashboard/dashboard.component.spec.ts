import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick, waitForAsync } from '@angular/core/testing';

import { DashboardComponent } from './dashboard.component';
import { TopToolbarComponent } from '../../components/top-toolbar/top-toolbar.component';
import { RefreshQuotesButtonComponent } from '../../components/refresh-quotes-button/refresh-quotes-button.component';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LoggerService } from 'src/app/core/services/logger.service';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';
import { PortfolioService } from '../../services/portfolio.service';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { MockStorageService } from 'src/app/core/mocks/storage.service.mock';
import { AppEventType, EventsService } from 'src/app/core/services/events.service';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { ResponsiveColsDirective } from 'src/app/shared/directives/responsive-cols.directive';
import { NgChartsModule, ThemeService } from 'ng2-charts';
import { SAMPLE_ACCOUNTS } from '../../mocks/sample-accounts.mock';
import { ConfigService } from 'src/app/core/services/config.service';
import { MockConfigService } from 'src/app/core/mocks/config.service.mock';
import { BenchmarkService } from '../../services/benchmark.service';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-top-toolbar',
  template: '<ng-content></ng-content>'
})
class MockTopToolbarComponent {
  @Input() pageTitle: string;
}

@Component({
  selector: 'app-refresh-quotes-button',
  template: ''
})
class MockRefreshQuotesButtonComponent { }

@Component({
  selector: 'app-notifications-button',
  template: ''
})
class MockNotificationsButtonComponent { }

class MockBenchmarkService {
  getAvailableBenchmarks() {
    return [];
  }
  computePortfolioFullTWR() {
    return Promise.resolve([]);
  }
  getHistoricalPrices() {
    return Promise.resolve([]);
  }
  computeBenchmarkFullTWR() {
    return [];
  }
  normalizeToTimeFrame(s: any) {
    return s;
  }
  calculateAnnualizedTWR(s: any) {
    return null;
  }
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let portfolioService: MockPortfolioService;
  let eventsService: EventsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
        MatProgressSpinnerModule,
        RouterTestingModule,
        MatDialogModule,
        MatToolbarModule,
        MatBadgeModule,
        MatCardModule,
        MatSelectModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatMenuModule,
        MatGridListModule,
        MatSnackBarModule,
        NgChartsModule,
      ],
      declarations: [
        DashboardComponent,
        MockTopToolbarComponent,
        MockRefreshQuotesButtonComponent,
        MockNotificationsButtonComponent,
        FormatDatePipe,
        ResponsiveColsDirective,
      ],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: StorageService, useClass: MockStorageService },
        { provide: AssetManagementService, useClass: MockAssetManagementService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: BenchmarkService, useClass: MockBenchmarkService },
        ThemeService,
        EventsService,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    portfolioService = TestBed.inject(PortfolioService) as any;
    eventsService = TestBed.inject(EventsService);

    // Mock getStoredTheme
    const configService = TestBed.inject(ConfigService);
    (configService as any).getStoredTheme = () => 'light';
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load accounts and compute stats on init', fakeAsync(() => {
    spyOn(portfolioService, 'getAccounts').and.callThrough();
    fixture.detectChanges(); // triggers initialization
    tick(5000); // wait for loadData and all stats async calls

    expect(portfolioService.getAccounts).toHaveBeenCalled();
    expect(component.accounts.length).toBeGreaterThan(0);
    expect(component.portfolioValue).toBeGreaterThan(0);
    discardPeriodicTasks();
  }));

  it('should reload data when asset or account is updated (debounced)', fakeAsync(() => {
    fixture.detectChanges();
    tick(5000);

    spyOn(portfolioService, 'getAccounts').and.callThrough();

    eventsService.assetUpdated(SAMPLE_ACCOUNTS.account1.assets[0].id);
    eventsService.accountUpdated(SAMPLE_ACCOUNTS.account1.id);

    // Should not have called yet due to debounce(1000)
    tick(500);
    expect(portfolioService.getAccounts).not.toHaveBeenCalled();

    tick(1000); // Wait long enough for debounce
    fixture.detectChanges();
    tick();
    expect(portfolioService.getAccounts).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should handle errors when loading data', fakeAsync(() => {
    spyOn(portfolioService, 'getAccounts').and.returnValue(Promise.reject('API Error'));
    const loggerSpy = spyOn(TestBed.inject(LoggerService), 'error');

    fixture.detectChanges();
    tick();

    expect(loggerSpy).toHaveBeenCalledWith('Could not retrieve accounts!', 'API Error');
    expect(component.dataLoading).toBeFalse();
    discardPeriodicTasks();
  }));

  it('should calculate FI progress correctly', fakeAsync(() => {
    portfolioService.config.goals = [{ title: 'FI', value: 1000000 }];
    fixture.detectChanges();
    tick();

    const expectedProgress = (component.portfolioValue / 1000000) * 100;
    expect(component.goals[0].data[0]).toBeCloseTo(expectedProgress, 0);
    discardPeriodicTasks();
  }));

  it('should correctly set isConfigLoaded', fakeAsync(() => {
    // Before initialization, it should be false
    expect((component as any).isConfigLoaded()).toBeFalsy();

    fixture.detectChanges(); // triggers ngOnInit -> readConfig()
    tick(); // wait for readConfig async flow

    expect((component as any).isConfigLoaded()).toBeTrue();
  }));
});
