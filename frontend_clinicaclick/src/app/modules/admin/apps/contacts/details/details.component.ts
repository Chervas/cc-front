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
import { ContactsService } from 'app/modules/admin/apps/contacts/contacts.service';
import { Contact } from 'app/modules/admin/apps/contacts/contacts.types';
import { Clinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { ContactsListComponent } from 'app/modules/admin/apps/contacts/list/list.component';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
    selector: 'contacts-details',
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
export class ContactsDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;

    clinicas: Clinica[] = [];  // Lista de todas las clínicas (para el select general)
    userClinicas: Clinica[] = []; // Clínicas asignadas al usuario
    editMode: boolean = false;
    contact: Contact;
    contactForm: UntypedFormGroup;
    contacts: Contact[];
    showPasswordChange = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _snackBar: MatSnackBar,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _contactsListComponent: ContactsListComponent,
        private _contactsService: ContactsService,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
    ) { }

    ngOnInit(): void {
        // Abrir el drawer
        this._contactsListComponent.matDrawer.open();

        // Crear el formulario, incluyendo el control isProfesional y el FormArray "clinicas"
        this.contactForm = this._formBuilder.group({
            id_usuario: [''],
            avatar: [null],
            nombre: ['', Validators.required],
            apellidos: [''],
            email_usuario: ['', [Validators.required, Validators.email]],
            email_factura: [''],
            email_notificacion: [''],
            fecha_creacion: [new Date()],
            id_gestor: [''],
            password_usuario: [''],
            newPassword: [''],
            notas_usuario: [''],
            telefono: [''],
            cargo_usuario: [''],
            cumpleanos: [''],
            isProfesional: [false],
            selectedClinicaId: [''],
            clinicas: this._formBuilder.array([])
        });

        // Suscribirse para obtener la lista de contactos
        this._contactsService.contacts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((contacts: Contact[]) => {
                this.contacts = contacts;
                this._changeDetectorRef.markForCheck();
            });

        // Obtener todas las clínicas (para el select general)
        this._contactsService.getClinicas().subscribe((clinicas: Clinica[]) => {
            console.log('Todas las clínicas obtenidas:', clinicas);
            this.clinicas = clinicas;
        });

        // Obtener el contacto actual
        this._contactsService.contact$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((contact: Contact) => {
                // Abrir el drawer en caso de que esté cerrado
                this._contactsListComponent.matDrawer.open();
                
                // Obtener el contacto
                this.contact = contact;
                
                // ✅ VERIFICACIÓN AGREGADA: Solo procesar si contact no es null
                if (contact) {
                    // Limpiar el FormArray de clínicas
                    (this.contactForm.get('clinicas') as UntypedFormArray).clear();
                    
                    // Actualizar el formulario con los datos generales, incluyendo isProfesional
                    this.contactForm.patchValue({
                        id_usuario: contact.id_usuario,
                        id_gestor: contact.id_gestor,
                        avatar: contact.avatar,
                        nombre: contact.nombre,
                        apellidos: contact.apellidos,
                        email_usuario: contact.email_usuario,
                        email_factura: contact.email_factura,
                        email_notificacion: contact.email_notificacion,
                        cargo_usuario: contact.cargo_usuario,
                        cumpleanos: contact.cumpleanos,
                        notas_usuario: contact.notas_usuario,
                        telefono: contact.telefono,
                        password_usuario: contact.password_usuario,
                        isProfesional: contact.isProfesional,
                        selectedClinicaId: (contact.clinicas && contact.clinicas.length > 0) ? contact.clinicas[0].id_clinica : ''
                    });
                    
                    console.log('Datos del contacto obtenido:', contact);
                    
                    // Llenar el FormArray "clinicas" con las asignaciones actuales
                    this.loadUserClinicas(contact);
                }
                
                // Marcar para verificación de cambios
                this._changeDetectorRef.markForCheck();
            });
    }

    loadUserClinicas(contact: Contact): void {
        // Usamos cast a any para verificar si existe la propiedad "Clinicas" (con C mayúscula)
        const clinicsData = ((contact as any).Clinicas) ? (contact as any).Clinicas : contact.clinicas;
        if (clinicsData && clinicsData.length > 0) {
            const formArray = this.contactForm.get('clinicas') as UntypedFormArray;
            formArray.clear();
            clinicsData.forEach(clinica => {
                formArray.push(this._formBuilder.group({
                    id_clinica: [clinica.id_clinica],
                    rol_clinica: [(clinica as any).UsuarioClinica ? (clinica as any).UsuarioClinica.rol_clinica : ''],
                    subrol_clinica: [(clinica as any).UsuarioClinica ? (clinica as any).UsuarioClinica.subrol_clinica : '']
                }));
            });
            console.log('Formulario de clínicas después de cargar:', formArray.value);
        }
    }

    addClinicaField(): void {
        const clinicasArray = this.contactForm.get('clinicas') as UntypedFormArray;
        clinicasArray.push(this._formBuilder.group({
            id_clinica: ['', Validators.required],
            rol_clinica: ['', Validators.required],
            subrol_clinica: ['']
        }));
        console.log('Formulario de clínicas después de añadir:', clinicasArray.value);
        this._changeDetectorRef.markForCheck();
    }

    removeClinicaField(index: number): void {
        const clinicasArray = this.contactForm.get('clinicas') as UntypedFormArray;
        clinicasArray.removeAt(index);
        console.log('Formulario de clínicas después de eliminar:', clinicasArray.value);
        this._changeDetectorRef.markForCheck();
    }

    hasClinicas(): boolean {
        const clinicasArray = this.contactForm.get('clinicas') as UntypedFormArray;
        return clinicasArray.length > 0;
    }

    // Método closeDrawer para el guard en las rutas
    closeDrawer(): Promise<MatDrawerToggleResult> {
        return this._contactsListComponent.matDrawer.close();
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
        this.contactForm.get('newPassword').reset();
    }

    updateContact(): void {
        const contactData = this.contactForm.getRawValue();
        console.log('Enviando datos para actualizar:', contactData);
    
        if (this.showPasswordChange && contactData.newPassword && contactData.newPassword.trim() !== '') {
            contactData.password_usuario = contactData.newPassword;
        } else {
            delete contactData.password_usuario;
        }
    
        this._contactsService.updateContact(contactData.id_usuario, contactData).subscribe({
            next: (response: any) => {
                const updatedContact = response.user ? response.user : response;
                console.log('Contacto actualizado con éxito:', updatedContact);
                this.contact = updatedContact;
    
                const clinicsData = (updatedContact.Clinicas) ? updatedContact.Clinicas : updatedContact.clinicas;
                const clinicasFormArray = this.contactForm.get('clinicas') as UntypedFormArray;
                if (clinicsData && Array.isArray(clinicsData)) {
                    clinicasFormArray.clear();
                    clinicsData.forEach(clinica => {
                        clinicasFormArray.push(this._formBuilder.group({
                            id_clinica: [clinica.id_clinica],
                            rol_clinica: [(clinica as any).UsuarioClinica ? (clinica as any).UsuarioClinica.rol_clinica : ''],
                            subrol_clinica: [(clinica as any).UsuarioClinica ? (clinica as any).UsuarioClinica.subrol_clinica : '']
                        }));
                    });
                }
    
                this.contactForm.patchValue(updatedContact);
                this._changeDetectorRef.detectChanges();
                this.toggleEditMode(false);
                this._snackBar.open('User updated', 'Close', { duration: 3000 });
            },
            error: (error) => {
                console.error('Error updating contact:', error);
                let errorMessage = 'Error updating user';
                if (error.error && error.error.sqlMessage) {
                    errorMessage = error.error.sqlMessage;
                }
                this._snackBar.open(errorMessage, 'Close', { duration: 5000 });
            }
        });
    }
    
    // ✅ MÉTODO DELETECONTACT CORREGIDO SIGUIENDO PRÁCTICAS DE FUSE
    deleteContact(): void {
        // Abrir el diálogo de confirmación
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete contact',
            message: 'Are you sure you want to delete this contact? This action cannot be undone!',
            actions: { confirm: { label: 'Delete' } },
        });
        
        // Suscribirse al cierre del diálogo de confirmación
        confirmation.afterClosed().subscribe((result) => {
            // Si se presionó el botón confirmar...
            if (result === 'confirmed') {
                // Obtener el ID del contacto actual
                const id_usuario = this.contact.id_usuario;
                
                // Obtener el índice del contacto actual y calcular el siguiente
                const currentContactIndex = this.contacts.findIndex(
                    (item) => item.id_usuario === id_usuario
                );
                const nextContactIndex =
                    currentContactIndex +
                    (currentContactIndex === this.contacts.length - 1 ? -1 : 1);
                const nextContactId =
                    this.contacts.length === 1 && this.contacts[0].id_usuario === id_usuario
                        ? null
                        : this.contacts[nextContactIndex].id_usuario;
                
                // Eliminar el contacto
                this._contactsService.deleteContact(id_usuario).subscribe((isDeleted) => {
                    // Retornar si el contacto no fue eliminado...
                    if (!isDeleted) {
                        return;
                    }
                    
                    // Navegar al siguiente contacto si está disponible
                    if (nextContactId) {
                        this._router.navigate(['../', nextContactId], {
                            relativeTo: this._activatedRoute,
                        });
                    }
                    // De lo contrario, navegar al padre
                    else {
                        this._router.navigate(['../'], {
                            relativeTo: this._activatedRoute,
                        });
                    }
                    
                    // Desactivar el modo de edición
                    this.toggleEditMode(false);
                });
                
                // Marcar para verificación de cambios
                this._changeDetectorRef.markForCheck();
            }
        });
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
        this._contactsService.uploadAvatar(this.contact.id_usuario, file).subscribe();
    }
    
    removeAvatar(): void {
        const avatarControl = this.contactForm.get('avatar');
        avatarControl.setValue(null);
        this._avatarFileInput.nativeElement.value = null;
        this.contact.avatar = null;
    }
    
    addEmailField(): void {
        const emailGroup = this._formBuilder.group({
            email_usuario: [''],
            label: [''],
        });
        (this.contactForm.get('emails') as UntypedFormArray).push(emailGroup);
        this._changeDetectorRef.markForCheck();
    }
    
    removeEmailField(index: number): void {
        const emailsArray = this.contactForm.get('emails') as UntypedFormArray;
        emailsArray.removeAt(index);
        this._changeDetectorRef.markForCheck();
    }
    
    addPhoneNumberField(): void {
        const phoneGroup = this._formBuilder.group({
            phoneNumber: [''],
            label: [''],
        });
        (this.contactForm.get('phoneNumbers') as UntypedFormArray).push(phoneGroup);
        this._changeDetectorRef.markForCheck();
    }
    
    removePhoneNumberField(index: number): void {
        const phoneNumbersArray = this.contactForm.get('phoneNumbers') as UntypedFormArray;
        phoneNumbersArray.removeAt(index);
        this._changeDetectorRef.markForCheck();
    }
    
    trackByFn(index: number, item: any): any {
        return item.id_usuario || index;
    }
}