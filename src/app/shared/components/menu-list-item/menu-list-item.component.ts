import { Component, HostBinding, Input, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { NavItem } from '../../models/nav-item';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EventsService, AppEventType } from 'src/app/core/services/events.service';

@Component({
  selector: 'app-menu-list-item',
  templateUrl: './menu-list-item.component.html',
  styleUrls: ['./menu-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ])
  ]
})
export class MenuListItemComponent implements OnInit, OnDestroy {
  expanded = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item: NavItem;
  @Input() depth: number;

  private componentDestroyed$ = new Subject();

  constructor(public router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef,
    private eventsService: EventsService) {

    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit() {
    // we need to listen to navigation events to determine the active route
    this.router.events
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((val) => {
        if (val instanceof NavigationEnd) {
          this.cdr.markForCheck();
        }
      });

    this.eventsService.events$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(
        event => {
          switch (event.type) {
            case AppEventType.MENU_UPDATED:
              this.cdr.markForCheck();
              break;
          }
        });

  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  isRouteActive(item): boolean {
    return this.router.isActive(this.router.createUrlTree([item.path], { relativeTo: this.route }).toString(), true);
  }

  onItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      if (item.path) {
        this.router.navigate([item.path], { relativeTo: this.route });
      }
    }
    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
  }
}
