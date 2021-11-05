import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PortfolioRootComponent } from './portfolio-root.component';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterTestingModule } from '@angular/router/testing';
import { MenuListItemComponent } from 'src/app/shared/components/menu-list-item/menu-list-item.component';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { PortfolioService } from '../../services/portfolio.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { MockAuthService } from 'src/app/core/mocks/auth.service.mock';
import { StorageService } from 'src/app/core/services/storage.service';
import { MockStorageService } from 'src/app/core/mocks/storage.service.mock';
import { EventsService } from 'src/app/core/services/events.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';

describe('PortfolioRootComponent', () => {
  let component: PortfolioRootComponent;
  let fixture: ComponentFixture<PortfolioRootComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
      declarations: [
        PortfolioRootComponent,
        MenuListItemComponent,
      ],
      providers: [
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: StorageService, useClass: MockStorageService },
        { provide: LoggerService, useClass: MockLoggerService },
        EventsService,

      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortfolioRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
