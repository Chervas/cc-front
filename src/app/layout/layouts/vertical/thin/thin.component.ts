import { NgIf, NgFor, TitleCasePipe, KeyValuePipe, AsyncPipe } from '@angular/common'; // ✅ AGREGADO: AsyncPipe
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { QuickChatComponent } from 'app/layout/common/quick-chat/quick-chat.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from 'app/core/auth/auth.service';
import { ContactsService } from 'app/modules/admin/apps/contacts/contacts.service';
import { PacientesService } from 'app/modules/admin/apps/pacientes/pacientes.service';
import { ClinicSelectorComponent } from 'app/modules/admin/apps/clinicas/clinic-selector-component';
import { FuseNavigationService } from '@fuse/components/navigation';
import { ClinicFilterService } from 'app/core/services/clinic-filter-service';

// 🔐 IMPORTAR SERVICIO DE ROLES CON SEGURIDAD
import { RoleService, UserRole, ClinicaConRol, UsuarioConRoles } from 'app/core/services/role.service';
import { ROLE_CONFIG, SECURITY_MESSAGES } from 'app/core/constants/role.constants';

@Component({
    selector: 'thin-layout',
    templateUrl: './thin.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        MatButtonModule,
        MatIconModule,
        LanguagesComponent,
        FuseFullscreenComponent,
        SearchComponent,
        ShortcutsComponent,
        MessagesComponent,
        NotificationsComponent,
        UserComponent,
        NgIf,
        NgFor,
        RouterOutlet,
        QuickChatComponent,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        TitleCasePipe,
        KeyValuePipe,
        AsyncPipe, // ✅ AGREGADO: AsyncPipe para usar observables en template
        ClinicSelectorComponent
    ]
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: Navigation;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // 🔐 PROPIEDADES SIMPLIFICADAS CON SEGURIDAD
    currentUser$ = this.roleService.currentUser$;
    selectedRole$ = this.roleService.selectedRole$;
    availableRoles$ = this.roleService.availableRoles$;
    isRoleValid$ = this.roleService.isRoleValid$;
    
    // 🎯 PROPIEDADES LOCALES
    filteredClinics: ClinicaConRol[] = [];
    groupedClinics: { [group: string]: ClinicaConRol[] } = {};
    selectedClinic: any = null;
    
    // 🔐 CONFIGURACIÓN Y CONSTANTES
    readonly UserRole = UserRole;
    readonly ROLE_LABELS = ROLE_CONFIG.ROLE_LABELS;
    readonly ROLE_COLORS = ROLE_CONFIG.ROLE_COLORS;
    readonly ROLE_ICONS = ROLE_CONFIG.ROLE_ICONS;

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private authService: AuthService,
        private contactsService: ContactsService,
        private _pacientesService: PacientesService,
        private _fuseNavigationService: FuseNavigationService,
        private _clinicFilterService: ClinicFilterService,
        // 🔐 SERVICIO DE ROLES CENTRALIZADO
        private roleService: RoleService
    ) {}

    get currentYear(): number {
        return new Date().getFullYear();
    }

    ngOnInit(): void {
        // 🔐 SUSCRIBIRSE A NAVEGACIÓN
        this._navigationService.navigation$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // 🔐 SUSCRIBIRSE A CAMBIOS DE MEDIOS
        this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });

        // 🔐 INICIALIZACIÓN SIMPLIFICADA Y SEGURA
        this.authService.getCurrentUser().subscribe(user => {
            if (user?.id_usuario) {
                this.loadUserClinics(user);
            } else {
                console.error('🚨 Usuario no válido en getCurrentUser');
                this.roleService.clearUserSession();
            }
        });

        // 🔐 REACCIONAR A CAMBIOS DE ROL CON VALIDACIÓN
        combineLatest([
            this.selectedRole$,
            this.isRoleValid$
        ]).pipe(takeUntil(this._unsubscribeAll))
        .subscribe(([role, isValid]) => {
            if (role && isValid) {
                this.updateClinicsByRole();
            } else if (role && !isValid) {
                console.warn('🚨 Rol seleccionado pero no válido:', role);
                this.showSecurityWarning(SECURITY_MESSAGES.ROLE_VALIDATION_FAILED);
            }
        });

        // 🔐 MONITOREAR VALIDEZ DE ROLES
        this.isRoleValid$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(isValid => {
                if (!isValid) {
                    console.warn('🚨 Roles invalidados');
                    this.filteredClinics = [];
                    this.groupedClinics = {};
                }
            });

        // 🔐 RECUPERAR SELECCIÓN DE CLÍNICA PERSISTIDA
        this.restoreClinicSelection();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // 🎯 MÉTODOS PRINCIPALES SIMPLIFICADOS

    /**
     * 🔐 Cambio de rol con validación de seguridad
     */
    onRoleChange(role: UserRole): void {
        try {
            // 🔐 VALIDACIÓN PREVIA
            if (!this.roleService.hasRole(role)) {
                console.error('🚨 Intento de cambio a rol no autorizado:', role);
                this.showSecurityWarning(SECURITY_MESSAGES.UNAUTHORIZED_ROLE_CHANGE);
                return;
            }

            // 🔐 CAMBIO SEGURO DE ROL
            this.roleService.selectRole(role);
            
            // 🔐 LOG DE SEGURIDAD
            console.log('✅ Cambio de rol exitoso:', {
                newRole: role,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('🚨 Error en cambio de rol:', error);
            this.showSecurityWarning(SECURITY_MESSAGES.INVALID_PERMISSIONS);
        }
    }

    /**
     * 🔐 Cambio de clínica con validación
     */
    onClinicChange(selected: any): void {
        try {
            // 🔐 VALIDAR QUE EL USUARIO TENGA ACCESO A LA CLÍNICA
            if (selected && !this.validateClinicAccess(selected)) {
                console.error('🚨 Intento de acceso a clínica no autorizada:', selected);
                this.showSecurityWarning(SECURITY_MESSAGES.INVALID_PERMISSIONS);
                return;
            }

            this.selectedClinic = selected;
            this.persistClinicSelection(selected);
            this.updateFinalClinicsAndPatients();

        } catch (error) {
            console.error('🚨 Error en cambio de clínica:', error);
        }
    }

    /**
     * 🔐 Obtener etiqueta del rol con fallback seguro
     */
    getRoleLabel(role: UserRole): string {
        return this.ROLE_LABELS[role] || role;
    }

    /**
     * 🔐 Obtener color del rol con fallback seguro
     */
    getRoleColor(role: UserRole): string {
        return this.ROLE_COLORS[role] || '#666666';
    }

    /**
     * 🔐 Obtener icono del rol con fallback seguro
     */
    getRoleIcon(role: UserRole): string {
        return this.ROLE_ICONS[role] || 'heroicons_outline:user';
    }

    /**
     * 🔐 Verificar si el usuario puede realizar una acción
     */
    canPerformAction(action: string): boolean {
        const currentRole = this.roleService.getCurrentRole();
        if (!currentRole) return false;

        const rolePermissions = ROLE_CONFIG.ROLE_PERMISSIONS[currentRole];
        return rolePermissions.includes('*') || rolePermissions.includes(action);
    }

    // 🔧 MÉTODOS PRIVADOS

    /**
     * 🔐 Cargar clínicas del usuario con validación
     */
    private loadUserClinics(user: any): void {
        try {
            if (this.roleService.isAdmin()) {
                console.log('🔐 Cargando clínicas para administrador');
                this.contactsService.getClinicas().subscribe({
                    next: (clinicas) => {
                        this.roleService.initializeUser({ ...user, clinicas });
                    },
                    error: (error) => {
                        console.error('🚨 Error cargando clínicas de admin:', error);
                        this.roleService.clearUserSession();
                    }
                });
            } else {
                console.log('🔐 Cargando clínicas para usuario normal');
                this.contactsService.getClinicasByUser(user.id_usuario).subscribe({
                    next: (response: any) => {
                        this.roleService.initializeUser({ 
                            ...user, 
                            clinicas: response?.clinicas || response || [] 
                        });
                    },
                    error: (error) => {
                        console.error('🚨 Error cargando clínicas de usuario:', error);
                        this.roleService.clearUserSession();
                    }
                });
            }
        } catch (error) {
            console.error('🚨 Error en loadUserClinics:', error);
            this.roleService.clearUserSession();
        }
    }

    /**
     * 🔐 Actualizar clínicas por rol con validación
     */
    private updateClinicsByRole(): void {
        try {
            this.filteredClinics = this.roleService.getClinicasByCurrentRole();
            this.updateGroupedClinics();
            
            console.log('🔐 Clínicas actualizadas por rol:', {
                role: this.roleService.getCurrentRole(),
                count: this.filteredClinics.length
            });

        } catch (error) {
            console.error('🚨 Error actualizando clínicas por rol:', error);
            this.filteredClinics = [];
            this.groupedClinics = {};
        }
    }

    /**
     * 🔐 Agrupar clínicas con validación
     */
    private updateGroupedClinics(): void {
        try {
            this.groupedClinics = this.filteredClinics.reduce((groups, clinica) => {
                const groupName = clinica.grupoClinica?.nombre_grupo || 'Sin grupo';
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(clinica);
                return groups;
            }, {} as { [group: string]: ClinicaConRol[] });

        } catch (error) {
            console.error('🚨 Error agrupando clínicas:', error);
            this.groupedClinics = {};
        }
    }

    /**
     * 🔐 Validar acceso a clínica
     */
    private validateClinicAccess(clinica: any): boolean {
        if (!clinica) return true; // null/undefined es válido (sin selección)
        
        if (this.roleService.isAdmin()) return true; // Admin tiene acceso total
        
        // Verificar que la clínica esté en las clínicas filtradas del usuario
        if (clinica.isGroup) {
            return clinica.clinicasIds.every((id: number) => 
                this.filteredClinics.some(c => c.id_clinica === id)
            );
        } else {
            return this.filteredClinics.some(c => c.id_clinica === clinica.id_clinica);
        }
    }

    /**
     * 🔐 Persistir selección de clínica
     */
    private persistClinicSelection(selected: any): void {
        try {
            if (selected === null) {
                localStorage.removeItem('selectedClinicId');
            } else if (selected.isGroup) {
                const ids = selected.clinicasIds ? selected.clinicasIds.join(',') : '';
                localStorage.setItem('selectedClinicId', ids);
            } else {
                localStorage.setItem('selectedClinicId', String(selected.id_clinica));
            }
        } catch (error) {
            console.error('🚨 Error persistiendo selección de clínica:', error);
        }
    }

    /**
     * 🔐 Restaurar selección de clínica
     */
    private restoreClinicSelection(): void {
        try {
            const storedClinic = localStorage.getItem('selectedClinicId');
            if (storedClinic) {
                if (storedClinic.includes(',')) {
                    this.selectedClinic = {
                        isGroup: true,
                        clinicasIds: storedClinic.split(',').map(id => parseInt(id, 10))
                    };
                } else {
                    // Buscar la clínica cuando las clínicas estén cargadas
                    this.currentUser$.pipe(takeUntil(this._unsubscribeAll))
                        .subscribe(user => {
                            if (user?.clinicas) {
                                const found = user.clinicas.find(c => 
                                    String(c.id_clinica) === storedClinic
                                );
                                if (found) {
                                    this.selectedClinic = found;
                                }
                            }
                        });
                }
            }
        } catch (error) {
            console.error('🚨 Error restaurando selección de clínica:', error);
            localStorage.removeItem('selectedClinicId');
        }
    }

    /**
     * 🔐 Actualizar filtros finales con validación
     */
    private updateFinalClinicsAndPatients(): void {
        try {
            // Lógica de filtrado final basada en la selección actual
            let clinicFilter: string | null = null;

            if (!this.selectedClinic) {
                // Sin selección específica - mostrar todas las clínicas del rol
                const allClinicIds = this.filteredClinics.map(c => c.id_clinica);
                clinicFilter = allClinicIds.length > 0 ? allClinicIds.join(',') : null;
            } else if (this.selectedClinic.isGroup) {
                // Grupo seleccionado
                const validClinicIds = this.selectedClinic.clinicasIds.filter((id: number) =>
                    this.filteredClinics.some(c => c.id_clinica === id)
                );
                clinicFilter = validClinicIds.length > 0 ? validClinicIds.join(',') : null;
            } else {
                // Clínica específica seleccionada
                const isValidClinic = this.filteredClinics.some(c => 
                    c.id_clinica === this.selectedClinic.id_clinica
                );
                if (isValidClinic) {
                    clinicFilter = String(this.selectedClinic.id_clinica);
                } else {
                    // Clínica no válida, resetear selección
                    this.selectedClinic = null;
                    localStorage.removeItem('selectedClinicId');
                    const allClinicIds = this.filteredClinics.map(c => c.id_clinica);
                    clinicFilter = allClinicIds.length > 0 ? allClinicIds.join(',') : null;
                }
            }

            // Aplicar filtros a los servicios
            this._clinicFilterService.setFilteredClinics([...this.filteredClinics]);
            this._clinicFilterService.setSelectedClinicId(clinicFilter);
            this._pacientesService.getPacientes(clinicFilter).subscribe();

        } catch (error) {
            console.error('🚨 Error actualizando filtros finales:', error);
        }
    }

    /**
     * 🔐 Mostrar advertencia de seguridad
     */
    private showSecurityWarning(message: string): void {
        // Aquí podrías integrar con un servicio de notificaciones
        console.warn('🚨 ADVERTENCIA DE SEGURIDAD:', message);
        // TODO: Mostrar notificación al usuario
    }

    /**
     * 🔐 Alternar navegación
     */
    toggleNavigation(name: string): void {
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);
        if (navigation) {
            navigation.toggle();
        }
    }
}

