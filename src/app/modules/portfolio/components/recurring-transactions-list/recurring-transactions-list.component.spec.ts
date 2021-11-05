import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { RecurringTransactionsListComponent } from './recurring-transactions-list.component';
import { RecurringTransactionsListItemComponent } from '../recurring-transactions-list-item/recurring-transactions-list-item.component';

describe('RecurringTransactionsListComponent', () => {
  let component: RecurringTransactionsListComponent;
  let fixture: ComponentFixture<RecurringTransactionsListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule,
        MatProgressSpinnerModule,
      ],
      declarations: [
        RecurringTransactionsListComponent,
        RecurringTransactionsListItemComponent,
        FormatDatePipe,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecurringTransactionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
