import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key/find-by-key.pipe';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ClinicasService } from 'app/modules/admin/apps/clinicas/clinicas.service';
import { Clinica, GroupClinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { ClinicasListComponent } from 'app/modules/admin/apps/clinicas/list/list.component';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
// Importa el servicio de grupos
import { GroupsService } from 'app/modules/admin/apps/clinicas/groups/groups.service';
// Importa el componente del diálogo para crear grupo
import { GroupDialogComponent } from 'app/modules/admin/apps/clinicas/groups/group-dialog.component';

@Component({
    selector: 'clinicas-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgIf,
        MatButtonModule,
        MatTooltipModule,
        RouterLink,
        MatIconModule,
        NgFor,
        FormsModule,
        ReactiveFormsModule,
        MatRippleModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        NgClass,
        MatSelectModule,
        MatOptionModule,
        MatDatepickerModule,
        TextFieldModule,
        FuseFindByKeyPipe,
        DatePipe,
        MatSnackBarModule,
        MatSlideToggleModule
    ],
})
export class ClinicasDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;

    editMode: boolean = false;
    clinica: Clinica;
    clinicaForm: UntypedFormGroup;
    clinicas: Clinica[];
    showPasswordChange = false;
    grupos: GroupClinica[] = []; // Aquí se almacenan los grupos disponibles
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _snackBar: MatSnackBar,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _clinicasListComponent: ClinicasListComponent,
        private _clinicasService: ClinicasService,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        private _groupsService: GroupsService, // Inyectamos el servicio de grupos
        private _dialog: MatDialog // Inyectamos MatDialog para el modal de grupo
    ) { }

    ngOnInit(): void {
        // Abrir el drawer
        this._clinicasListComponent.matDrawer.open();

        // Crear el formulario, agregando el control para grupoClinicaId
        this.clinicaForm = this._formBuilder.group({
            id_clinica: [''],
            avatar: [null],
            nombre_clinica: ['', Validators.required],
            url_web: [''],
            url_avatar: [''],
            url_fondo: [''],
            url_ficha_local: [''],
            fecha_creacion: [new Date()],
            id_publicidad_meta: [''],
            filtro_pc_meta: [''],
            url_publicidad_meta: [''],
            id_publicidad_google: [''],
            filtro_pc_google: [''],
            url_publicidad_google: [''],
            servicios: [''],
            checklist: [''],
            estado_clinica: [true],
            denominacion_social: [''],
            cif_nif: [''],
            direccion_facturacion: [''],
            grupoClinicaId: [null]
        });

        // Obtener la lista de clínicas (si es necesaria en este componente)
        this._clinicasService.clinicas$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinicas: Clinica[]) => {
                this.clinicas = clinicas;
                this._changeDetectorRef.markForCheck();
            });

        // Obtener la clínica actual
        this._clinicasService.clinica$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinica: Clinica) => {
                this._clinicasListComponent.matDrawer.open();
                this.clinica = clinica;
                this.clinicaForm.patchValue({
                    id_clinica: clinica.id_clinica,
                    nombre_clinica: clinica.nombre_clinica,
                    url_web: clinica.url_web,
                    url_avatar: clinica.url_avatar,
                    url_fondo: clinica.url_fondo,
                    url_ficha_local: clinica.url_ficha_local,
                    fecha_creacion: clinica.fecha_creacion,
                    id_publicidad_meta: clinica.id_publicidad_meta,
                    filtro_pc_meta: clinica.filtro_pc_meta,
                    url_publicidad_meta: clinica.url_publicidad_meta,
                    id_publicidad_google: clinica.id_publicidad_google,
                    filtro_pc_google: clinica.filtro_pc_google,
                    url_publicidad_google: clinica.url_publicidad_google,
                    servicios: clinica.servicios,
                    checklist: clinica.checklist,
                    estado_clinica: clinica.estado_clinica, 
                    denominacion_social: clinica.datos_fiscales_clinica?.denominacion_social || '',
                    cif_nif: clinica.datos_fiscales_clinica?.cif_nif || '',
                    direccion_facturacion: clinica.datos_fiscales_clinica?.direccion_facturacion || '',
                    grupoClinicaId: clinica.grupoClinica ? clinica.grupoClinica.id_grupo : null
                });
                console.log('Datos de la clínica obtenido:', clinica);
                this._changeDetectorRef.markForCheck();
            });

        // Cargar los grupos disponibles
        this._groupsService.getAllGroups().subscribe(grupos => {
            this.grupos = grupos;
            console.log('Grupos recuperados en details:', this.grupos);
            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleEditMode(editMode: boolean | null = null): void {
        if (editMode === null) {
            this.editMode = !this.editMode;
            this.showPasswordChange = false;
        } else {
            this.editMode = editMode;
        }
        this._changeDetectorRef.markForCheck();
    }

    togglePasswordChange(): void {
        this.showPasswordChange = !this.showPasswordChange;
    }

    cancelPasswordChange(): void {
        this.showPasswordChange = false;
        this.clinicaForm.get('newPassword').reset();
    }

    updateClinica(): void {
        const clinicaFormValue = this.clinicaForm.getRawValue();
        const datos_fiscales_clinica = {
            denominacion_social: clinicaFormValue.denominacion_social,
            cif_nif: clinicaFormValue.cif_nif,
            direccion_facturacion: clinicaFormValue.direccion_facturacion
        };
        const clinicaData = {
            ...clinicaFormValue,
            datos_fiscales_clinica: datos_fiscales_clinica
        };
        console.log('Enviando datos para actualizar:', clinicaData);
        if (this.showPasswordChange && clinicaData.newPassword) {
            clinicaData.password_usuario = clinicaData.newPassword;
        }
        this._clinicasService.updateClinica(clinicaData.id_clinica, clinicaData).subscribe({
            next: (updatedClinica) => {
                console.log('Clínica actualizada con éxito:', updatedClinica);
                this.clinica = updatedClinica;
                this.clinicaForm.patchValue(updatedClinica);
                this._changeDetectorRef.detectChanges();
                this.toggleEditMode(false);
                this._snackBar.open('Clinic updated', 'Close', { duration: 3000 });
            },
            error: (error) => {
                console.error('Error updating clinic:', error);
                let errorMessage = 'Error updating clinic';
                if (error.error && error.error.sqlMessage) {
                    errorMessage = error.error.sqlMessage;
                }
                this._snackBar.open(errorMessage, 'Close', { duration: 5000 });
            }
        });
    }

    deleteClinica(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete clinic',
            message: 'Are you sure you want to delete this clinic? This action cannot be undone!',
            actions: { confirm: { label: 'Delete' } },
        });
        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const id_clinica = this.clinica.id_clinica;
                const currentIndex = this.clinicas.findIndex(item => item.id_clinica === id_clinica);
                const nextIndex = currentIndex + ((currentIndex === (this.clinicas.length - 1)) ? -1 : 1);
                const nextClinicaId = (this.clinicas.length === 1 && this.clinicas[0].id_clinica === id_clinica) ? null : this.clinicas[nextIndex].id_clinica;
                this._clinicasService.deleteClinica(id_clinica).subscribe((isDeleted) => {
                    if (!isDeleted) {
                        return;
                    }
                    if (nextClinicaId) {
                        this._router.navigate(['../', nextClinicaId], { relativeTo: this._activatedRoute });
                    } else {
                        this._router.navigate(['../'], { relativeTo: this._activatedRoute });
                    }
                    this.toggleEditMode(false);
                });
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    onEstadoClinicaChange(event: MatSlideToggleChange): void {
        if (!event.checked) {
            const confirmation = this._fuseConfirmationService.open({
                title: 'Deactivate Clinic',
                message: 'Si desactivas esta clínica no se le generarán facturas hasta que se vuelva a activar. ¿Quieres desactivar esta clínica?',
                actions: {
                    confirm: { label: 'Yes', color: 'warn' },
                    cancel: { label: 'No' }
                },
            });
            confirmation.afterClosed().subscribe((result) => {
                if (result === 'confirmed') {
                    this.clinicaForm.get('estado_clinica').setValue(false);
                    this.updateClinica();
                } else {
                    this.clinicaForm.get('estado_clinica').setValue(true);
                }
                this._changeDetectorRef.markForCheck();
            });
        } else {
            this.clinicaForm.get('estado_clinica').setValue(true);
            this.updateClinica();
            this._changeDetectorRef.markForCheck();
        }
    }

    uploadAvatar(fileList: FileList): void {
        if (!fileList.length) {
            return;
        }
        const allowedTypes = ['image/jpeg', 'image/png'];
        const file = fileList[0];
        if (!allowedTypes.includes(file.type)) {
            return;
        }
        this._clinicasService.uploadAvatar(this.clinica.id_clinica, file).subscribe();
    }

    removeAvatar(): void {
        const avatarControl = this.clinicaForm.get('avatar');
        avatarControl.setValue(null);
        this._avatarFileInput.nativeElement.value = null;
        this.clinica.url_avatar = null;
    }

    addEmailField(): void {
        const emailGroup = this._formBuilder.group({
            email_usuario: [''],
            label: [''],
        });
        (this.clinicaForm.get('emails') as UntypedFormArray).push(emailGroup);
        this._changeDetectorRef.markForCheck();
    }

    removeEmailField(index: number): void {
        const emailsArray = this.clinicaForm.get('emails') as UntypedFormArray;
        emailsArray.removeAt(index);
        this._changeDetectorRef.markForCheck();
    }

    addPhoneNumberField(): void {
        const phoneGroup = this._formBuilder.group({
            phoneNumber: [''],
            label: [''],
        });
        (this.clinicaForm.get('phoneNumbers') as UntypedFormArray).push(phoneGroup);
        this._changeDetectorRef.markForCheck();
    }

    removePhoneNumberField(index: number): void {
        const phoneNumbersArray = this.clinicaForm.get('phoneNumbers') as UntypedFormArray;
        phoneNumbersArray.removeAt(index);
        this._changeDetectorRef.markForCheck();
    }

    trackByFn(index: number, item: any): any {
        return item.id_clinica || index;
    }

    // Agregamos un método closeDrawer para compatibilidad con las rutas
    closeDrawer(): Promise<MatDrawerToggleResult> {
        return Promise.resolve({} as MatDrawerToggleResult);
    }

    // Método para abrir el diálogo y crear un grupo nuevo
    openCreateGroupDialog(): void {
        const dialogRef = this._dialog.open(GroupDialogComponent, {
            width: '400px',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._groupsService.createGroup(result).subscribe(newGroup => {
                    this._snackBar.open('Grupo creado', 'Cerrar', { duration: 3000 });
                    // Recargar la lista de grupos
                    this._groupsService.getAllGroups().subscribe(grupos => {
                        this.grupos = grupos;
                        console.log('Grupos actualizados:', this.grupos);
                        this._changeDetectorRef.markForCheck();
                    });
                });
            }
        });
    }
}
