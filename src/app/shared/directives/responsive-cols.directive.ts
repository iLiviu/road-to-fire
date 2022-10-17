import { Directive, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatGridList } from '@angular/material/grid-list';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { filter, map } from 'rxjs/operators';

export interface IResponsiveColumnsMap {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

// Usage: <mat-grid-list [responsiveCols]="{xs: 2, sm: 2, md: 4, lg: 6, xl: 8}">
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[responsiveCols]'
})
export class ResponsiveColsDirective implements OnInit {
  @Output() colsChanged = new EventEmitter<number>();


  public get cols(): IResponsiveColumnsMap {
    return this.countBySize;
  }

  @Input('responsiveCols')
  public set cols(colsMap: IResponsiveColumnsMap) {
    if (colsMap && ('object' === (typeof colsMap))) {
      this.countBySize = colsMap;
    }
  }

  private countBySize: IResponsiveColumnsMap = { xs: 2, sm: 2, md: 4, lg: 6, xl: 8 };

  public constructor(
    private grid: MatGridList,
    private media: MediaObserver
  ) {
    this.initializeColsCount();
  }

  public ngOnInit(): void {
    this.initializeColsCount();

    this.media.asObservable()
      .pipe(
        filter((changes: MediaChange[]) => changes.length > 0),
        map((changes: MediaChange[]) => changes[0])
      )
      .subscribe((changes: MediaChange) => {
        if (this.countBySize[changes.mqAlias] !== this.grid.cols) {
          this.setGridCols(this.countBySize[changes.mqAlias]);
        }
      });
  }

  private initializeColsCount(): void {
    Object.keys(this.countBySize).some(
      (mqAlias: string): boolean => {
        const isActive = this.media.isActive(mqAlias);

        if (isActive) {
          this.setGridCols(this.countBySize[mqAlias]);
        }

        return isActive;
      });
  }

  private setGridCols(count: number) {
    this.grid.cols = count;
    this.colsChanged.emit(this.grid.cols);
  }
}
