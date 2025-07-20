import { NgIf, NgFor, TitleCasePipe, AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterOutlet } from '@angular/router';
import { Subject, takeUntil, combineLatest, filter, tap, Observable } from 'rxjs';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseVerticalNavigationComponent } from '@fuse/components/navigation/vertical/vertical.component';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { RoleService, UsuarioClinicaResponse, Usuario } from 'app/core/services/role.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'thin-layout',
    templateUrl: './thin.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        NgIf, NgFor, TitleCasePipe, AsyncPipe, RouterOutlet,
        MatButtonModule, MatIconModule, MatMenuModule, MatSelectModule,
        MatFormFieldModule, MatTooltipModule, MatDividerModule,
        FuseLoadingBarComponent, FuseVerticalNavigationComponent,
        FuseFullscreenComponent
    ],
    standalone: true
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean = false;
    navigation: any[] = [];
    currentUser: Usuario | null = null;
    availableClinicas: UsuarioClinicaResponse[] = [];
    availableRoles: string[] = [];
    currentYear: number = new Date().getFullYear();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseNavigationService: FuseNavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        public roleService: RoleService,
        private _authService: AuthService
    ) {
        console.log('🚀 [ThinLayout] Constructor iniciado');
    }

    ngOnInit(): void {
        console.log('🚀 [ThinLayout] Iniciando componente funcional');

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
                console.log('📱 [ThinLayout] Media change:', { isScreenSmall: this.isScreenSmall, aliases: matchingAliases });
            });

        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(
                takeUntil(this._unsubscribeAll),
                tap(navigation => console.log('🧭 [ThinLayout] Navegación recibida:', { type: Array.isArray(navigation) ? 'Array' : typeof navigation, count: Array.isArray(navigation) ? navigation.length : 'N/A' }))
            )
            .subscribe((navigation: Navigation) => {
                try {
                    if (Array.isArray(navigation)) {
                        this.navigation = navigation;
                        console.log('✅ [ThinLayout] Navegación establecida:', { count: navigation.length, items: navigation.map(n => n.title || n.id) });
                    } else if (navigation && navigation.default) {
                        this.navigation = navigation.default;
                        console.log('✅ [ThinLayout] Navegación establecida (default):', { count: navigation.default.length });
                    } else {
                        this.navigation = [];
                        console.warn('⚠️ [ThinLayout] Navegación no válida:', navigation);
                    }
                } catch (error) {
                    console.error('❌ [ThinLayout] Error procesando navegación:', error);
                    this.navigation = [];
                }
            });

        // Subscribe to current user changes
        this.roleService.currentUser$
            .pipe(
                takeUntil(this._unsubscribeAll),
                tap(user => console.log('👤 [ThinLayout] Usuario actualizado:', user ? `${user.nombre || ''} ${user.apellidos || ''}`.trim() || user.email_usuario : 'null'))
            )
            .subscribe(user => {
                this.currentUser = user;
            });

        // Subscribe to clinicas changes
        this.roleService.clinicas$
            .pipe(
                takeUntil(this._unsubscribeAll),
                tap(clinicas => console.log('🏥 [ThinLayout] Clínicas recibidas:', { count: Array.isArray(clinicas) ? clinicas.length : 0 }))
            )
            .subscribe(clinicas => {
                try {
                    if (Array.isArray(clinicas)) {
                        this.availableClinicas = clinicas;
                        // Extraer roles únicos de las clínicas
                        this.availableRoles = [...new Set(clinicas.map(c => c.userRole))];
                        console.log('🏥 [ThinLayout] Clínicas y roles actualizados:', { 
                            clinicas: clinicas.length, 
                            roles: this.availableRoles 
                        });
                    } else {
                        this.availableClinicas = [];
                        this.availableRoles = [];
                    }
                } catch (error) {
                    console.error('❌ [ThinLayout] Error procesando clínicas:', error);
                    this.availableClinicas = [];
                    this.availableRoles = [];
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // **************************************************
    // Public methods
    // **************************************************

    /**
     * Toggle navigation
     */
    toggleNavigation(): void {
        try {
            const navigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');
            if (navigationComponent && typeof navigationComponent.toggle === 'function') {
                navigationComponent.toggle();
                console.log('🔄 [ThinLayout] Navegación toggled');
            } else {
                console.warn('⚠️ [ThinLayout] No se pudo toggle la navegación');
            }
        } catch (error) {
            console.error('❌ [ThinLayout] Error en toggle navegación:', error);
        }
    }

    /**
     * Get current user name
     */
    getCurrentUserName(): string {
        try {
            if (this.currentUser) {
                const fullName = `${this.currentUser.nombre || ''} ${this.currentUser.apellidos || ''}`.trim();
                return fullName || this.currentUser.email_usuario || 'Usuario';
            }
            return 'Usuario';
        } catch (error) {
            console.error('❌ [ThinLayout] Error obteniendo nombre usuario:', error);
            return 'Usuario';
        }
    }

    /**
     * Get current user initials for avatar
     */
    getCurrentUserInitials(): string {
        try {
            if (this.currentUser) {
                const nombre = this.currentUser.nombre || '';
                const apellidos = this.currentUser.apellidos || '';
                const email = this.currentUser.email_usuario || '';
                
                if (nombre && apellidos) {
                    return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
                } else if (nombre) {
                    return nombre.substring(0, 2).toUpperCase();
                } else if (email) {
                    return email.substring(0, 2).toUpperCase();
                }
            }
            return 'U';
        } catch (error) {
            console.error('❌ [ThinLayout] Error obteniendo iniciales usuario:', error);
            return 'U';
        }
    }

    /**
     * Get available roles
     */
    getAvailableRoles(): string[] {
        try {
            console.log('🎭 [ThinLayout] Roles disponibles:', this.availableRoles);
            return this.availableRoles;
        } catch (error) {
            console.error('❌ [ThinLayout] Error obteniendo roles:', error);
            return [];
        }
    }

    /**
     * Handle role change
     */
    onRoleChange(newRole: string): void {
        try {
            console.log('🎭 [ThinLayout] Cambiando rol a:', newRole);
            this.roleService.setRole(newRole);
        } catch (error) {
            console.error('❌ [ThinLayout] Error cambiando rol:', error);
        }
    }

    /**
     * Get clinics for current role
     */
    getClinicasForCurrentRole(): UsuarioClinicaResponse[] {
        try {
            const currentRole = this.roleService.getCurrentRole();
            if (!currentRole) return [];
            
            const clinicas = this.availableClinicas.filter(c => c.userRole === currentRole);
            console.log('🏥 [ThinLayout] Clínicas para rol actual:', { role: currentRole, count: clinicas.length });
            return clinicas;
        } catch (error) {
            console.error('❌ [ThinLayout] Error obteniendo clínicas para rol:', error);
            return [];
        }
    }

    /**
     * Handle clinic change
     */
    onClinicChange(clinicId: number): void {
        try {
            console.log('🏥 [ThinLayout] Cambiando clínica a ID:', clinicId);
            
            const clinic = this.availableClinicas.find(c => c.id === clinicId);
            if (clinic) {
                this.roleService.setClinica(clinic);
                console.log('✅ [ThinLayout] Clínica cambiada:', clinic.name);
            } else {
                console.warn('⚠️ [ThinLayout] Clínica no encontrada:', clinicId);
            }
        } catch (error) {
            console.error('❌ [ThinLayout] Error cambiando clínica:', error);
        }
    }

    /**
     * Get selected clinic name
     */
    getSelectedClinicName(): string {
        try {
            const selectedClinica = this.roleService.getSelectedClinica();
            return selectedClinica?.name || 'Sin clínica seleccionada';
        } catch (error) {
            console.error('❌ [ThinLayout] Error obteniendo nombre clínica:', error);
            return 'Sin clínica seleccionada';
        }
    }

    /**
     * Get selected clinic ID
     */
    getSelectedClinicId(): number | null {
        try {
            const selectedClinica = this.roleService.getSelectedClinica();
            return selectedClinica?.id || null;
        } catch (error) {
            console.error('❌ [ThinLayout] Error obteniendo ID clínica:', error);
            return null;
        }
    }

    /**
     * Sign out
     */
    signOut(): void {
        try {
            console.log('🚪 [ThinLayout] Cerrando sesión');
            this._authService.signOut();
            this._router.navigate(['/sign-in']);
        } catch (error) {
            console.error('❌ [ThinLayout] Error cerrando sesión:', error);
        }
    }

    /**
     * Debug layout state
     */
    debugLayout(): void {
        console.log('🔍 [ThinLayout] Estado del layout:', {
            isScreenSmall: this.isScreenSmall,
            navigationCount: this.navigation.length,
            currentUser: this.currentUser?.email_usuario,
            availableClinicas: this.availableClinicas.length,
            availableRoles: this.availableRoles,
            currentRole: this.roleService.getCurrentRole(),
            selectedClinic: this.getSelectedClinicName(),
            currentYear: this.currentYear
        });
    }
}

