import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

/**
 * Component to display the outer layer of an Edit dialog.
 * If viewing from a handset device, the content will be formatted for a fullscreen display,
 * otherwise a desktop like dialog format will be used
 */
@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.css'],
})
export class EditDialogComponent implements OnInit, OnDestroy {

  // tslint:disable-next-line:no-input-rename
  @Input('form') editForm: UntypedFormGroup;
  @Input() title: string;
  @Output() close = new EventEmitter<boolean>();
  isHandset: boolean;

  private subscription: Subscription;

  constructor(private dialogsService: DialogsService, private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.subscription = this.breakpointObserver.observe([Breakpoints.Small, Breakpoints.XSmall])
      .subscribe((state) => {
        this.isHandset = state.matches;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  save() {
    this.close.emit(true);
  }

  /**
   * Called when user tries to close the dialog without saving.
   * If there are any unsaved changes, make user confirm that he wants to discard them.
   */
  async cancel() {
    let canClose = true;
    if (this.editForm.dirty) {
      canClose = await this.dialogsService.confirm('Your changes have not been saved. Discard changes?', 'Discard changes');
    }
    if (canClose) {
      this.close.emit(false);
    }
  }

}
