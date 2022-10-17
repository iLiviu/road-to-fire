import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyComponent {

  constructor(private location: Location) { }


  goBack() {
    this.location.back();
  }

}
