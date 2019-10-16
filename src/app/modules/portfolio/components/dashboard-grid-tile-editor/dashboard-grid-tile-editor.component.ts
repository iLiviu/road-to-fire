import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Dictionary, NumKeyDictionary } from 'src/app/shared/models/dictionary';
import { DashboardGridTiles, DashboardGridTilesLabels } from '../../models/dashboard-grid-tiles';


/**
 * A dialog allowing the user to select which dashboard charts should be visible
 */
@Component({
  selector: 'app-dashboard-grid-tile-editor',
  templateUrl: './dashboard-grid-tile-editor.component.html',
  styleUrls: ['./dashboard-grid-tile-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardGridTileEditorComponent implements OnInit {

  gridTilesLabels = [];
  readonly DashboardGridTiles = DashboardGridTiles;
  readonly DashboardGridTileKeys = Object.keys(DashboardGridTiles);

  constructor(public dialogRef: MatDialogRef<DashboardGridTileEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public gridVisibility: Dictionary<boolean>) { }


  ngOnInit() {
    // sort the tiles list alphabetically
    this.gridTilesLabels = Object.entries(DashboardGridTilesLabels).sort((a: any, b: any) => a[1].localeCompare(b[1]));
  }



}
