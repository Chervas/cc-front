import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Paciente } from '../pacientes.types';
import { PacientesService } from '../pacientes.service';
import { FormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PacientesListComponent } from '../list/list.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
  selector: 'pacientes-details',
  templateUrl: './details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, MatTooltipModule]
})
export class PacientesDetailsComponent implements OnInit, OnDestroy {
  paciente: Paciente;
  pacienteForm: UntypedFormGroup;
  editMode: boolean = false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _pacientesService: PacientesService,
    private _formBuilder: FormBuilder,
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _pacientesListComponent: PacientesListComponent,
    private _changeDetectorRef: ChangeDetectorRef,
    private _fuseConfirmationService: FuseConfirmationService
  ) {}

  ngOnInit(): void {
    this._activatedRoute.paramMap.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this._pacientesService.getPacienteById(id).subscribe((paciente: Paciente) => {
          this.paciente = paciente;
          this._buildForm();
          this._changeDetectorRef.detectChanges();
          this._pacientesListComponent.matDrawer.open();
        });
      }
    });
  }

  private _buildForm(): void {
    this.pacienteForm = this._formBuilder.group({
      nombre: [this.paciente?.nombre, Validators.required],
      apellidos: [this.paciente?.apellidos, Validators.required],
      email: [this.paciente?.email],
      telefono_movil: [this.paciente?.telefono_movil, Validators.required],
      alergias: [this.paciente?.alergias]
    });
  }

  toggleEditMode(editMode: boolean | null = null): void {
    this.editMode = editMode === null ? !this.editMode : editMode;
    this._changeDetectorRef.detectChanges();
  }

  updatePaciente(): void {
    if (this.pacienteForm.invalid) {
      return;
    }
    const pacienteData = { ...this.paciente, ...this.pacienteForm.getRawValue() };
    this._pacientesService.updatePaciente(this.paciente.id_paciente, pacienteData).subscribe({
      next: (updatedPaciente) => {
        this.paciente = updatedPaciente;
        this.toggleEditMode(false);
        this._snackBar.open('Paciente actualizado', 'Cerrar', { duration: 3000 });
        this._changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error actualizando paciente:', error);
        this._snackBar.open('Error actualizando paciente', 'Cerrar', { duration: 5000 });
      }
    });
  }

  onDeletePaciente(): void {
    const confirmation = this._fuseConfirmationService.open({
      title: 'Eliminar paciente',
      message: '¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer.',
      actions: {
        confirm: { label: 'Eliminar' },
        cancel: { label: 'Cancelar' }
      }
    });
    confirmation.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this._pacientesService.deletePaciente(this.paciente.id_paciente).subscribe({
          next: () => {
            this._snackBar.open('Paciente eliminado', 'Cerrar', { duration: 3000 });
            this._router.navigate(['/pacientes']);
          },
          error: (error) => {
            console.error('Error eliminando paciente:', error);
            this._snackBar.open('Error eliminando paciente', 'Cerrar', { duration: 5000 });
          }
        });
      }
    });
  }

  closeDrawer(): void {
    this._pacientesListComponent.matDrawer.close();
    this._router.navigate(['./'], { relativeTo: this._activatedRoute.parent });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
