import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectorRef } from '@angular/core';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

import { DashboardGridTileEditorComponent } from './dashboard-grid-tile-editor.component';
import { PortfolioService } from '../../services/portfolio.service';
import { DashboardGridTiles } from '../../models/dashboard-grid-tiles';

class MockPortfolioService {
  getLabelCategories() {
    return Promise.resolve([
      { id: 1, name: 'Sectors' },
      { id: 2, name: 'Risk Levels' }
    ]);
  }
}

describe('DashboardGridTileEditorComponent', () => {
  let component: DashboardGridTileEditorComponent;
  let fixture: ComponentFixture<DashboardGridTileEditorComponent>;
  let mockGridVisibility: { [key: string]: boolean };

  beforeEach(waitForAsync(() => {
    mockGridVisibility = {
      [DashboardGridTiles.Stats]: true,
      [DashboardGridTiles.Goals]: true,
      [DashboardGridTiles.PortfolioHistory]: true,
      [DashboardGridTiles.PerformanceBenchmark]: false,
    };

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatDialogModule,
        MatSlideToggleModule,
        MatIconModule,
        MatTooltipModule,
        MatToolbarModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      declarations: [DashboardGridTileEditorComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: mockGridVisibility },
        { provide: PortfolioService, useClass: MockPortfolioService },
        ChangeDetectorRef
      ]
    }).compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(DashboardGridTileEditorComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize standard categories and load dynamic label categories', () => {
    expect(component.categories.length).toBeGreaterThanOrEqual(5);

    const labelCategory = component.categories.find(c => c.id === 'labels');
    expect(labelCategory).toBeTruthy();
    expect(labelCategory.items.length).toBe(2);
    expect(labelCategory.items[0].label).toContain('Sectors');
  });

  it('should filter items by search query', () => {
    component.searchQuery = 'benchmark';
    const perfCategory = component.categories.find(c => c.id === 'performance');
    const filtered = component.getFilteredItems(perfCategory);

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(DashboardGridTiles.PerformanceBenchmark);

    component.clearSearch();
    expect(component.searchQuery).toBe('');
    expect(component.getFilteredItems(perfCategory).length).toBe(3);
  });

  it('should correctly detect when search returns no results', () => {
    component.searchQuery = 'nonexistentxyz123';
    expect(component.isSearchEmpty()).toBeTrue();

    component.searchQuery = 'stocks';
    expect(component.isSearchEmpty()).toBeFalse();
  });

  it('should toggle a single tile', () => {
    const initialState = !!mockGridVisibility[DashboardGridTiles.Stats];
    const tileItem = { id: DashboardGridTiles.Stats, label: 'Stats', icon: 'account_balance_wallet' };

    component.toggleTile(tileItem);
    expect(mockGridVisibility[DashboardGridTiles.Stats]).toBe(!initialState);

    component.onToggleChange(tileItem, true);
    expect(mockGridVisibility[DashboardGridTiles.Stats]).toBeTrue();
  });

  it('should toggle an entire category', () => {
    const overviewCategory = component.categories.find(c => c.id === 'overview');
    overviewCategory.items.forEach(i => mockGridVisibility[i.id] = true);
    expect(component.isCategoryAllActive(overviewCategory)).toBeTrue();

    component.toggleCategory(overviewCategory);
    expect(component.isCategoryAllActive(overviewCategory)).toBeFalse();
    overviewCategory.items.forEach(i => expect(mockGridVisibility[i.id]).toBeFalse());

    component.toggleCategory(overviewCategory);
    expect(component.isCategoryAllActive(overviewCategory)).toBeTrue();
    overviewCategory.items.forEach(i => expect(mockGridVisibility[i.id]).toBeTrue());
  });

  it('should perform batch selectAll and clearAll', () => {
    component.clearAll();
    expect(component.getTotalActiveCount()).toBe(0);

    component.selectAll();
    expect(component.getTotalActiveCount()).toBe(component.getTotalTilesCount());
  });
});
