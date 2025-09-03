import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'cc-date-range-dialog',
  standalone: true,
  imports: [MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
  <h2 mat-dialog-title>Seleccionar rango personalizado</h2>
  <div mat-dialog-content class="flex items-center space-x-4">
    <mat-form-field appearance="fill">
      <mat-label>Inicio</mat-label>
      <input matInput [matDatepicker]="pickerStart" [(ngModel)]="start">
      <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
      <mat-datepicker #pickerStart></mat-datepicker>
    </mat-form-field>
    <mat-form-field appearance="fill">
      <mat-label>Fin</mat-label>
      <input matInput [matDatepicker]="pickerEnd" [(ngModel)]="end">
      <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
      <mat-datepicker #pickerEnd></mat-datepicker>
    </mat-form-field>
  </div>
  <div mat-dialog-actions class="flex justify-end space-x-2">
    <button mat-button (click)="dialogRef.close()">Cancelar</button>
    <button mat-flat-button color="primary" (click)="save()" [disabled]="!start || !end">Guardar</button>
  </div>
  `
})
export class DateRangeDialogComponent {
  start: Date;
  end: Date;
  constructor(
    public dialogRef: MatDialogRef<DateRangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { start: Date; end: Date }
  ) {
    this.start = data.start;
    this.end = data.end;
  }
  save(): void {
    this.dialogRef.close({ start: this.start, end: this.end });
  }
}
