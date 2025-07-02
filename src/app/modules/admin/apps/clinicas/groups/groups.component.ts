import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GroupsService } from 'app/modules/admin/apps/clinicas/groups/groups.service';
import { GroupClinica } from 'app/modules/admin/apps/clinicas/clinicas.types';

@Component({
  selector: 'clinicas-groups',
  templateUrl: './groups.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule]
})
export class GroupsComponent implements OnInit {
  groups: GroupClinica[] = [];
  groupForm: FormGroup;
  editingGroup: GroupClinica | null = null;

  constructor(
    private _fb: FormBuilder,
    private _groupsService: GroupsService,
    private _snackBar: MatSnackBar
  ) {
    this.groupForm = this._fb.group({
      nombre_grupo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this._groupsService.getAllGroups().subscribe(groups => {
      this.groups = groups;
      console.log('Grupos recuperados:', this.groups);
    });
  }

  saveGroup(): void {
    if(this.groupForm.invalid){
      return;
    }
    const groupData = this.groupForm.value;
    if (this.editingGroup) {
      this._groupsService.updateGroup(this.editingGroup.id_grupo, groupData).subscribe(res => {
        this._snackBar.open('Grupo actualizado', 'Cerrar', { duration: 3000 });
        this.editingGroup = null;
        this.groupForm.reset();
        this.loadGroups();
      });
    } else {
      this._groupsService.createGroup(groupData).subscribe(res => {
        this._snackBar.open('Grupo creado', 'Cerrar', { duration: 3000 });
        this.groupForm.reset();
        this.loadGroups();
      });
    }
  }

  editGroup(group: GroupClinica): void {
    this.editingGroup = group;
    this.groupForm.patchValue(group);
  }

  deleteGroup(groupId: string): void {
    this._groupsService.deleteGroup(groupId).subscribe(() => {
      this._snackBar.open('Grupo eliminado', 'Cerrar', { duration: 3000 });
      this.loadGroups();
    });
  }
}
