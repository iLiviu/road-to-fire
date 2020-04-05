import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringTransactionsComponent } from './recurring-transactions.component';
import { TopToolbarComponent } from '../../components/top-toolbar/top-toolbar.component';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { RefreshQuotesButtonComponent } from '../../components/refresh-quotes-button/refresh-quotes-button.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { EventsService } from 'src/app/core/services/events.service';
import { MockStorageService } from 'src/app/core/mocks/storage.service.mock';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';
import { MockLoggerService } from 'src/app/core/mocks/loger.service.mock';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioService } from '../../services/portfolio.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecurringTransactionsListComponent } from '../../components/recurring-transactions-list/recurring-transactions-list.component';
import {
  RecurringTransactionsListItemComponent
} from '../../components/recurring-transactions-list-item/recurring-transactions-list-item.component';
import { AssetManagementService } from '../../services/asset-management.service';
import { MockAssetManagementService } from 'src/app/modules/dialogs/mocks/asset-management.service.mock';

describe('RecurringTransactionsComponent', () => {
  let component: RecurringTransactionsComponent;
  let fixture: ComponentFixture<RecurringTransactionsComponent>;

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
        MatSnackBarModule,
      ],
      declarations: [
        RecurringTransactionsComponent,
        TopToolbarComponent,
        RefreshQuotesButtonComponent,
        NotificationsButtonComponent,
        RecurringTransactionsListComponent,
        RecurringTransactionsListItemComponent,
        FormatDatePipe,
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
    fixture = TestBed.createComponent(RecurringTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
