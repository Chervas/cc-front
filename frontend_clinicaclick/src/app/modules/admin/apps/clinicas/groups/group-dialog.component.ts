import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'group-dialog',
    template: `
      <h2 mat-dialog-title>Crear nuevo grupo</h2>
      <form [formGroup]="groupForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="fill" class="w-full">
              <mat-label>Nombre del grupo</mat-label>
              <input matInput formControlName="nombre_grupo" placeholder="Ej: Clínicas Propdental">
          </mat-form-field>
          <div mat-dialog-actions class="flex justify-end">
              <button mat-button type="button" (click)="onCancel()">Cancelar</button>
              <button mat-button color="primary" type="submit" [disabled]="groupForm.invalid">Crear</button>
          </div>
      </form>
    `,
    standalone: true,
    imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class GroupDialogComponent {
    groupForm: FormGroup;

    constructor(
        private _fb: FormBuilder,
        public dialogRef: MatDialogRef<GroupDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.groupForm = this._fb.group({
            nombre_grupo: ['', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.groupForm.valid) {
            this.dialogRef.close(this.groupForm.value);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
