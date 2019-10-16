import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeableAssetListComponent } from './tradeable-asset-list.component';
import { MatListModule, MatProgressSpinnerModule, MatButtonModule, MatMenuModule, MatIconModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TradeableAssetListItemComponent } from '../tradeable-asset-list-item/tradeable-asset-list-item.component';

describe('TradeableAssetListComponent', () => {
  let component: TradeableAssetListComponent;
  let fixture: ComponentFixture<TradeableAssetListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
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
