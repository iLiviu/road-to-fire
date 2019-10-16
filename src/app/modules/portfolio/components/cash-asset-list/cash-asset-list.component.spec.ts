import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashAssetListComponent } from './cash-asset-list.component';
import { DepositListItemComponent } from '../deposit-list-item/deposit-list-item.component';
import { CashListItemComponent } from '../cash-list-item/cash-list-item.component';
import {
  MatCardModule, MatMenuModule, MatIconModule, MatButtonModule, MatListModule, MatFormFieldModule, MatSelectModule
} from '@angular/material';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CashAssetListComponent', () => {
  let component: CashAssetListComponent;
  let fixture: ComponentFixture<CashAssetListComponent>;

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
      ],
      declarations: [
        CashAssetListComponent,
        CashListItemComponent,
        DepositListItemComponent,
        FormatDatePipe,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashAssetListComponent);
    component = fixture.componentInstance;
    component.assets = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
