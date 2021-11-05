import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificationsButtonComponent } from './notifications-button.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { PortfolioService } from '../../services/portfolio.service';
import { EventsService } from 'src/app/core/services/events.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';

describe('NotificationsButtonComponent', () => {
  let component: NotificationsButtonComponent;
  let fixture: ComponentFixture<NotificationsButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        MatBadgeModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: AssetManagementService, useClass: MockAssetManagementService },
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: LoggerService, useClass: MockLoggerService },
        EventsService,
        MatSnackBar,
      ],
      declarations: [NotificationsButtonComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
