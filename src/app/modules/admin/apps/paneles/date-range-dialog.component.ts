import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'cc-date-range-dialog',
  standalone: true,
  imports: [MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    // Adaptador que parsea correctamente dd/MM/yyyy al escribir a mano
    { provide: DateAdapter, useClass: class EsDateAdapter extends NativeDateAdapter {
        override getFirstDayOfWeek() { return 1; }
        override parse(value: any): Date | null {
          if (typeof value === 'string') {
            const v = value.trim();
            const m = v.match(/^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/);
            if (m) {
              const day = +m[1]; const month = +m[2]; const year = +m[3];
              const d = new Date(year, month - 1, day);
              return isNaN(d.getTime()) ? null : d;
            }
          }
          return super.parse(value);
        }
        override format(date: Date, displayFormat: Object): string {
          const dd = ('0' + date.getDate()).slice(-2);
          const mm = ('0' + (date.getMonth() + 1)).slice(-2);
          const yyyy = date.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        }
      }
    },
    { provide: MAT_DATE_FORMATS, useValue: {
      parse: { dateInput: 'dd/MM/yyyy' },
      display: {
        dateInput: 'dd/MM/yyyy',
        monthYearLabel: 'MMM yyyy',
        dateA11yLabel: 'dd/MM/yyyy',
        monthYearA11yLabel: 'MMMM yyyy'
      }
    } }
  ],
  template: `
  <h2 mat-dialog-title>Seleccionar rango personalizado</h2>
  <div mat-dialog-content class="flex items-center space-x-4">
    <mat-form-field appearance="fill">
      <mat-label>Inicio</mat-label>
      <input matInput [matDatepicker]="pickerStart" [(ngModel)]="start" placeholder="dd/MM/aaaa">
      <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
      <mat-datepicker #pickerStart></mat-datepicker>
    </mat-form-field>
    <mat-form-field appearance="fill">
      <mat-label>Fin</mat-label>
      <input matInput [matDatepicker]="pickerEnd" [(ngModel)]="end" placeholder="dd/MM/aaaa">
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
    @Inject(MAT_DIALOG_DATA) public data: { start: Date; end: Date },
    private _adapter: DateAdapter<Date>
  ) {
    try {
      // Registrar datos de localización y fijar locale del date adapter
      registerLocaleData(localeEs);
      this._adapter.setLocale('es-ES');
    } catch {}
    this.start = data.start;
    this.end = data.end;
  }
  save(): void {
    this.dialogRef.close({ start: this.start, end: this.end });
  }
}
