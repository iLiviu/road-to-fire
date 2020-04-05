import { Directive, HostListener, AfterViewInit, Input } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import * as Hammer from 'hammerjs';


const EDGE_SIZE = 16;

interface SwipeTabsConfig {
  hasSideNav: boolean;
}

/**
 * Directive for providing swipe gestures for Angular Material tabs.
 *
 * An optional configuration object can be passed as the value to the
 * directive attribute, with the following property:
 *      - `hasSideNav`: if true, avoid performing a right swipe, if user
 *         swiped from the edge of the screen. This is useful when a sideNav
 *         is present and opens with a swipe gesture.
 */
@Directive({
  /* tslint:disable-next-line:directive-selector */
  selector: '[swipeTabs]'
})
export class SwipeTabsDirective implements AfterViewInit {
  @Input('swipeTabs') config: SwipeTabsConfig;
  ngAfterViewInit(): void {
    // register for swipe events on all tabs
    for (let i = 0; i < this.tabGroup._tabs.length; i++) {
      const matTabBodyEl = document.getElementById(this.tabGroup._getTabContentId(i));
      const elements = matTabBodyEl.getElementsByClassName('mat-tab-body-content');
      if (elements.length > 0) {
        const tabBodyContentEl = elements[0];
        const hammertime = new Hammer(tabBodyContentEl, {});

        // no need to do any action, event is sent to parent
        hammertime.on('swiperight', (ev) => {
        });
        hammertime.on('swipeleft', (ev) => {
        });
      } else {
        throw new Error('Unsupported angular material version');
      }
    }
    if (!this.config) {
      this.config = {
        hasSideNav: false,
      };
    }
  }

  constructor(private tabGroup: MatTabGroup) {

  }

  @HostListener('swipeleft', ['$event'])
  onSwipeleft(event: any) {
    if (this.tabGroup.selectedIndex + 1 <= this.tabGroup._tabs.length - 1) {
      this.tabGroup.selectedIndex += 1;
    }
  }

  @HostListener('swiperight', ['$event'])
  onSwiperight(event: any) {
    let canSwitch: boolean;
    if (this.config.hasSideNav) {
      // prevent tab change if swiped from edge of the screen (user intended to open sideNav)
      const startX = event.changedPointers[0].screenX - event.deltaX;
      canSwitch = (startX >= EDGE_SIZE);
    } else {
      canSwitch = true;
    }
    if (canSwitch) {
      if (this.tabGroup.selectedIndex - 1 >= 0) {
        this.tabGroup.selectedIndex -= 1;
      }
    }
  }

}
