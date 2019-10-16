import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatMenuModule, MatIconModule, MatBadgeModule, MatDialogModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RefreshQuotesButtonComponent } from './refresh-quotes-button.component';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';
import { EventsService } from 'src/app/core/services/events.service';
import { PortfolioService } from '../../services/portfolio.service';

describe('RefreshQuotesButtonComponent', () => {
  let component: RefreshQuotesButtonComponent;
  let fixture: ComponentFixture<RefreshQuotesButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        MatBadgeModule,
        NoopAnimationsModule,
        MatDialogModule,
      ],
      providers: [
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: LoggerService, useClass: MockLoggerService },
        EventsService,
      ],
      declarations: [RefreshQuotesButtonComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RefreshQuotesButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
