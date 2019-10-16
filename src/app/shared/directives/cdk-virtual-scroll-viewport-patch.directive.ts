import { Directive, Self, OnInit, OnDestroy, Inject } from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { debounceTime, takeUntil } from 'rxjs/operators';

/**
 * Directive that patches CdkVirtualScrollViewport so it adjusts it's size properly when window is resized.
 */
@Directive({
  /* tslint:disable-next-line:directive-selector */
  selector: 'cdk-virtual-scroll-viewport',
})
export class CdkVirtualScrollViewportPatchDirective implements OnInit, OnDestroy {
  protected readonly destroy$ = new Subject();

  constructor(
    @Self() @Inject(CdkVirtualScrollViewport) private readonly viewportComponent: CdkVirtualScrollViewport,
  ) { }

  ngOnInit() {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(10),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.viewportComponent.checkViewportSize())
      ;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
