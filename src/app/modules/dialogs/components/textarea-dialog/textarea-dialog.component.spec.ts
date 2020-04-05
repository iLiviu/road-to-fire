import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextareaDialogComponent } from './textarea-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TextareaDialogComponent', () => {
  let component: TextareaDialogComponent;
  let fixture: ComponentFixture<TextareaDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatInputModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatDialogModule,
        MatButtonModule,
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
      declarations: [TextareaDialogComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextareaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
