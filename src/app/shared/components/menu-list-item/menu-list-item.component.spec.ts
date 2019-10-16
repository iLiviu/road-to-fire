import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuListItemComponent } from './menu-list-item.component';
import { MatIconModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { NavItem } from '../../models/nav-item';

const navItem: NavItem = {
  title: 'item',
};

describe('MenuListItemComponent', () => {
  let component: MenuListItemComponent;
  let fixture: ComponentFixture<MenuListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        RouterTestingModule,
      ],
      declarations: [MenuListItemComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuListItemComponent);
    component = fixture.componentInstance;
    component.item = navItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
