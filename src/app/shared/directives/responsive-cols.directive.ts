import { Directive, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatGridList } from '@angular/material';
import { MediaChange, MediaObserver } from '@angular/flex-layout';

export interface IResponsiveColumnsMap {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

// Usage: <mat-grid-list [responsiveCols]="{xs: 2, sm: 2, md: 4, lg: 6, xl: 8}">
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[responsiveCols]'
})
export class ResponsiveColsDirective implements OnInit {
  @Output() colsChanged = new EventEmitter<number>();


  public get cols(): IResponsiveColumnsMap {
    return this.countBySize;
  }

  @Input('responsiveCols')
  public set cols(map: IResponsiveColumnsMap) {
    if (map && ('object' === (typeof map))) {
      this.countBySize = map;
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

    this.media.media$
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
