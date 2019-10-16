import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatButtonModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InputDialogComponent } from './input-dialog.component';
import { FormsModule } from '@angular/forms';

describe('InputDialogComponent', () => {
  let component: InputDialogComponent;
  let fixture: ComponentFixture<InputDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        FormsModule,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {}
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: {}
        }
      ],
      declarations: [InputDialogComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
