import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgFor, NgIf, Location } from '@angular/common';
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
import { environment } from 'environments/environment';
// ✅ AÑADIDO: Importaciones para activos Meta
import { HttpClient } from '@angular/common/http';
import { AssetMappingComponent } from 'app/modules/admin/pages/settings/shared/asset-mapping.component';

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
    grupos: GroupClinica[] = []; // Aquí se almacenan los grupos disponibles
    
    // ✅ AÑADIDO: Estructura para horarios tipo Google My Business
    horarios = {
        lunes: { abierto: false, apertura: '09:00', cierre: '18:00' },
        martes: { abierto: false, apertura: '09:00', cierre: '18:00' },
        miercoles: { abierto: false, apertura: '09:00', cierre: '18:00' },
        jueves: { abierto: false, apertura: '09:00', cierre: '18:00' },
        viernes: { abierto: false, apertura: '09:00', cierre: '18:00' },
        sabado: { abierto: false, apertura: '09:00', cierre: '14:00' },
        domingo: { abierto: false, apertura: '09:00', cierre: '14:00' }
    };
    
    // ✅ AÑADIDO: Propiedades para activos Meta
    metaAssets: any = null;
    isLoadingMetaAssets: boolean = false;
    hasMetaConnection: boolean = false;
    
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
        private _dialog: MatDialog, // Inyectamos MatDialog para el modal de grupo
        private _location: Location,
        private _http: HttpClient // ✅ AÑADIDO: Para llamadas a API de activos Meta
    ) { }

    ngOnInit(): void {
        // Abrir el drawer
        this._clinicasListComponent.matDrawer.open();

        // Crear el formulario, agregando el control para grupoClinicaId
        this.clinicaForm = this._formBuilder.group({
            id_clinica: [''],
            avatar: [null],
            nombre_clinica: ['', Validators.required],
            telefono: [''],
            email: [''],
            url_web: [''],
            url_avatar: [''],
            url_fondo: [''],
            url_ficha_local: [''],
            fecha_creacion: [new Date()],
            id_publicidad_meta: [null], // ✅ CORREGIDO: null en lugar de string vacío
            filtro_pc_meta: [null], // ✅ CORREGIDO: null en lugar de string vacío
            url_publicidad_meta: [''],
            id_publicidad_google: [null], // ✅ CORREGIDO: null en lugar de string vacío
            filtro_pc_google: [null], // ✅ CORREGIDO: null en lugar de string vacío
            url_publicidad_google: [''],
            servicios: [''],
            checklist: [''],
            estado_clinica: [true],
            horario_atencion: [''],
            denominacion_social: [''],
            cif_nif: [''],
            direccion_facturacion: [''],
            grupoClinicaId: [null],
            // Campos adicionales
            descripcion: [''],
            direccion: [''],
            codigo_postal: [''],
            ciudad: [''],
            provincia: [''],
            pais: [''],
            // Redes sociales
            instagram: [''],
            meta: [''],
            tiktok: [''],
            linkedin: [''],
            doctoralia: ['']
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
                
                console.log('Datos de la clínica obtenido:', clinica);
                
                // ✅ CORREGIDO: Actualizar formulario con TODOS los campos disponibles
                this.clinicaForm.patchValue({
                    id_clinica: clinica.id_clinica,
                    nombre_clinica: clinica.nombre_clinica,
                    telefono: clinica.telefono || '',
                    email: clinica.email || '',
                    url_web: clinica.url_web || '',
                    url_avatar: clinica.url_avatar || '',
                    url_fondo: clinica.url_fondo || '',
                    url_ficha_local: clinica.url_ficha_local || '',
                    fecha_creacion: clinica.fecha_creacion,
                    // ✅ CORREGIDO: Manejar campos enteros correctamente
                    id_publicidad_meta: clinica.id_publicidad_meta || null,
                    filtro_pc_meta: clinica.filtro_pc_meta || null,
                    url_publicidad_meta: clinica.url_publicidad_meta || '',
                    id_publicidad_google: clinica.id_publicidad_google || null,
                    filtro_pc_google: clinica.filtro_pc_google || null,
                    url_publicidad_google: clinica.url_publicidad_google || '',
                    servicios: clinica.servicios || '',
                    checklist: clinica.checklist || '',
                    estado_clinica: clinica.estado_clinica,
                    horario_atencion: clinica.horario_atencion || '',
                    denominacion_social: clinica.datos_fiscales_clinica?.denominacion_social || '',
                    cif_nif: clinica.datos_fiscales_clinica?.cif_nif || '',
                    direccion_facturacion: clinica.datos_fiscales_clinica?.direccion_facturacion || '',
                    grupoClinicaId: clinica.grupoClinica ? clinica.grupoClinica.id_grupo : null,
                    // Campos adicionales
                    descripcion: clinica.descripcion || '',
                    direccion: clinica.direccion || '',
                    codigo_postal: clinica.codigo_postal || '',
                    ciudad: clinica.ciudad || '',
                    provincia: clinica.provincia || '',
                    pais: clinica.pais || '',
                    // Redes sociales
                    instagram: clinica.redes_sociales?.instagram || '',
                    meta: clinica.redes_sociales?.facebook || '',
                    tiktok: clinica.redes_sociales?.tiktok || '',
                    linkedin: clinica.redes_sociales?.linkedin || '',
                    doctoralia: clinica.redes_sociales?.doctoralia || ''
                });
                
                // ✅ AÑADIDO: Parsear horarios existentes si los hay
                this.parseHorarioExistente(clinica.horario_atencion);
                
                // ✅ AÑADIDO: Cargar activos Meta para esta clínica
                this.loadMetaAssets(Number(clinica.id_clinica));
                
                this._changeDetectorRef.markForCheck();
            });

        // ✅ CARGAR GRUPOS: Con manejo de errores mejorado
        this._groupsService.getAllGroups().subscribe({
            next: (grupos) => {
                this.grupos = grupos;
                console.log('Grupos recuperados en details:', this.grupos);
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error cargando grupos:', error);
                // Si hay error 404, significa que no hay grupos o la ruta no existe
                this.grupos = [];
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleEditMode(editMode: boolean | null = null): void {
        if (editMode === null) {
            this.editMode = !this.editMode;
        } else {
            this.editMode = editMode;
        }
        this._changeDetectorRef.markForCheck();
    }

    // ✅ AÑADIDO: Función helper para convertir strings vacíos a null para campos enteros
    private convertEmptyToNull(value: any): any {
        return (value === '' || value === undefined) ? null : value;
    }

  // ✅ AÑADIR ESTE DEBUG EN EL MÉTODO updateClinica() ANTES DE ENVIAR AL SERVIDOR

updateClinica(): void {
    const clinicaFormValue = this.clinicaForm.getRawValue();
    
    // ✅ DEBUG: Ver qué valores tiene el formulario
    console.log('🔍 DEBUG - Valores del formulario:', clinicaFormValue);
    console.log('🔍 DEBUG - Teléfono:', clinicaFormValue.telefono);
    console.log('🔍 DEBUG - Email:', clinicaFormValue.email);
    console.log('🔍 DEBUG - Descripción:', clinicaFormValue.descripcion);
    
    // Estructurar datos fiscales
    const datos_fiscales_clinica = {
        denominacion_social: clinicaFormValue.denominacion_social,
        cif_nif: clinicaFormValue.cif_nif,
        direccion_facturacion: clinicaFormValue.direccion_facturacion
    };

    // Estructurar redes sociales
    const redes_sociales = {
        instagram: clinicaFormValue.instagram,
        facebook: clinicaFormValue.meta, // Mapear meta a facebook
        tiktok: clinicaFormValue.tiktok,
        linkedin: clinicaFormValue.linkedin,
        doctoralia: clinicaFormValue.doctoralia
    };

    // ✅ DEBUG: Ver qué valores tienen las estructuras
    console.log('🔍 DEBUG - Redes sociales:', redes_sociales);

    // ✅ AÑADIDO: Generar horario estructurado
    const horario_atencion = this.generarHorarioTexto();
    console.log('🔍 DEBUG - Horario generado:', horario_atencion);

    // ✅ CORREGIDO: Convertir strings vacíos a null para evitar error SQL
    const clinicaData = {
        id_clinica: clinicaFormValue.id_clinica,
        nombre_clinica: clinicaFormValue.nombre_clinica,
        telefono: clinicaFormValue.telefono,
        email: clinicaFormValue.email,
        url_web: clinicaFormValue.url_web,
        url_avatar: clinicaFormValue.url_avatar,
        url_fondo: clinicaFormValue.url_fondo,
        url_ficha_local: clinicaFormValue.url_ficha_local,
        fecha_creacion: clinicaFormValue.fecha_creacion,
        // ✅ CORREGIDO: Convertir strings vacíos a null para evitar error SQL
        id_publicidad_meta: this.convertEmptyToNull(clinicaFormValue.id_publicidad_meta),
        filtro_pc_meta: this.convertEmptyToNull(clinicaFormValue.filtro_pc_meta),
        url_publicidad_meta: clinicaFormValue.url_publicidad_meta,
        id_publicidad_google: this.convertEmptyToNull(clinicaFormValue.id_publicidad_google),
        filtro_pc_google: this.convertEmptyToNull(clinicaFormValue.filtro_pc_google),
        url_publicidad_google: clinicaFormValue.url_publicidad_google,
        servicios: clinicaFormValue.servicios,
        checklist: clinicaFormValue.checklist,
        estado_clinica: clinicaFormValue.estado_clinica,
        horario_atencion: horario_atencion,
        descripcion: clinicaFormValue.descripcion,
        direccion: clinicaFormValue.direccion,
        codigo_postal: clinicaFormValue.codigo_postal,
        ciudad: clinicaFormValue.ciudad,
        provincia: clinicaFormValue.provincia,
        pais: clinicaFormValue.pais,
        datos_fiscales_clinica: datos_fiscales_clinica,
        redes_sociales: redes_sociales,
        grupoClinicaId: clinicaFormValue.grupoClinicaId
    };

    // ✅ DEBUG: Ver qué se va a enviar al servidor
    console.log('🔍 DEBUG - Datos que se envían al servidor:', clinicaData);
    console.log('🔍 DEBUG - Teléfono en datos:', clinicaData.telefono);
    console.log('🔍 DEBUG - Email en datos:', clinicaData.email);

    console.log('Enviando datos para actualizar:', clinicaData);

    // ✅ AÑADIR: Verificar que el servicio existe
    if (!this._clinicasService) {
        console.error('❌ ERROR: _clinicasService no está definido');
        this._snackBar.open('Error: Servicio no disponible', 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
        return;
    }

    // ✅ AÑADIR: Verificar que el método updateClinica existe
    if (typeof this._clinicasService.updateClinica !== 'function') {
        console.error('❌ ERROR: _clinicasService.updateClinica no es una función');
        this._snackBar.open('Error: Método de actualización no disponible', 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
        return;
    }

    console.log('🚀 INICIANDO petición HTTP al servidor...');
    console.log('🔗 Enviando petición de actualización...');
    console.log('📦 Método:', 'PATCH');

    // ✅ LLAMADA AL SERVICIO CON MANEJO COMPLETO DE ERRORES
    this._clinicasService.updateClinica(clinicaData.id_clinica, clinicaData).subscribe({
        next: (response) => {
            console.log('✅ RESPUESTA RECIBIDA del servidor:', response);
            console.log('🎉 Clínica actualizada con éxito:', response);
            
            // ✅ ACTUALIZAR tanto la clínica como el formulario con la respuesta del servidor
            this.clinica = response;
            this.clinicaForm.patchValue({
                id_clinica: response.id_clinica,
                nombre_clinica: response.nombre_clinica,
                telefono: response.telefono || '',
                email: response.email || '',
                url_web: response.url_web || '',
                url_avatar: response.url_avatar || '',
                url_fondo: response.url_fondo || '',
                url_ficha_local: response.url_ficha_local || '',
                fecha_creacion: response.fecha_creacion,
                id_publicidad_meta: response.id_publicidad_meta || null,
                filtro_pc_meta: response.filtro_pc_meta || null,
                url_publicidad_meta: response.url_publicidad_meta || '',
                id_publicidad_google: response.id_publicidad_google || null,
                filtro_pc_google: response.filtro_pc_google || null,
                url_publicidad_google: response.url_publicidad_google || '',
                servicios: response.servicios || '',
                checklist: response.checklist || '',
                estado_clinica: response.estado_clinica,
                horario_atencion: response.horario_atencion || '',
                denominacion_social: response.datos_fiscales_clinica?.denominacion_social || '',
                cif_nif: response.datos_fiscales_clinica?.cif_nif || '',
                direccion_facturacion: response.datos_fiscales_clinica?.direccion_facturacion || '',
                grupoClinicaId: response.grupoClinica ? response.grupoClinica.id_grupo : null,
                descripcion: response.descripcion || '',
                direccion: response.direccion || '',
                codigo_postal: response.codigo_postal || '',
                ciudad: response.ciudad || '',
                provincia: response.provincia || '',
                pais: response.pais || '',
                instagram: response.redes_sociales?.instagram || '',
                meta: response.redes_sociales?.facebook || '',
                tiktok: response.redes_sociales?.tiktok || '',
                linkedin: response.redes_sociales?.linkedin || '',
                doctoralia: response.redes_sociales?.doctoralia || ''
            });
            
            // ✅ MARCAR COMO GUARDADO
            this.clinicaForm.markAsPristine();
            
            // ✅ SALIR DEL MODO EDICIÓN
            this.toggleEditMode(false);
            
            // ✅ ACTUALIZAR VISTA
            this._changeDetectorRef.markForCheck();
            
            // ✅ MOSTRAR SNACKBAR DE ÉXITO
            this._snackBar.open('Clínica actualizada correctamente', 'Cerrar', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top'
            });
        },
        error: (error) => {
            console.error('❌ ERROR en la petición HTTP:', error);
            console.error('❌ Status:', error.status);
            console.error('❌ Message:', error.message);
            console.error('❌ Error completo:', error);
            
            // ✅ MOSTRAR ERROR AL USUARIO
            let errorMessage = 'Error al actualizar la clínica';
            if (error.error?.message) {
                errorMessage += ': ' + error.error.message;
            } else if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            this._snackBar.open(errorMessage, 'Cerrar', {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top'
            });
        },
        complete: () => {
            console.log('🏁 Petición HTTP completada (success o error)');
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
                    this.clinicaForm.get('estado_clinica')?.setValue(false);
                    this.updateClinica();
                } else {
                    this.clinicaForm.get('estado_clinica')?.setValue(true);
                }
                this._changeDetectorRef.markForCheck();
            });
        } else {
            this.clinicaForm.get('estado_clinica')?.setValue(true);
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
        console.log('Upload avatar no implementado aún');

    }

    removeAvatar(): void {
        const avatarControl = this.clinicaForm.get('avatar');
        avatarControl?.setValue(null);
        if (this._avatarFileInput) {
            this._avatarFileInput.nativeElement.value = null;
        }
        this.clinica.url_avatar = null;
    }

    addEmailField(): void {
        const emailGroup = this._formBuilder.group({
            email_usuario: [''],
            label: [''],
        });
        (this.clinicaForm.get('emails') as UntypedFormArray)?.push(emailGroup);
        this._changeDetectorRef.markForCheck();
    }

    removeEmailField(index: number): void {
        const emailsArray = this.clinicaForm.get('emails') as UntypedFormArray;
        emailsArray?.removeAt(index);
        this._changeDetectorRef.markForCheck();
    }

    addPhoneNumberField(): void {
        const phoneGroup = this._formBuilder.group({
            phoneNumber: [''],
            label: [''],
        });
        (this.clinicaForm.get('phoneNumbers') as UntypedFormArray)?.push(phoneGroup);
        this._changeDetectorRef.markForCheck();
    }

    removePhoneNumberField(index: number): void {
        const phoneNumbersArray = this.clinicaForm.get('phoneNumbers') as UntypedFormArray;
        phoneNumbersArray?.removeAt(index);
        this._changeDetectorRef.markForCheck();
    }

    trackByFn(index: number, item: any): any {
        return item.id_clinica || index;
    }

    // ✅ AÑADIDO: Método closeDrawer requerido por las rutas
    closeDrawer(): Promise<MatDrawerToggleResult> {
        return this._clinicasListComponent.matDrawer.close();
    }

    // ✅ AÑADIDO: Método para abrir el diálogo y crear un grupo nuevo
    openCreateGroupDialog(): void {
        const dialogRef = this._dialog.open(GroupDialogComponent, {
            width: '400px',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._groupsService.createGroup(result).subscribe({
                    next: (newGroup) => {
                        this._snackBar.open('Grupo creado', 'Cerrar', { duration: 3000 });
                        // Recargar la lista de grupos
                        this._groupsService.getAllGroups().subscribe(grupos => {
                            this.grupos = grupos;
                            console.log('Grupos actualizados:', this.grupos);
                            this._changeDetectorRef.markForCheck();
                        });
                    },
                    error: (error) => {
                        console.error('Error creando grupo:', error);
                        this._snackBar.open('Error creando grupo', 'Cerrar', { duration: 3000 });
                    }
                });
            }
        });
    }

    // ✅ AÑADIDO: Método para obtener el nombre del grupo seleccionado (para el HTML)
    getSelectedGroupName(): string | null {
        const selectedGroupId = this.clinicaForm.get('grupoClinicaId')?.value;
        if (!selectedGroupId) {
            return null;
        }
        const selectedGroup = this.grupos.find(g => g.id_grupo === selectedGroupId);
        return selectedGroup ? selectedGroup.nombre_grupo : null;
    }

    // ✅ AÑADIDO: Método para verificar si hay redes sociales (para el HTML)
    hasAnySocialMedia(): boolean {
        if (!this.clinica?.redes_sociales) {
            return false;
        }
        const redes = this.clinica.redes_sociales;
        return !!(redes.instagram || redes.facebook || redes.tiktok || redes.linkedin || redes.doctoralia);
    }

    // ✅ AÑADIDO: Métodos para horarios tipo Google My Business
    parseHorarioExistente(horarioTexto: string): void {
        if (!horarioTexto) return;
        
        // Intentar parsear horario existente (formato simple por ahora)
        // Esto se puede mejorar para parsear formatos más complejos
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        // Por defecto, establecer horario laboral estándar
        dias.forEach(dia => {
            if (dia === 'sabado' || dia === 'domingo') {
                this.horarios[dia] = { abierto: false, apertura: '09:00', cierre: '14:00' };
            } else {
                this.horarios[dia] = { abierto: true, apertura: '09:00', cierre: '18:00' };
            }
        });
    }

    aplicarHorarioATodos(): void {
        const horarioLunes = this.horarios.lunes;
        const dias = ['martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        dias.forEach(dia => {
            this.horarios[dia] = { ...horarioLunes };
        });
        
        this._changeDetectorRef.markForCheck();
    }

    aplicarHorarioLaborables(): void {
        const horarioLunes = this.horarios.lunes;
        const diasLaborables = ['martes', 'miercoles', 'jueves', 'viernes'];
        
        diasLaborables.forEach(dia => {
            this.horarios[dia] = { ...horarioLunes };
        });
        
        this._changeDetectorRef.markForCheck();
    }

    cerrarFinDeSemana(): void {
        this.horarios.sabado.abierto = false;
        this.horarios.domingo.abierto = false;
        this._changeDetectorRef.markForCheck();
    }

    generarHorarioTexto(): string {
        const dias = [
            { key: 'lunes', nombre: 'Lunes' },
            { key: 'martes', nombre: 'Martes' },
            { key: 'miercoles', nombre: 'Miércoles' },
            { key: 'jueves', nombre: 'Jueves' },
            { key: 'viernes', nombre: 'Viernes' },
            { key: 'sabado', nombre: 'Sábado' },
            { key: 'domingo', nombre: 'Domingo' }
        ];

        const horarioTexto = dias.map(dia => {
            const horario = this.horarios[dia.key];
            if (horario.abierto) {
                return `${dia.nombre}: ${horario.apertura} - ${horario.cierre}`;
            } else {
                return `${dia.nombre}: Cerrado`;
            }
        }).join('\n');

        return horarioTexto;
    }

    getHorarioPreview(): string {
        return this.generarHorarioTexto();
    }

    // ✅ AÑADIDO: Métodos para gestión de activos Meta
    
    /**
     * Cargar activos Meta para la clínica actual
     */
    async loadMetaAssets(clinicaId: number): Promise<void> {
        try {
            this.isLoadingMetaAssets = true;
            this._changeDetectorRef.markForCheck();
            
            const response = await this._http.get<any>(
                `https://autenticacion.clinicaclick.com/oauth/meta/mappings/${clinicaId}`
            ).toPromise();
            
            if (response && response.success) {
                this.metaAssets = response.mappings;
                this.hasMetaConnection = response.totalAssets > 0;
                console.log(`✅ Activos Meta cargados para clínica ${clinicaId}:`, this.metaAssets);
            } else {
                this.metaAssets = null;
                this.hasMetaConnection = false;
                console.log(`⚠️ No se encontraron activos Meta para clínica ${clinicaId}`);
            }
        } catch (error) {
            console.error('❌ Error cargando activos Meta:', error);
            this.metaAssets = null;
            this.hasMetaConnection = false;
        } finally {
            this.isLoadingMetaAssets = false;
            this._changeDetectorRef.markForCheck();
        }
    }
    
    /**
     * Abrir modal de mapeo de activos Meta
     */
    openMetaAssetMapping(): void {
        const dialogRef = this._dialog.open(AssetMappingComponent, {
            width: '90vw',
            maxWidth: '1200px',
            height: '80vh',
            disableClose: false,
            data: {
                clinicaId: Number(this.clinica?.id_clinica),
                clinicaName: this.clinica?.nombre_clinica
            }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            if (result && result.success) {
                console.log('✅ Mapeo completado, recargando activos Meta...');
                this.loadMetaAssets(Number(this.clinica.id_clinica));
                this._snackBar.open('Activos Meta actualizados correctamente', 'Cerrar', { 
                    duration: 3000 
                });
            }
        });
    }
    
    /**
     * Obtener chips de activos Meta para mostrar en la vista
     */
    getMetaAssetChips(): any[] {
        if (!this.metaAssets) return [];
        
        const chips = [];
        
        // Facebook Pages
        if (this.metaAssets.facebook_pages) {
            this.metaAssets.facebook_pages.forEach(page => {
                chips.push({
                    type: 'facebook_page',
                    name: page.metaAssetName,
                    url: page.assetUrl,
                    icon: 'heroicons_outline:share',
                    color: 'blue'
                });
            });
        }
        
        // Instagram Business
        if (this.metaAssets.instagram_business) {
            this.metaAssets.instagram_business.forEach(account => {
                chips.push({
                    type: 'instagram_business',
                    name: account.metaAssetName,
                    url: account.assetUrl,
                    icon: 'heroicons_outline:camera',
                    color: 'pink'
                });
            });
        }
        
        // Ad Accounts
        if (this.metaAssets.ad_accounts) {
            this.metaAssets.ad_accounts.forEach(account => {
                chips.push({
                    type: 'ad_account',
                    name: account.metaAssetName,
                    url: account.assetUrl,
                    icon: 'heroicons_outline:chart-bar',
                    color: 'green'
                });
            });
        }
        
        return chips;
    }
    
    /**
     * Verificar si hay activos Meta conectados
     */
    hasMetaAssets(): boolean {
        return this.hasMetaConnection && this.metaAssets && 
               (this.metaAssets.facebook_pages?.length > 0 || 
                this.metaAssets.instagram_business?.length > 0 || 
                this.metaAssets.ad_accounts?.length > 0);
    }
}

