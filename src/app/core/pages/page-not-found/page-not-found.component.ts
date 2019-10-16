import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

/**
 * View to be displayed whenever user navigates to a non-existing path
 */
@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageNotFoundComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
