import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatCardModule, MatMenuModule, MatIconModule, MatButtonModule, MatListModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { RecurringTransactionsListComponent } from './recurring-transactions-list.component';
import { RecurringTransactionsListItemComponent } from '../recurring-transactions-list-item/recurring-transactions-list-item.component';

describe('RecurringTransactionsListComponent', () => {
  let component: RecurringTransactionsListComponent;
  let fixture: ComponentFixture<RecurringTransactionsListComponent>;

  beforeEach(async(() => {
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
