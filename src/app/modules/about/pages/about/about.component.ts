import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { APP_CONSTS } from 'src/app/config/app.constants';
import { Location } from '@angular/common';

/**
 * Component to display information about the app and the developer
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {

  APP_CONSTS = APP_CONSTS;


  constructor(private location: Location) { }

  ngOnInit() {
  }

  goBack() {
    this.location.back();
  }

}
