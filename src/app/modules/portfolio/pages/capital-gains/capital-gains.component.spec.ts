import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CapitalGainsComponent } from './capital-gains.component';
import { LoggerService } from 'src/app/core/services/logger.service';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';
import { PortfolioService } from '../../services/portfolio.service';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { MockStorageService } from 'src/app/core/mocks/storage.service.mock';
import { StorageService } from 'src/app/core/services/storage.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { EventsService } from 'src/app/core/services/events.service';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { RefreshQuotesButtonComponent } from '../../components/refresh-quotes-button/refresh-quotes-button.component';
import { TopToolbarComponent } from '../../components/top-toolbar/top-toolbar.component';
import {
  MatListModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule,
  MatToolbarModule, MatBadgeModule, MatCardModule, MatSelectModule, MatFormFieldModule, MatTableModule, MatMenuModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

describe('CapitalGainsComponent', () => {
  let component: CapitalGainsComponent;
  let fixture: ComponentFixture<CapitalGainsComponent>;

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
        MatTableModule,
        FormsModule,
        ReactiveFormsModule,
        MatMenuModule,
      ],
      declarations: [
        CapitalGainsComponent,
        TopToolbarComponent,
        RefreshQuotesButtonComponent,
        NotificationsButtonComponent,
        FormatDatePipe,
      ],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: PortfolioService, useClass: MockPortfolioService },
        { provide: DialogsService, useClass: MockDialogsService },
        { provide: StorageService, useClass: MockStorageService },
        EventsService,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CapitalGainsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
