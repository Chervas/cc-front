import { Component, ChangeDetectionStrategy, ViewEncapsulation, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ContactsService } from 'app/modules/admin/apps/contacts/contacts.service';
import { Clinica } from 'app/modules/admin/apps/clinicas/clinicas.types';

@Component({
  selector: 'create-paciente-dialog',
  templateUrl: './create-paciente-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ]
})
export class CreatePacienteDialogComponent implements OnInit {
  pacienteForm: UntypedFormGroup;
  prefijos = [
    { value: '+34', label: '+34 (España)' },
    { value: '+33', label: '+33 (Francia)' },
    { value: '+212', label: '+212 (Marruecos)' },
    { value: '+57', label: '+57 (Colombia)' },
    { value: '+51', label: '+51 (Perú)' }
  ];
  clinicas: Clinica[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<CreatePacienteDialogComponent>,
    private _contactsService: ContactsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.pacienteForm = this._formBuilder.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      prefijo: ['+34', Validators.required],
      telefono_movil: ['', Validators.required],
      dni: [''],
      email: [''],
      clinica_id: [data && data.selectedClinic ? data.selectedClinic.id_clinica : null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.clinics && this.data.clinics.length > 0) {
      this.clinicas = this.data.clinics;
    } else {
      this._contactsService.getClinicas().subscribe((clinicas: Clinica[]) => {
        this.clinicas = clinicas;
      });
    }
    if (!this.pacienteForm.get('clinica_id')?.value && this.clinicas.length > 0) {
      this.pacienteForm.patchValue({ clinica_id: this.clinicas[0].id_clinica });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.pacienteForm.valid) {
      const formValue = this.pacienteForm.value;
      if (!formValue.telefono_movil.startsWith('+')) {
        formValue.telefono_movil = formValue.prefijo + formValue.telefono_movil;
      }
      delete formValue.prefijo;
      this.dialogRef.close(formValue);
    }
  }
}
