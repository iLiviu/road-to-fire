import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LogDisplayDialogComponent } from './log-display-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LogDisplayDialogComponent', () => {
  let component: LogDisplayDialogComponent;
  let fixture: ComponentFixture<LogDisplayDialogComponent>;

  beforeEach(waitForAsync(() => {
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
      declarations: [LogDisplayDialogComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogDisplayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
