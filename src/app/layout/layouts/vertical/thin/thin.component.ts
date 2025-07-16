import { NgIf, NgFor, TitleCasePipe, KeyValuePipe, AsyncPipe } from '@angular/common';
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

// 🎭 IMPORTAR SERVICIO DE ROLES CON SEGURIDAD
import { RoleService, UserRole, ClinicaConRol, UsuarioConRoles } from 'app/core/services/role.service';
// 🔧 IMPORTS CORREGIDOS - Importar directamente en lugar de ROLE_CONFIG
import { 
    ROLE_CONFIG, 
    SECURITY_MESSAGES,
    ROLE_COLORS,     // ← Importar directamente
    ROLE_LABELS,     // ← Importar directamente  
    ROLE_ICONS       // ← Importar directamente
} from 'app/core/constants/role.constants';

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

    // 🎭 PROPIEDADES SIMPLIFICADAS CON SEGURIDAD
    currentUser$ = this.roleService.currentUser$;
    selectedRole$ = this.roleService.selectedRole$;
    availableRoles$ = this.roleService.availableRoles$;
    isRoleValid$ = this.roleService.isRoleValid$;

    // 🏥 PROPIEDADES LOCALES
    filteredClinics: ClinicaConRol[] = [];
    groupedClinics: { [group: string]: ClinicaConRol[] } = {};
    selectedClinic: any = null;

    // 🎯 CONFIGURACIÓN Y CONSTANTES
    readonly UserRole = UserRole;
    // 🔧 USAR IMPORTS DIRECTOS EN LUGAR DE ROLE_CONFIG
    readonly ROLE_LABELS = ROLE_LABELS;
    readonly ROLE_COLORS = ROLE_COLORS;
    readonly ROLE_ICONS = ROLE_ICONS;

    // ✅ AGREGADO: Constante para determinar admins localmente
    private readonly ADMIN_USER_IDS = [1]; // Solo el usuario ID: 1 es admin

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private authService: AuthService,
        private contactsService: ContactsService,
        private pacientesService: PacientesService,
        private _fuseNavigationService: FuseNavigationService,
        private clinicFilterService: ClinicFilterService,
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
                console.log('🔐 Usuario obtenido de Fuse Auth:', user.id_usuario);
                this.loadUserClinics(user);
            }
        });
    }

    // 🏥 CARGAR CLÍNICAS DEL USUARIO
    private loadUserClinics(user: any): void {
        this.roleService.loadUserRoles(user.id_usuario).subscribe({
            next: (clinicas: ClinicaConRol[]) => {
                console.log('🏥 Clínicas cargadas:', clinicas);
                this.filteredClinics = clinicas;
                this.updateGroupedClinics();
                this.updateFinalClinicsAndPatients();
            },
            error: (error) => {
                console.error('❌ Error cargando clínicas:', error);
                this.showSecurityWarning('Error al cargar clínicas del usuario');
            }
        });

        // Cargar pacientes si es necesario
        this.pacientesService.getPacientes().subscribe({
            next: (pacientes) => {
                console.log('👥 Pacientes cargados:', pacientes.length);
            },
            error: (error) => {
                console.error('❌ Error cargando pacientes:', error);
            }
        });
    }

    // 🔄 CONFIGURAR SUSCRIPCIONES A CAMBIOS DE ROLES
    private setupRoleSubscriptions(): void {
        // Suscribirse a cambios en el rol seleccionado
        this.selectedRole$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(role => {
                if (role) {
                    this.filterClinicsByRole(role);
                }
            });
    }

    // 🎭 FILTRAR CLÍNICAS POR ROL
    private filterClinicsByRole(role: UserRole): void {
        // Implementar lógica de filtrado según el rol
        console.log('🎭 Filtrando clínicas por rol:', role);
        this.updateGroupedClinics();
    }

    // 📊 ACTUALIZAR CLÍNICAS AGRUPADAS
    private updateGroupedClinics(): void {
        this.groupedClinics = {};
        this.filteredClinics.forEach(clinica => {
            const group = clinica.grupo || 'Sin Grupo';
            if (!this.groupedClinics[group]) {
                this.groupedClinics[group] = [];
            }
            this.groupedClinics[group].push(clinica);
        });
    }

    // 🎭 CAMBIO DE ROL
    onRoleChange(newRole: UserRole): void {
        console.log('🎭 Cambio de rol a:', newRole);
        this.roleService.setSelectedRole(newRole);
        this.filterClinicsByRole(newRole);
        this.persistClinicSelection();
    }

    // 🏥 CAMBIO DE CLÍNICA
    onClinicChange(clinica: ClinicaConRol): void {
        console.log('🏥 Cambio de clínica a:', clinica.nombre_clinica);
        this.selectedClinic = clinica;
        this.clinicFilterService.setSelectedClinic(clinica);
        this.persistClinicSelection();
        this.updateFinalClinicsAndPatients();
    }

    // 📁 CAMBIO DE GRUPO
    onGroupChange(group: string): void {
        console.log('📁 Cambio de grupo a:', group);
        // Implementar lógica de cambio de grupo si es necesario
    }

    // 🔐 VERIFICAR PERMISOS
    hasPermission(permission: string): boolean {
        try {
            const result = this.roleService.hasPermission(permission);
            if (result && typeof result.subscribe === 'function') {
                // Es Observable - manejar asincrónicamente
                result.subscribe(hasPermission => {
                    return (hasPermission as unknown) as boolean;
                });
                return false; // Por defecto false hasta que se resuelva
            } else {
                return (result as unknown) as boolean;
            }
        } catch (error) {
            console.error('❌ Error verificando permiso:', error);
            return false;
        }
    }

    // 🏷️ OBTENER ETIQUETA DE ROL
    getRoleLabel(role: UserRole): string {
        return ROLE_LABELS[role] || 'Desconocido';
    }

    // 🎨 OBTENER COLOR DE ROL
    getRoleColor(role: UserRole): string {
        return ROLE_COLORS[role] || '#666666';
    }

    // 🎯 OBTENER ICONO DE ROL
    getRoleIcon(role: UserRole): string {
        return ROLE_ICONS[role] || 'help';
    }

    // 👁️ DETERMINAR SI MOSTRAR CLÍNICA
    shouldShowClinic(clinica: ClinicaConRol): boolean {
        // Implementar lógica de visibilidad según permisos
        return true; // Por ahora mostrar todas
    }

    // 💾 PERSISTIR SELECCIÓN DE CLÍNICA
    private persistClinicSelection(): void {
        if (this.selectedClinic) {
            localStorage.setItem('selectedClinic', JSON.stringify(this.selectedClinic));
        }
    }

    // 🔄 RESTAURAR SELECCIÓN DE CLÍNICA
    private restoreClinicSelection(): void {
        const saved = localStorage.getItem('selectedClinic');
        if (saved) {
            try {
                this.selectedClinic = JSON.parse(saved);
                this.clinicFilterService.setSelectedClinic(this.selectedClinic);
            } catch (error) {
                console.error('❌ Error restaurando selección de clínica:', error);
            }
        }
    }

    // 🔄 ACTUALIZAR CLÍNICAS Y PACIENTES FINALES
    private updateFinalClinicsAndPatients(): void {
        // Implementar lógica de actualización final
        console.log('🔄 Actualizando clínicas y pacientes finales');
    }

    // ⚠️ MOSTRAR ADVERTENCIA DE SEGURIDAD
    private showSecurityWarning(message: string): void {
        console.warn('⚠️ Advertencia de seguridad:', message);
        // Implementar notificación visual si es necesario
    }
}

