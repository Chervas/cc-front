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
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { QuickChatComponent } from 'app/layout/common/quick-chat/quick-chat.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Subject, takeUntil, Observable, BehaviorSubject } from 'rxjs';
import { RoleService, UsuarioClinicaResponse } from 'app/core/services/role.service';
import { ClinicSelectorComponent } from 'app/modules/admin/apps/clinicas/clinic-selector-component';

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
        SearchComponent, ShortcutsComponent, UserComponent,
        ClinicSelectorComponent
    ]
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: any;
    
    // Propiedades para el sistema de roles
    selectedClinic: UsuarioClinicaResponse | null = null;
    clinicsGrouped: { [group: string]: UsuarioClinicaResponse[] } = {};
    availableRoles$: Observable<UsuarioClinicaResponse[]>;
    selectedRole$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    currentUser: any = null;
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private roleService: RoleService
    ) {
        // Inicializar observables
        this.availableRoles$ = this.roleService.availableRoles$;
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

        // Cargar datos del usuario y clínicas
        this.loadUserData();
        this.loadClinicsData();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ✅ CORREGIDO: Inicialización de navegación simplificada
    private initializeNavigation(): void {
        // Usar navegación por defecto o vacía
        this.navigation = [];
        console.log('📋 [ThinLayout] Navegación inicializada');
    }

    // ✅ CORREGIDO: Toggle de navegación con tipos explícitos
    toggleNavigation(name: string): void {
        try {
            // ✅ TIPADO EXPLÍCITO para evitar error unknown
            const navigationComponent: any = this._fuseNavigationService.getComponent(name);
            
            if (navigationComponent) {
                // Verificar si tiene método toggle
                if (typeof navigationComponent.toggle === 'function') {
                    navigationComponent.toggle();
                    console.log('🔄 [ThinLayout] Toggle navegación exitoso:', name);
                } else {
                    console.warn('⚠️ [ThinLayout] Componente sin método toggle:', name);
                }
            } else {
                console.warn('⚠️ [ThinLayout] Componente de navegación no encontrado:', name);
            }
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error en toggleNavigation:', error);
        }
    }

    // Métodos para el sistema de roles
    private loadUserData(): void {
        this.roleService.currentUser$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(user => {
                this.currentUser = user;
                console.log('👤 [ThinLayout] Usuario cargado:', user);
            });
    }

    private loadClinicsData(): void {
        this.availableRoles$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(clinicas => {
                this.groupClinicsByRole(clinicas);
                console.log('🏥 [ThinLayout] Clínicas agrupadas:', this.clinicsGrouped);
            });
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

    // ✅ CORREGIDO: Usar solo métodos que existen en RoleService
    onClinicSelected(clinica: UsuarioClinicaResponse): void {
        console.log('🎯 [ThinLayout] Clínica seleccionada:', clinica);
        this.selectedClinic = clinica;
        
        // Actualizar el rol seleccionado
        if (clinica.userRole) {
            this.selectedRole$.next(clinica.userRole);
        }
        
        console.log('📝 [ThinLayout] Clínica guardada localmente');
    }

    // Métodos helper para el template
    getCurrentUserInfo(): string {
        if (!this.currentUser) return 'Usuario no disponible';
        return `${this.currentUser.nombre || ''} ${this.currentUser.apellidos || ''}`.trim() || 
               this.currentUser.email_usuario || 'Usuario';
    }

    getSelectedClinicaInfo(): string {
        if (!this.selectedClinic) return 'Sin clínica seleccionada';
        return `${this.selectedClinic.name} (${this.selectedClinic.userRole})`;
    }

    hasAvailableRoles(): boolean {
        return Object.keys(this.clinicsGrouped).length > 0;
    }

    hasSelectedClinica(): boolean {
        return this.selectedClinic !== null;
    }

    getClinicasCount(): number {
        return Object.values(this.clinicsGrouped).flat().length;
    }

    getRolesCount(): number {
        return Object.keys(this.clinicsGrouped).length;
    }

    isCurrentUserAdmin(): boolean {
        return this.currentUser?.isAdmin || false;
    }

    // ✅ CORREGIDO: Usar método existente del RoleService
    getCurrentPermissions(): string[] {
        try {
            return this.roleService.getCurrentPermissions();
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo permisos:', error);
            return [];
        }
    }

    // Método para debugging
    debugRoleSystem(): void {
        console.group('🔍 [ThinLayout] Debug Sistema de Roles');
        console.log('Usuario actual:', this.currentUser);
        console.log('Clínica seleccionada:', this.selectedClinic);
        console.log('Clínicas agrupadas:', this.clinicsGrouped);
        console.log('Rol actual:', this.selectedRole$.value);
        console.log('Permisos actuales:', this.getCurrentPermissions());
        console.log('Es admin:', this.isCurrentUserAdmin());
        console.log('Navegación:', this.navigation);
        
        // ✅ USAR MÉTODO EXISTENTE DEL ROLESERVICE
        this.roleService.debugBackendData();
        console.groupEnd();
    }

    // Getter para el año actual (usado en el template)
    get currentYear(): number {
        return new Date().getFullYear();
    }

    // ✅ MÉTODOS ADICIONALES USANDO SOLO MÉTODOS EXISTENTES
    
    // Método para obtener roles disponibles
    getAvailableRoles(): string[] {
        try {
            return this.roleService.getAvailableRoles();
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo roles:', error);
            return Object.keys(this.clinicsGrouped);
        }
    }

    // Método para verificar si hay un rol seleccionado
    hasSelectedRole(): boolean {
        return this.selectedRole$.value !== '';
    }

    // Método para obtener clínicas de un rol específico
    getClinicasForRole(role: string): UsuarioClinicaResponse[] {
        try {
            return this.roleService.getClinicasByRole(role);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo clínicas por rol:', error);
            return this.clinicsGrouped[role] || [];
        }
    }

    // Método para verificar si una clínica está seleccionada
    isClinicaSelected(clinica: UsuarioClinicaResponse): boolean {
        return this.selectedClinic?.id === clinica.id;
    }

    // Método para obtener el nombre de display de una clínica
    getClinicaDisplayName(clinica: UsuarioClinicaResponse): string {
        return clinica.name || 'Clínica sin nombre';
    }

    // Método para cambio de rol
    onRoleChange(newRole: string): void {
        console.log('🔄 [ThinLayout] Cambio de rol:', newRole);
        this.selectedRole$.next(newRole);
        
        // Limpiar clínica seleccionada si cambia el rol
        if (this.selectedClinic && this.selectedClinic.userRole !== newRole) {
            this.selectedClinic = null;
        }
    }

    // Método para cambio de clínica (compatibilidad)
    onClinicChange(clinica: UsuarioClinicaResponse): void {
        this.onClinicSelected(clinica);
    }

    // ✅ MÉTODOS ADICIONALES USANDO ROLESERVICE EXISTENTE
    
    getRoleLabel(role: string): string {
        try {
            return this.roleService.getRoleLabel(role);
        } catch (error) {
            return role;
        }
    }

    getRoleColor(role: string): string {
        try {
            return this.roleService.getRoleColor(role);
        } catch (error) {
            return '#6b7280';
        }
    }

    getRoleIcon(role: string): string {
        try {
            return this.roleService.getRoleIcon(role);
        } catch (error) {
            return 'person';
        }
    }
}

