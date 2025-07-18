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
    navigation: any;

    // Propiedades para el sistema de roles
    selectedClinic: UsuarioClinicaResponse | null = null;
    clinicsGrouped: { [group: string]: UsuarioClinicaResponse[] } = {};
    availableRoles$: Observable<UsuarioClinicaResponse[]>;
    selectedRole$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    currentUser: any = null;

    // ✅ NUEVA PROPIEDAD: Estado de carga
    isDataLoaded: boolean = false;

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

        // 🚀 NUEVO: Cargar datos con timing correcto usando combineLatest
        this.loadDataWithCorrectTiming();
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

    // 🚀 NUEVO: Método que garantiza timing correcto
    private loadDataWithCorrectTiming(): void {
        console.log('⏳ [ThinLayout] Esperando datos completos...');
        
        combineLatest([
            this.roleService.currentUser$,
            this.roleService.availableRoles$
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
            this.groupClinicsByRole(clinicas);
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

    // ✅ CORREGIDO: Usar solo métodos que existen en RoleService
    onClinicSelected(clinica: UsuarioClinicaResponse): void {
        try {
            this.roleService.selectClinica(clinica);
            this.selectedClinic = clinica;
            console.log('🏥 [ThinLayout] Clínica seleccionada:', clinica.name || clinica.description);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error seleccionando clínica:', error);
        }
    }

    // ✅ CORREGIDO: Usar solo métodos que existen en RoleService
    onRoleSelected(role: string): void {
        try {
            this.roleService.selectRole(role);
            this.selectedRole$.next(role);
            console.log('🎭 [ThinLayout] Rol seleccionado:', role);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error seleccionando rol:', error);
        }
    }

    // ✅ CORREGIDO: Obtener roles disponibles de forma segura
    getAvailableRoles(): string[] {
        try {
            return Object.keys(this.clinicsGrouped);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo roles:', error);
            return [];
        }
    }

    // ✅ CORREGIDO: Obtener clínicas por rol de forma segura
    getClinicsByRole(role: string): UsuarioClinicaResponse[] {
        try {
            return this.clinicsGrouped[role] || [];
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo clínicas por rol:', error);
            return [];
        }
    }

    // ✅ CORREGIDO: Verificar si el usuario tiene un rol específico
    hasRole(role: string): boolean {
        try {
            return this.getAvailableRoles().includes(role);
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error verificando rol:', error);
            return false;
        }
    }

    // ✅ CORREGIDO: Obtener el rol actual seleccionado
    getCurrentRole(): string {
        try {
            return this.selectedRole$.value || this.getAvailableRoles()[0] || '';
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error obteniendo rol actual:', error);
            return '';
        }
    }

    // ✅ CORREGIDO: Verificar si el usuario es administrador
    isAdmin(): boolean {
        try {
            return this.currentUser?.isAdmin === true || this.hasRole('administrador');
        } catch (error) {
            console.warn('⚠️ [ThinLayout] Error verificando admin:', error);
            return false;
        }
    }

    // ✅ CORREGIDO: Obtener información del usuario actual
    getCurrentUser(): any {
        return this.currentUser;
    }

    // ✅ CORREGIDO: Obtener clínica seleccionada actual
    getSelectedClinic(): UsuarioClinicaResponse | null {
        return this.selectedClinic;
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
}

