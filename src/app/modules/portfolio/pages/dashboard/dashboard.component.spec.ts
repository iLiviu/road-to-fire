import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardComponent } from './dashboard.component';
import { TopToolbarComponent } from '../../components/top-toolbar/top-toolbar.component';
import { RefreshQuotesButtonComponent } from '../../components/refresh-quotes-button/refresh-quotes-button.component';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import {
  MatListModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule,
  MatToolbarModule, MatBadgeModule, MatCardModule, MatSelectModule, MatFormFieldModule, MatMenuModule, MatGridListModule
} from '@angular/material';
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
import { EventsService } from 'src/app/core/services/events.service';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { ResponsiveColsDirective } from 'src/app/shared/directives/responsive-cols.directive';
import { ChartsModule } from 'ng2-charts';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async(() => {
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
        ChartsModule,
      ],
      declarations: [
        DashboardComponent,
        TopToolbarComponent,
        RefreshQuotesButtonComponent,
        NotificationsButtonComponent,
        FormatDatePipe,
        ResponsiveColsDirective,
      ],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: StorageService, useClass: MockStorageService },
        { provide: AssetManagementService, useClass: MockAssetManagementService },
        EventsService,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
