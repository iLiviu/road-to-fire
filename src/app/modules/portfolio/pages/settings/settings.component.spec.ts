import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatListModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatToolbarModule, MatBadgeModule, MatCardModule,
  MatSelectModule, MatFormFieldModule, MatMenuModule, MatDialogModule, MatTabsModule, MatCheckboxModule,
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SettingsComponent } from './settings.component';
import { TopToolbarComponent } from '../../components/top-toolbar/top-toolbar.component';
import { LoggerService } from 'src/app/core/services/logger.service';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { MockStorageService } from 'src/app/core/mocks/storage.service.mock';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { AssetManagementService } from '../../services/asset-management.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { PortfolioService } from '../../services/portfolio.service';
import { EventsService } from 'src/app/core/services/events.service';
import { SwipeTabsDirective } from 'src/app/shared/directives/swipe-tabs.directive';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { MockAppStorageService } from 'src/app/core/mocks/app-storage.service.mock';
import { AppStorageService } from 'src/app/core/services/app-storage.service';
import { MockConfigService } from 'src/app/core/mocks/config.service.mock';
import { ConfigService } from 'src/app/core/services/config.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
        MatProgressSpinnerModule,
        RouterTestingModule,
        MatToolbarModule,
        MatBadgeModule,
        MatCardModule,
        MatSelectModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatMenuModule,
        MatDialogModule,
        MatTabsModule,
        MatCheckboxModule,
      ],
      declarations: [
        SettingsComponent,
        TopToolbarComponent,
        SwipeTabsDirective,
        CurrencySymbolPipe,
      ],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: StorageService, useClass: MockStorageService },
        { provide: AppStorageService, useClass: MockAppStorageService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: AssetManagementService, useClass: MockAssetManagementService },
        EventsService,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
