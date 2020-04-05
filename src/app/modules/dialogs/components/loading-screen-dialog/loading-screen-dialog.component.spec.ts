import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoadingScreenDialogComponent } from './loading-screen-dialog.component';

describe('LoadingScreenDialogComponent', () => {
  let component: LoadingScreenDialogComponent;
  let fixture: ComponentFixture<LoadingScreenDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatProgressSpinnerModule,
        NoopAnimationsModule,
        MatDialogModule,
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
      declarations: [LoadingScreenDialogComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingScreenDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
