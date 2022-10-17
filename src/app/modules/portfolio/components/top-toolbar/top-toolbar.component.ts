import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import { EventsService } from 'src/app/core/services/events.service';

/**
 * Displays a toolbar that should be placed at the top of a page.
 * Custom buttons can be added inside the container.
 */
@Component({
  selector: 'app-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopToolbarComponent {

  @Input() pageTitle: string;

  constructor(private eventsService: EventsService) { }

  toggleSideNav() {
    this.eventsService.toggleSideNav();
  }

}
