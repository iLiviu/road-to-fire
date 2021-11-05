import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CashAssetListComponent } from './cash-asset-list.component';
import { DepositListItemComponent } from '../deposit-list-item/deposit-list-item.component';
import { CashListItemComponent } from '../cash-list-item/cash-list-item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CashAssetListComponent', () => {
  let component: CashAssetListComponent;
  let fixture: ComponentFixture<CashAssetListComponent>;

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
