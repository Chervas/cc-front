import { NgIf, NgFor, TitleCasePipe, KeyValuePipe, AsyncPipe } from '@angular/common'; // ✅ AGREGADO: AsyncPipe
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseNavigationItem } from '@fuse/components/navigation';
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

    // ✅ AGREGADO: Propiedad para el año actual (requerida por template)
    currentYear = new Date().getFullYear();

    // 🔐 PROPIEDADES SIMPLIFICADAS CON SEGURIDAD
    currentUser$ = this.roleService.currentUser$;
    selectedRole$ = this.roleService.selectedRole$;
    availableRoles$ = this.roleService.availableRoles$;
    isRoleValid$ = this.roleService.isRoleValid$;

    // 🚨 PROPIEDADES LOCALES
    filteredClinics: ClinicaConRol[] = [];
    groupedClinics: { [group: string]: ClinicaConRol[] } = {};
    selectedClinic: any = null;

    // 🔐 CONFIGURACIÓN Y CONSTANTES
    readonly UserRole = UserRole;
    readonly ROLE_LABELS = ROLE_CONFIG.ROLE_LABELS;
    readonly ROLE_COLORS = ROLE_CONFIG.ROLE_COLORS;
    readonly ROLE_ICONS = ROLE_CONFIG.ROLE_ICONS;

    // ✅ AGREGADO: Constante para determinar admins localmente
    private readonly ADMIN_USER_IDS = [1]; // Solo el usuario ID: 1 es admin

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
        private roleService: RoleService // ✅ INYECCIÓN DEL SERVICIO DE ROLES
    ) {}

    ngOnInit(): void {
        // Suscribirse a los cambios de medios
        this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });

        // Suscribirse a los cambios de navegación
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // ✅ INICIALIZACIÓN INTEGRADA CON FUSE AUTH
        this.initializeUserWithAuth();

        // ✅ SUSCRIBIRSE A CAMBIOS DE ROLES Y CLÍNICAS
        this.setupRoleSubscriptions();

        // ✅ RESTAURAR SELECCIÓN DE CLÍNICA
        this.restoreClinicSelection();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ✅ INICIALIZACIÓN INTEGRADA CON FUSE AUTH
    private initializeUserWithAuth(): void {
        this.authService.getCurrentUser().subscribe(user => {
            if (user?.id_usuario) {
                console.log('🔗 Usuario obtenido de Fuse Auth:', user.id_usuario);
                this.loadUserClinics(user);
            } else {
                console.log('🔗 No hay usuario autenticado en Fuse');
                this.roleService.clearUserSession();
            }
        });
    }

    /**
     * 🔐 Cargar clínicas del usuario con validación
     * ✅ CORREGIDO: Evalúa isAdmin() DESPUÉS de inicializar el usuario
     */
    private loadUserClinics(user: any): void {
        try {
            // ✅ CORRECCIÓN: Primero evaluar si es admin directamente
            const isUserAdmin = this.ADMIN_USER_IDS.includes(user.id_usuario);
            
            if (isUserAdmin) {
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

    // ✅ CONFIGURAR SUSCRIPCIONES A CAMBIOS DE ROLES
    private setupRoleSubscriptions(): void {
        // Suscribirse a cambios de rol seleccionado
        this.selectedRole$.pipe(takeUntil(this._unsubscribeAll)).subscribe(role => {
            if (role) {
                this.filterClinicsByRole(role);
            }
        });

        // Suscribirse a cambios de usuario actual
        this.currentUser$.pipe(takeUntil(this._unsubscribeAll)).subscribe(user => {
            if (user?.clinicas) {
                this.updateGroupedClinics(user.clinicas);
            }
        });
    }

    // ✅ MÉTODO CORREGIDO: Filtrar clínicas por rol seleccionado
    private filterClinicsByRole(selectedRole: UserRole): void {
        this.currentUser$.pipe(takeUntil(this._unsubscribeAll)).subscribe(user => {
            if (!user?.clinicas) {
                console.log('🔐 No hay clínicas para filtrar');
                this.filteredClinics = [];
                return;
            }

            let filtered: ClinicaConRol[] = [];

            if (selectedRole === UserRole.ADMIN && user.isAdmin) {
                // Admin ve todas las clínicas
                filtered = user.clinicas;
                console.log('🔐 Clínicas filtradas por rol (validado con Fuse):', {
                    role: selectedRole,
                    count: filtered.length,
                    userId: user.id_usuario // ✅ CORREGIDO: usar id_usuario
                });
            } else {
                // Usuarios normales ven solo sus clínicas asignadas con el rol específico
                filtered = user.clinicas.filter(clinica => {
                    // ✅ CORREGIDO: Usar rol_clinica directamente de la clínica
                    const hasRole = clinica.rol_clinica === selectedRole;
                    if (hasRole) {
                        console.log('✅ Clínica incluida:', clinica.nombre_clinica, 'por rol:', selectedRole);
                    }
                    return hasRole;
                });

                console.log('🔐 Clínicas filtradas por rol (validado con Fuse):', {
                    role: selectedRole,
                    count: filtered.length,
                    userId: user.id_usuario // ✅ CORREGIDO: usar id_usuario
                });
            }

            this.filteredClinics = filtered;
            this.updateGroupedClinics(filtered);
            this.updateFinalClinicsAndPatients();
        });
    }

    // ✅ ACTUALIZAR CLÍNICAS AGRUPADAS PARA EL MENÚ LATERAL
    private updateGroupedClinics(clinicas: ClinicaConRol[]): void {
        this.groupedClinics = {};
        
        clinicas.forEach(clinica => {
            const groupName = clinica.grupoClinica?.nombre_grupo || 'Sin Grupo';
            if (!this.groupedClinics[groupName]) {
                this.groupedClinics[groupName] = [];
            }
            this.groupedClinics[groupName].push(clinica);
        });

        // ✅ CORREGIDO: Obtener rol seleccionado del observable
        this.selectedRole$.pipe(takeUntil(this._unsubscribeAll)).subscribe(role => {
            console.log('🔐 Clínicas actualizadas por rol:', {
                role: role,
                count: clinicas.length
            });
        });
    }

    // ✅ EVENTOS DE USUARIO CON VALIDACIÓN DE SEGURIDAD
    onRoleChange(newRole: UserRole): void {
        // ✅ CORREGIDO: Verificar si el rol está disponible
        this.availableRoles$.pipe(takeUntil(this._unsubscribeAll)).subscribe(availableRoles => {
            if (!availableRoles.includes(newRole)) {
                console.error('🚨 Intento de cambio a rol no autorizado:', newRole);
                return;
            }
            this.roleService.selectRole(newRole);
            console.log('🔄 Rol cambiado a:', newRole);
        });
    }

    // ✅ CORREGIDO: Método para manejar selección de clínicas desde clinic-selector
    onClinicChange(clinicData: any): void {
        console.log('🔄 onClinicChange llamado con:', clinicData);
        
        // ✅ CORREGIDO: Manejar tanto objetos de clínica como grupos
        if (!clinicData) {
            console.log('⚠️ No se recibió datos de clínica');
            return;
        }

        // Si es un grupo
        if (clinicData.isGroup) {
            this.selectedClinic = clinicData;
            this.persistClinicSelection(clinicData);
            this.updateFinalClinicsAndPatients();
            console.log('🏥 Grupo seleccionado:', clinicData.nombre_grupo);
            return;
        }

        // Si es una clínica individual
        let clinic: any = null;
        
        if (typeof clinicData === 'number') {
            // Si recibe un ID (compatibilidad hacia atrás)
            clinic = this.filteredClinics.find(c => c.id_clinica === clinicData);
        } else if (clinicData.id_clinica) {
            // Si recibe el objeto completo de la clínica
            clinic = clinicData;
        }

        if (clinic) {
            this.selectedClinic = clinic;
            this._clinicFilterService.setSelectedClinicId(String(clinic.id_clinica));
            this.persistClinicSelection(clinic);
            this.updateFinalClinicsAndPatients();
            console.log('🏥 Clínica seleccionada:', clinic.nombre_clinica);
        } else {
            console.log('⚠️ No se encontró la clínica:', clinicData);
        }
    }

    onGroupChange(group: any): void {
        if (group && group.isGroup) {
            this.selectedClinic = group;
            this.persistClinicSelection(group);
            this.updateFinalClinicsAndPatients();
            console.log('🏥 Grupo seleccionado:', group.nombre_grupo);
        }
    }

    // ✅ MÉTODOS DE UTILIDAD CON SEGURIDAD
    hasPermission(permission: string): boolean {
        // ✅ CORREGIDO: Implementación básica de permisos
        // TODO: Implementar lógica de permisos más avanzada
        return true; // Por ahora retorna true, implementar lógica específica
    }

    getRoleLabel(role: UserRole): string {
        return this.ROLE_LABELS[role] || role;
    }

    getRoleColor(role: UserRole): string {
        return this.ROLE_COLORS[role] || '#666666';
    }

    getRoleIcon(role: UserRole): string {
        return this.ROLE_ICONS[role] || 'heroicons_outline:user';
    }

    /**
     * 🔐 Verificar si una clínica/grupo debe mostrarse
     */
    shouldShowClinic(clinica: any): boolean {
        if (!clinica) return false;
        
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
                
                // ✅ CORREGIDO: Obtener rol seleccionado del observable
                this.selectedRole$.pipe(takeUntil(this._unsubscribeAll)).subscribe(role => {
                    console.log('👤 Usuario: Sin selección específica - mostrando pacientes de todas las clínicas del rol:', role);
                });
            } else if (this.selectedClinic.isGroup) {
                // Grupo seleccionado
                const validClinicIds = this.selectedClinic.clinicasIds.filter((id: number) =>
                    this.filteredClinics.some(c => c.id_clinica === id)
                );
                clinicFilter = validClinicIds.length > 0 ? validClinicIds.join(',') : null;
                console.log('👥 Usuario: Grupo seleccionado - mostrando pacientes del grupo:', this.selectedClinic.nombre_grupo);
            } else {
                // Clínica específica seleccionada
                const isValidClinic = this.filteredClinics.some(c => 
                    c.id_clinica === this.selectedClinic.id_clinica
                );
                if (isValidClinic) {
                    clinicFilter = String(this.selectedClinic.id_clinica);
                    console.log('🏥 Usuario: Clínica específica seleccionada - mostrando pacientes de:', this.selectedClinic.nombre_clinica);
                } else {
                    // Clínica no válida, resetear selección
                    this.selectedClinic = null;
                    localStorage.removeItem('selectedClinicId');
                    const allClinicIds = this.filteredClinics.map(c => c.id_clinica);
                    clinicFilter = allClinicIds.length > 0 ? allClinicIds.join(',') : null;
                    console.log('⚠️ Usuario: Clínica no válida, reseteando a todas las clínicas del rol');
                }
            }

            // Aplicar filtros a los servicios
            this._clinicFilterService.setFilteredClinics([...this.filteredClinics]);
            this._clinicFilterService.setSelectedClinicId(clinicFilter);
            this._pacientesService.getPacientes(clinicFilter).subscribe();

            console.log('📋 Usuario: Cargadas', this.filteredClinics.length, 'clínicas asignadas');
            
            // ✅ CORREGIDO: Obtener roles disponibles del observable
            this.availableRoles$.pipe(takeUntil(this._unsubscribeAll)).subscribe(roles => {
                console.log('📋 Roles disponibles:', roles);
            });

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

