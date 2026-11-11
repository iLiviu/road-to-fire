import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TradeableAssetListComponent } from './tradeable-asset-list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TradeableAssetListItemComponent } from '../tradeable-asset-list-item/tradeable-asset-list-item.component';

describe('TradeableAssetListComponent', () => {
  let component: TradeableAssetListComponent;
  let fixture: ComponentFixture<TradeableAssetListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        MatTooltipModule,
        NoopAnimationsModule,
        MatListModule,
        MatProgressSpinnerModule
      ],
      declarations: [
        TradeableAssetListComponent,
        TradeableAssetListItemComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeableAssetListComponent);
    component = fixture.componentInstance;
    component.assets = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
