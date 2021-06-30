import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

import { TransactionType } from '../../models/transaction';
import { NumKeyDictionary } from 'src/app/shared/models/dictionary';

export interface TransactionFilters {
  includedTypes: NumKeyDictionary<boolean>;
  minDate: Date;
  maxDate: Date;
}

class FilterNode {
  children: FilterNode[];
  txType?: number;
  title: string;
}

/** Tree with all available transaction types */
const filtersTree: FilterNode[] = [
  {
    title: 'Credit',
    children: [
      { title: 'Bond Principal Payments', txType: TransactionType.PrincipalPayment, children: null },
      { title: 'Credit Cash', txType: TransactionType.CreditCash, children: null },
      { title: 'Dividends', txType: TransactionType.CashDividend, children: null },
      { title: 'Interest Payments', txType: TransactionType.CashInterest, children: null },
      { title: 'Sell', txType: TransactionType.Sell, children: null },
    ]
  },
  {
    title: 'Debit',
    children: [
      { title: 'Buy', txType: TransactionType.Buy, children: null },
      { title: 'Capital Cost', txType: TransactionType.CapitalCost, children: null },
      { title: 'Debit Cash', txType: TransactionType.DebitCash, children: null },
    ]
  },
  {
    title: 'Neutral',
    children: [
      { title: 'Exchange', txType: TransactionType.Exchange, children: null },
      { title: 'Asset Transfer', txType: TransactionType.Transfer, children: null },
      { title: 'Cash Transfer', txType: TransactionType.CashTransfer, children: null },
    ]
  },
];


/**
 * A dialog allowing the user to set filters for a list of transactions
 */
@Component({
  selector: 'app-transactions-filter-edit',
  templateUrl: './transactions-filter-edit.component.html',
  styleUrls: ['./transactions-filter-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsFilterEditComponent implements OnInit {

  checklistSelection: SelectionModel<FilterNode>;
  dataSource: MatTreeNestedDataSource<FilterNode>;
  filterForm: FormGroup;
  minDate: FormControl;
  maxDate: FormControl;
  todayDate: Date;
  treeControl: NestedTreeControl<FilterNode>;


  constructor(public dialogRef: MatDialogRef<TransactionsFilterEditComponent>,
    @Inject(MAT_DIALOG_DATA) public filters: TransactionFilters) {

    this.treeControl = new NestedTreeControl<FilterNode>(node => node.children);
    this.dataSource = new MatTreeNestedDataSource();
    this.dataSource.data = filtersTree;
  }

  ngOnInit() {
    this.checklistSelection = new SelectionModel<FilterNode>(true);
    this.todayDate = new Date();
    this.minDate = new FormControl(this.filters.minDate);
    this.maxDate = new FormControl(this.filters.maxDate);
    this.filterForm = new FormGroup({
      minDate: this.minDate,
      maxDate: this.maxDate,
    });

    this.selectInitialNodes();
  }

  hasChild = (index: number, nodeData: FilterNode) => nodeData.children;

  /**
   * Whether all the descendants of the node are selected.
   */
  descendantsAllSelected(node: FilterNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    return descAllSelected;
  }

  /**
   * Whether part of the descendants are selected
   */
  descendantsPartiallySelected(node: FilterNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /**
   * Toggle the item selection. Select/deselect all the descendants node
   */
  filterItemSelectionToggle(node: FilterNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    this.checkAllParentsSelection(node);
    this.filterForm.markAsDirty();
  }

  /**
   * Toggle a leaf item selection. Check all the parents to see if they changed
   */
  filterLeafItemSelectionToggle(node: FilterNode, userAction: boolean = true): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
    if (userAction) {
      this.filterForm.markAsDirty();
    }
  }

  /**
   * Checks all the parents when a leaf node is selected/unselected
   */
  checkAllParentsSelection(node: FilterNode): void {
    let parent: FilterNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /**
   * Check root node checked state and change it accordingly
   */
  checkRootNodeSelection(node: FilterNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /**
   * Get the parent node of a node
   */
  getParentNode(node: FilterNode): FilterNode | null {
    for (const parent of this.dataSource.data) {
      if (parent.children && parent.children.indexOf(node) >= 0) {
        return parent;
      }
    }
    return null;
  }


  /**
   * Actions to take when the user closed the dialog
   * @param saveData user requested data to be saved
   */
  dialogClosed(saveData: boolean) {
    if (saveData) {
      this.filters.includedTypes = {};
      for (const node of this.dataSource.data) {
        if (node.txType && this.checklistSelection.isSelected(node)) {
          this.filters.includedTypes[node.txType] = true;
        }
        for (const child of node.children) {
          if (this.checklistSelection.isSelected(child)) {
            this.filters.includedTypes[child.txType] = true;
          }
        }
      }
      this.filters.minDate = this.minDate.value ? new Date(this.minDate.value) : null;
      this.filters.maxDate = this.maxDate.value ? new Date(this.maxDate.value) : null;

      this.dialogRef.close(this.filters);
    } else {
      this.dialogRef.close(null);
    }
  }

  /**
   * Select the checkboxes for initially set filters
   */
  private selectInitialNodes() {
    const selectedNodes: FilterNode[] = [];
    for (const node of this.dataSource.data) {
      if (node.txType && this.filters.includedTypes[node.txType]) {
        this.filterLeafItemSelectionToggle(node, false);
      }
      for (const child of node.children) {
        if (this.filters.includedTypes[child.txType]) {
          this.filterLeafItemSelectionToggle(child, false);
        }
      }
    }
  }
}
