import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionsListComponent } from './transactions-list.component';
import { TransactionsListItemComponent } from '../transactions-list-item/transactions-list-item.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatIconModule, MatButtonModule, MatListModule, MatProgressSpinnerModule, MatToolbarModule, MatCheckboxModule
} from '@angular/material';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { MockPortfolioService } from '../../mocks/portfolio.service.mock';

describe('TransactionsListComponent', () => {
  let component: TransactionsListComponent;
  let fixture: ComponentFixture<TransactionsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatToolbarModule,
        MatCheckboxModule,
        NoopAnimationsModule,
        FormsModule,
        ScrollingModule,
        MatProgressSpinnerModule,
      ],
      declarations: [
        TransactionsListComponent,
        TransactionsListItemComponent,
        FormatDatePipe,
      ],
      providers: [
        { provide: PortfolioService, useClass: MockPortfolioService }
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionsListComponent);
    component = fixture.componentInstance;
    component.transactions = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
