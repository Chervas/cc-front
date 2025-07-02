import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
// import { HistorialDeServiciosListComponent } from './historial_de_servicios/list/historial_de_servicios_list.component';  // Eliminado

@NgModule({
  // Eliminar la declaración y exportación de HistorialDeServiciosListComponent
  // declarations: [
  //   HistorialDeServiciosListComponent,
  // ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressBarModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatButtonToggleModule,
    MatSnackBarModule,
  ],
  // Eliminar la exportación de HistorialDeServiciosListComponent
  // exports: [
  //   HistorialDeServiciosListComponent,
  // ]
})
export class VentasModule { }
