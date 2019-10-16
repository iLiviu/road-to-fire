import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatButtonModule, MatIconModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule,
  MatFormFieldModule, MatSelectModule, MatToolbarModule, MatInputModule, MatCheckboxModule, MatCardModule, MatProgressSpinnerModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { ManualQuoteComponent } from './manual-quote.component';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';

describe('ManualQuoteComponent', () => {
  let component: ManualQuoteComponent;
  let fixture: ComponentFixture<ManualQuoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatToolbarModule,
        MatInputModule,
        MatCheckboxModule,
        MatCardModule,
        MatProgressSpinnerModule,
      ],

      declarations: [
        ManualQuoteComponent,
        EditDialogComponent,
        CurrencySymbolPipe,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {}
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: []
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualQuoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
