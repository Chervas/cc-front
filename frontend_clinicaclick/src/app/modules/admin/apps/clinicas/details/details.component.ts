import { AsyncPipe, DatePipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClinicasService } from 'app/modules/admin/apps/clinicas/clinicas.service';
import { Clinica, ClinicaFormData } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector       : 'clinicas-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [
        MatButtonModule,
        MatIconModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatCheckboxModule,
        NgIf,
        MatSelectModule,
        MatOptionModule,
        NgFor,
        NgClass,
        MatTooltipModule,
        MatRippleModule,
        AsyncPipe,
        DatePipe,
        TitleCasePipe,
    ],
})
export class ClinicasDetailsComponent implements OnInit, OnDestroy
{
    editMode: boolean = false;
    clinica: Clinica;
    clinicaForm: FormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _clinicasService: ClinicasService,
        private _formBuilder: FormBuilder,
        private _router: Router,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Open the drawer
        this._clinicasService.clinica$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinica: Clinica) =>
            {
                // Open the drawer in case it is closed
                // this._clinicasListComponent.matDrawer.open();

                // Get the clinica
                this.clinica = clinica;

                // Create the clinica form
                this.createForm();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Close the drawer
     */
    closeDrawer(): Promise<boolean>
    {
        return this._router.navigate(['../'], {relativeTo: this._activatedRoute});
    }

    /**
     * Toggle edit mode
     *
     * @param editMode
     */
    toggleEditMode(editMode: boolean | null = null): void
    {
        if ( editMode === null )
        {
            this.editMode = !this.editMode;
        }
        else
        {
            this.editMode = editMode;
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create the clinica form
     */
    createForm(): void
    {
        this.clinicaForm = this._formBuilder.group({
            // Información básica
            nombre_clinica: [this.clinica?.nombre_clinica || '', [Validators.required]],
            telefono: [this.clinica?.telefono || ''],
            email: [this.clinica?.email || '', [Validators.email]],
            url_web: [this.clinica?.url_web || ''],
            descripcion: [this.clinica?.descripcion || ''],
            
            // Dirección
            direccion: [this.clinica?.direccion || ''],
            codigo_postal: [this.clinica?.codigo_postal || ''],
            ciudad: [this.clinica?.ciudad || ''],
            provincia: [this.clinica?.provincia || ''],
            pais: [this.clinica?.pais || 'España'],
            
            // Horarios y servicios
            horario_atencion: [this.clinica?.horario_atencion || ''],
            servicios: [this.clinica?.servicios || ''],
            
            // Estado
            estado_clinica: [this.clinica?.estado_clinica ?? true],
            
            // URLs e imágenes
            url_avatar: [this.clinica?.url_avatar || ''],
            url_fondo: [this.clinica?.url_fondo || ''],
            url_ficha_local: [this.clinica?.url_ficha_local || ''],
            
            // Redes sociales
            instagram: [this.clinica?.redes_sociales?.instagram || ''],
            facebook: [this.clinica?.redes_sociales?.facebook || ''],
            tiktok: [this.clinica?.redes_sociales?.tiktok || ''],
            linkedin: [this.clinica?.redes_sociales?.linkedin || ''],
            doctoralia: [this.clinica?.redes_sociales?.doctoralia || ''],
            
            // Configuración
            citas_online: [this.clinica?.configuracion?.citas_online ?? false],
            notificaciones_email: [this.clinica?.configuracion?.notificaciones_email ?? true],
            notificaciones_sms: [this.clinica?.configuracion?.notificaciones_sms ?? false],
            
            // Marketing
            id_publicidad_meta: [this.clinica?.id_publicidad_meta || null],
            url_publicidad_meta: [this.clinica?.url_publicidad_meta || null],
            filtro_pc_meta: [this.clinica?.filtro_pc_meta || null],
            id_publicidad_google: [this.clinica?.id_publicidad_google || null],
            url_publicidad_google: [this.clinica?.url_publicidad_google || null],
            filtro_pc_google: [this.clinica?.filtro_pc_google || null],
        });
    }

    /**
     * ✅ CORRECCIÓN: Save the clinica con mejor manejo de errores y refresco
     */
    saveClinica(): void
    {
        // ✅ CORRECCIÓN: Validar que el formulario sea válido
        if (!this.clinicaForm.valid) {
            console.error('Formulario inválido:', this.clinicaForm.errors);
            return;
        }

        // ✅ CORRECCIÓN: Validar que la clínica existe
        if (!this.clinica || !this.clinica.id_clinica) {
            console.error('No hay clínica seleccionada para actualizar');
            return;
        }

        // Get the clinica object
        const formValue = this.clinicaForm.getRawValue();
        
        // ✅ CORRECCIÓN: Estructurar los datos correctamente
        const updateData: ClinicaFormData = {
            nombre_clinica: formValue.nombre_clinica,
            telefono: formValue.telefono,
            email: formValue.email,
            url_web: formValue.url_web,
            descripcion: formValue.descripcion,
            direccion: formValue.direccion,
            codigo_postal: formValue.codigo_postal,
            ciudad: formValue.ciudad,
            provincia: formValue.provincia,
            pais: formValue.pais,
            horario_atencion: formValue.horario_atencion,
            servicios: formValue.servicios,
            estado_clinica: formValue.estado_clinica,
            url_avatar: formValue.url_avatar,
            url_fondo: formValue.url_fondo,
            url_ficha_local: formValue.url_ficha_local,
            
            // ✅ CORRECCIÓN: Estructurar redes sociales
            redes_sociales: {
                instagram: formValue.instagram,
                facebook: formValue.facebook,
                tiktok: formValue.tiktok,
                linkedin: formValue.linkedin,
                doctoralia: formValue.doctoralia
            },
            
            // ✅ CORRECCIÓN: Estructurar configuración
            configuracion: {
                citas_online: formValue.citas_online,
                notificaciones_email: formValue.notificaciones_email,
                notificaciones_sms: formValue.notificaciones_sms
            },
            
            // Marketing
            id_publicidad_meta: formValue.id_publicidad_meta,
            url_publicidad_meta: formValue.url_publicidad_meta,
            filtro_pc_meta: formValue.filtro_pc_meta,
            id_publicidad_google: formValue.id_publicidad_google,
            url_publicidad_google: formValue.url_publicidad_google,
            filtro_pc_google: formValue.filtro_pc_google,
        };

        console.log('Enviando datos de actualización:', updateData);

        // ✅ CORRECCIÓN: Actualizar la clínica con mejor manejo de errores
        this._clinicasService.updateClinica(this.clinica.id_clinica, updateData).subscribe({
            next: (updatedClinica) => {
                console.log('Clínica actualizada exitosamente:', updatedClinica);
                
                // ✅ CORRECCIÓN: Actualizar la clínica local con datos del servidor
                this.clinica = updatedClinica;
                
                // ✅ CORRECCIÓN: Recrear el formulario con los nuevos datos
                this.createForm();
                
                // ✅ CORRECCIÓN: Salir del modo edición
                this.toggleEditMode(false);
                
                // ✅ CORRECCIÓN: Forzar detección de cambios
                this._changeDetectorRef.detectChanges();
                
                console.log('Vista actualizada correctamente');
            },
            error: (error) => {
                console.error('Error al actualizar clínica:', error);
                console.error('Detalles del error:', {
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url,
                    message: error.message
                });
                
                // ✅ CORRECCIÓN: Mostrar mensaje de error al usuario
                // Aquí podrías agregar un snackbar o toast para mostrar el error
                alert(`Error al guardar los cambios: ${error.status} - ${error.statusText}`);
            }
        });
    }

    /**
     * Delete the clinica
     */
    deleteClinica(): void
    {
        // Open the confirmation dialog
        const confirmation = confirm('¿Estás seguro de que quieres eliminar esta clínica?');

        // Return if the user canceled the confirmation
        if ( !confirmation )
        {
            return;
        }

        // Delete the clinica on the server
        this._clinicasService.deleteClinica(this.clinica.id_clinica).subscribe(() =>
        {
            // Close the details
            this.closeDrawer();
        });
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}

