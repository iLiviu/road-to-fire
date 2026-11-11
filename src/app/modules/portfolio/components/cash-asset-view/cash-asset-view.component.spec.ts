import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CashAssetViewComponent } from './cash-asset-view.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewAsset } from '../../models/view-asset';
import { SAMPLE_ACCOUNTS, SAMPLE_ASSETS } from '../../mocks/sample-accounts.mock';

const dialogData: ViewAsset = new ViewAsset(SAMPLE_ASSETS.EURCashAsset, SAMPLE_ACCOUNTS.account1);

describe('CashAssetViewComponent', () => {
  let component: CashAssetViewComponent;
  let fixture: ComponentFixture<CashAssetViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatDividerModule,
        MatTooltipModule,
        MatChipsModule,
        NoopAnimationsModule,
      ],
      declarations: [
        CashAssetViewComponent,
        FormatDatePipe,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close')
          }
        }, {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashAssetViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with cash asset', () => {
    expect(component).toBeTruthy();
    expect(component.isDeposit).toBeFalse();
    expect(component.displayName).toBe(SAMPLE_ASSETS.EURCashAsset.description);
  });

  it('should copy to clipboard and provide temporary feedback', () => {
    spyOn(component, 'copyToClipboard').and.callThrough();
    component.copyToClipboard('Test text');
    expect(component.copied).toBeTrue();
  });

  it('should close dialog when cancel is called', () => {
    component.cancel();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should correctly configure for deposit asset', () => {
    const depositView = new ViewAsset(SAMPLE_ASSETS.depositAsset1, SAMPLE_ACCOUNTS.account1);
    const depositFixture = TestBed.createComponent(CashAssetViewComponent);
    const depositComp = depositFixture.componentInstance;
    depositComp.viewAsset = depositView;
    depositComp.ngOnInit();
    depositFixture.detectChanges();

    expect(depositComp.isDeposit).toBeTrue();
    expect(depositComp.deposit).toBeTruthy();
    expect(depositComp.payableInterest).not.toBeNull();
  });
});
