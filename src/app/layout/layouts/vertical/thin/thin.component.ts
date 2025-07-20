import { NgIf, NgFor, TitleCasePipe, AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { QuickChatComponent } from 'app/layout/common/quick-chat/quick-chat.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Subject, takeUntil, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { RoleService, UsuarioClinicaResponse } from 'app/core/services/role.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'thin-layout',
    templateUrl: './thin.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        NgIf, NgFor, TitleCasePipe, AsyncPipe, RouterOutlet,
        MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatOptionModule,
        FuseLoadingBarComponent, FuseVerticalNavigationComponent, FuseFullscreenComponent,
        LanguagesComponent, MessagesComponent, NotificationsComponent, QuickChatComponent,
        SearchComponent, ShortcutsComponent, UserComponent
    ]
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: Navigation;

    // Propiedades para el sistema de roles
    selectedClinic: UsuarioClinicaResponse | null = null;
    clinicsGrouped: { [group: string]: UsuarioClinicaResponse[] } = {};
    
    // ✅ CORREGIDO: Usar Observable de clínicas en lugar de availableRoles$
    availableRoles$: Observable<UsuarioClinicaResponse[]>;
    selectedRole$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    currentUser: any = null;

    // ✅ NUEVA PROPIEDAD: Estado de carga
    isDataLoaded: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _navigationService: NavigationService,
        private roleService: RoleService
    ) {
        // ✅ CORREGIDO: Usar clinicas$ en lugar de availableRoles$
        this.availableRoles$ = this.roleService.clinicas$;
    }

    ngOnInit(): void {
        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });

        // ✅ CORREGIDO: Inicializar navegación sin métodos inexistentes
        this.initializeNavigation();

        // 🚀 NUEVO: Cargar datos con timing correcto usando combineLatest
        this.loadDataWithCorrectTiming();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ✅ CORREGIDO: Inicialización de navegación simplificada
    private initializeNavigation(): void {
        // Usar estructura de navegación vacía para evitar errores antes de cargar
        this.navigation = {compact: [], default: [], futuristic: [], horizontal: []};
        console.log('📋 [ThinLayout] Navegación inicializada');
    }

    // 🚀 NUEVO: Método que garantiza timing correcto
    private loadDataWithCorrectTiming(): void {
        console.log('⏳ [ThinLayout] Esperando datos completos...');
        
        combineLatest([
            this.roleService.currentUser$,
            this.roleService.clinicas$  // ✅ CORREGIDO: Usar clinicas$ en lugar de availableRoles$
        ]).pipe(
            takeUntil(this._unsubscribeAll),
            // ✅ FILTRO: Solo proceder cuando ambos datos estén disponibles
            filter(([user, clinicas]) => {
                const hasUser = user !== null;
                const hasClinics = Array.isArray(clinicas) && clinicas.length > 0;
                
                if (!hasUser) {
                    console.log('⏳ [ThinLayout] Esperando usuario...');
                }
                if (!hasClinics) {
                    console.log('⏳ [ThinLayout] Esperando clínicas...');
                }
                
                return hasUser && hasClinics;
            })
        ).subscribe(([user, clinicas]) => {
            // ✅ DATOS COMPLETOS: Procesar todo junto
            this.currentUser = user;
            
            // ✅ CORREGIDO: Verificar que clinicas no sea undefined
            if (clinicas && Array.isArray(clinicas)) {
                this.groupClinicsByRole(clinicas);
            }
            
            this.isDataLoaded = true;
            
            console.log('✅ [ThinLayout] Datos completos cargados:');
            console.log('👤 [ThinLayout] Usuario:', user);
            console.log('🏥 [ThinLayout] Clínicas agrupadas:', this.clinicsGrouped);
        });
    }

    // ✅ CORREGIDO: Toggle de navegación con tipos explícitos
    toggleNavigation(name: string): void {
        try {
            // ✅ TIPADO EXPLÍCITO para evitar error unknown
            const navigationComponent: any = this._fuseNavigationService.getComponent(name);
            
            if (navigationComponent) {
                navigationComponent.toggle();
            } else {
                console.warn('⚠️ [ThinLayout] Componente de navegación no encontrado:', name);
            }
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error en toggleNavigation:', error);
        }
    }

    private groupClinicsByRole(clinicas: UsuarioClinicaResponse[]): void {
        this.clinicsGrouped = clinicas.reduce((groups, clinica) => {
            const roleName = clinica.userRole || 'Sin rol';
            if (!groups[roleName]) {
                groups[roleName] = [];
            }
            groups[roleName].push(clinica);
            return groups;
        }, {} as { [group: string]: UsuarioClinicaResponse[] });
    }

    // ✅ CORREGIDO: Usar setClinica en lugar de selectClinica
    onClinicSelected(clinica: UsuarioClinicaResponse): void {
        try {
            this.roleService.setClinica(clinica);  // ✅ CORREGIDO: setClinica existe
            this.selectedClinic = clinica;
            console.log('🏥 [ThinLayout] Clínica seleccionada:', clinica.name || clinica.description);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error seleccionando clínica:', error);
        }
    }

    // ✅ CORREGIDO: Usar setRole en lugar de selectRole
    onRoleSelected(role: string): void {
        try {
            this.roleService.setRole(role);  // ✅ CORREGIDO: setRole existe
            this.selectedRole$.next(role);
            console.log('🎭 [ThinLayout] Rol seleccionado:', role);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error seleccionando rol:', error);
        }
    }

    // ✅ CORREGIDO: Obtener roles disponibles usando getAvailableRoles()
    getAvailableRoles(): string[] {
        try {
            // ✅ USAR MÉTODO QUE EXISTE: getAvailableRoles()
            return this.roleService.getAvailableRoles();
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo roles:', error);
            return [];
        }
    }

    // ✅ CORREGIDO: Obtener clínicas por rol usando método del RoleService
    getClinicsByRole(role: string): UsuarioClinicaResponse[] {
        try {
            // ✅ USAR MÉTODO QUE EXISTE: getClinicasByRole()
            return this.roleService.getClinicasByRole(role);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo clínicas por rol:', error);
            return [];
        }
    }

    // ✅ CORREGIDO: Verificar si el usuario tiene un rol específico usando RoleService
    hasRole(role: string): boolean {
        try {
            // ✅ USAR MÉTODO QUE EXISTE: hasRole()
            return this.roleService.hasRole(role);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error verificando rol:', error);
            return false;
        }
    }

    // ✅ CORREGIDO: Obtener el rol actual usando RoleService
    getCurrentRole(): string {
        try {
            // ✅ USAR MÉTODO QUE EXISTE: getCurrentRole()
            return this.roleService.getCurrentRole() || '';
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo rol actual:', error);
            return '';
        }
    }

    // ✅ CORREGIDO: Verificar si el usuario es administrador usando RoleService
    isAdmin(): boolean {
        try {
            // ✅ USAR MÉTODO QUE EXISTE: isAdmin()
            return this.roleService.isAdmin();
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error verificando admin:', error);
            return false;
        }
    }

    // ✅ CORREGIDO: Obtener información del usuario actual usando RoleService
    getCurrentUser(): any {
        try {
            // ✅ USAR MÉTODO QUE EXISTE: getCurrentUser()
            return this.roleService.getCurrentUser();
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo usuario actual:', error);
            return null;
        }
    }

    // ✅ CORREGIDO: Obtener clínica seleccionada usando RoleService
    getSelectedClinic(): UsuarioClinicaResponse | null {
        try {
            // ✅ USAR MÉTODO QUE EXISTE: getSelectedClinica()
            return this.roleService.getSelectedClinica();
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo clínica seleccionada:', error);
            return null;
        }
    }

    // ✅ CORREGIDO: Verificar si hay datos cargados
    hasDataLoaded(): boolean {
        return this.isDataLoaded;
    }

    // ✅ NUEVO: Verificar si hay roles disponibles (requerido por template)
    hasAvailableRoles(): boolean {
        try {
            return this.getAvailableRoles().length > 0;
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error verificando roles disponibles:', error);
            return false;
        }
    }

    // ✅ NUEVO: Métodos requeridos por el template HTML
    getCurrentUserInfo(): string {
        try {
            const user = this.getCurrentUser();
            if (!user) return '';
            return `${user.nombre || ''} ${user.apellidos || ''}`.trim() || 
                   user.name || 
                   'Usuario';
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo info del usuario:', error);
            return 'Usuario';
        }
    }

    getSelectedClinicaInfo(): string {
        try {
            const clinica = this.getSelectedClinic();
            if (!clinica) return '';
            return clinica.name || 
                   clinica.description || 
                   'Clínica seleccionada';
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo info de clínica:', error);
            return '';
        }
    }

    hasSelectedClinica(): boolean {
        try {
            return this.getSelectedClinic() !== null;
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error verificando clínica seleccionada:', error);
            return false;
        }
    }
}

/**
 * 📋 ERRORES CORREGIDOS:
 * 
 * 1. ✅ ERROR: Property 'availableRoles$' does not exist
 *    SOLUCIÓN: Usar this.roleService.clinicas$ en lugar de availableRoles$
 * 
 * 2. ✅ ERROR: Property 'selectClinica' does not exist
 *    SOLUCIÓN: Usar this.roleService.setClinica() en lugar de selectClinica()
 * 
 * 3. ✅ ERROR: Property 'selectRole' does not exist
 *    SOLUCIÓN: Usar this.roleService.setRole() en lugar de selectRole()
 * 
 * 4. ✅ ERROR: Tuple type '[any]' of length '1' has no element
 *    SOLUCIÓN: Usar destructuring correcto en combineLatest
 * 
 * 5. ✅ ERROR: 'clinicas' is possibly 'undefined'
 *    SOLUCIÓN: Agregar verificación de undefined antes de usar clinicas
 * 
 * 6. ✅ MEJORAS ADICIONALES:
 *    - Usar métodos del RoleService en lugar de lógica local
 *    - Manejo de errores mejorado con try-catch
 *    - Logs más informativos
 *    - Compatibilidad total con la nueva implementación del RoleService
 * 
 * 📊 RESULTADO:
 * - ✅ Compilación sin errores
 * - ✅ Funcionalidad mantenida
 * - ✅ Compatible con RoleService actualizado
 * - ✅ Manejo de errores robusto
 */

