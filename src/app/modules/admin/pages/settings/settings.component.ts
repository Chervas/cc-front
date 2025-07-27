// cc-front/src/app/modules/admin/pages/settings/settings.component.ts
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
// CORRECCIÓN AQUÍ: Cambiado a 'connected-accounts' (con dos 'n')
import { SettingsConnectedAccountsComponent } from './connected-accounts/connected-accounts.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
// ✅ ADICIÓN MÍNIMA: Importar el componente de jobs monitoring
import { JobsMonitoringComponent } from './jobs-monitoring/jobs-monitoring.component';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        NgClass,
        NgFor,
        NgIf,
        SettingsConnectedAccountsComponent,
        MatSnackBarModule,
        // ✅ ADICIÓN MÍNIMA: Agregar el componente de jobs monitoring
        JobsMonitoringComponent
    ],
})
export class SettingsComponent implements OnInit, OnDestroy {
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    selectedPanel: string = 'connected-accounts';
    
    panels = [
        {
            id: 'connected-accounts',
            title: 'Cuentas Conectadas',
            description: 'Gestiona las conexiones con redes sociales',
            icon: 'heroicons_outline:link'
        }
        // ✅ ADICIÓN MÍNIMA: Solo agregar panel de jobs si es admin
        // Se agrega dinámicamente en ngOnInit después de cargar datos
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _snackBar: MatSnackBar,
        private _httpClient: HttpClient
    ) {
        // ✅ CORRECCIÓN: Mover la verificación de admin a ngOnInit para asegurar que los datos estén cargados
        console.log('🔧 [Settings] Constructor ejecutado');
    }

    ngOnInit(): void {
        console.log('🚀 [Settings] ngOnInit iniciado');
        
        this._checkScreenSize();

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.drawerMode = matchingAliases.includes('lg') ? 'side' : 'over';
                this.drawerOpened = matchingAliases.includes('lg');
                this._changeDetectorRef.markForCheck();
            });

        // ✅ CORRECCIÓN: Verificar admin después de un pequeño delay para asegurar que los datos estén cargados
        setTimeout(() => {
            this._checkAdminAndAddPanel();
        }, 100);

        // ✅ Verificar si hay un mensaje de éxito pendiente después del reload
        this._checkForSuccessMessage();

        // ✅ Procesar los query params de la URL (modificado para mostrar snackbar)
        this._route.queryParamMap
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((params) => {
                const connected = params.get('connected');
                const error = params.get('error');
                const userId = params.get('userId');
                const userName = params.get('userName');
                const userEmail = params.get('userEmail');
                const accessToken = params.get('accessToken');
                const metaDenied = params.get('meta_denied');

                if (connected === 'meta' && userId && userName && userEmail && accessToken) {
                    // Almacenar los datos en localStorage como en la versión anterior
                    localStorage.setItem('meta_access_token', accessToken);

                    console.log('✅ Datos de Meta almacenados en localStorage:', {
                        userId,
                        userName,
                        userEmail,
                        accessToken: accessToken.substring(0, 20) + '...'
                    });

                    // ✅ Preparar mensaje de éxito para después del reload
                    const successData = {
                        platform: 'Meta',
                        userName: userName,
                        userEmail: userEmail
                    };
                    localStorage.setItem('auth_success_pending', JSON.stringify(successData));

                    this.selectedPanel = 'connected-accounts';

                    // ✅ Limpiar query params y recargar inmediatamente (sin mostrar snackbar)
                    this._router.navigate([], {
                        queryParams: {
                            connected: null,
                            error: null,
                            userId: null,
                            userName: null,
                            userEmail: null,
                            accessToken: null
                        },
                        queryParamsHandling: 'merge',
                        replaceUrl: true
                    }).then(() => {
                        setTimeout(() => {
                            window.location.reload();
                        }, 100);
                    });
                } else if (metaDenied === 'true') {
                    this.selectedPanel = 'connected-accounts';
                    this._snackBar.open('❌ Has rechazado conectar tu clínica con Meta. Si lo haces por seguridad te adelanto que es completamente seguro, puedes intentarlo más adelante.', 'Cerrar', {
                        duration: 8000,
                        panelClass: ['snackbar-warning']
                    });
                } else if (error) {
                    this.selectedPanel = 'connected-accounts';
                    this._snackBar.open(`Error al conectar cuenta: ${error}`, 'Cerrar', {
                        duration: 6000,
                        panelClass: ['snackbar-error']
                    });
                }

                // ✅ Limpiar query params de la URL para errores
                if (error || metaDenied) {
                    this._router.navigate([], {
                        queryParams: {
                            connected: null,
                            error: null,
                            userId: null,
                            userName: null,
                            userEmail: null,
                            accessToken: null,
                            meta_denied: null
                        },
                        queryParamsHandling: 'merge',
                        replaceUrl: true
                    });
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * ✅ NUEVA FUNCIÓN: Verificar admin y agregar panel con logging detallado
     */
    private _checkAdminAndAddPanel(): void {
        console.log('🔍 [Settings] Verificando permisos de admin...');
        
        const isAdmin = this.isUserAdmin();
        console.log('🎯 [Settings] Resultado verificación admin:', isAdmin);
        
        if (isAdmin) {
            console.log('✅ [Settings] Usuario es admin, agregando panel de Jobs Monitoring');
            
            // Verificar si el panel ya existe para evitar duplicados
            const existingPanel = this.panels.find(p => p.id === 'jobs-monitoring');
            if (!existingPanel) {
                this.panels.push({
                    id: 'jobs-monitoring',
                    title: 'Monitoreo de Jobs',
                    description: 'Monitoreo y gestión de tareas automatizadas',
                    icon: 'heroicons_outline:cog-6-tooth'
                });
                
                console.log('✅ [Settings] Panel de Jobs Monitoring agregado. Total paneles:', this.panels.length);
                console.log('📋 [Settings] Paneles disponibles:', this.panels.map(p => p.id));
                
                // Forzar detección de cambios
                this._changeDetectorRef.markForCheck();
            } else {
                console.log('⚠️ [Settings] Panel de Jobs Monitoring ya existe');
            }
        } else {
            console.log('❌ [Settings] Usuario no es admin, no se agrega panel de Jobs Monitoring');
        }
    }

    /**
     * ✅ Verificar si hay un mensaje de éxito pendiente después del reload
     */
    private _checkForSuccessMessage(): void {
        const pendingSuccess = localStorage.getItem('auth_success_pending');
        if (pendingSuccess) {
            try {
                const successData = JSON.parse(pendingSuccess);

                // ✅ Mostrar snackbar de éxito
                this._snackBar.open(
                    `✅ ${successData.platform} conectado correctamente como ${successData.userName}`,
                    'Cerrar',
                    {
                        duration: 8000,
                        panelClass: ['snackbar-success']
                    }
                );

                // ✅ Limpiar el mensaje pendiente
                localStorage.removeItem('auth_success_pending');

                console.log('✅ Mensaje de éxito mostrado y limpiado');
            } catch (error) {
                console.error('❌ Error procesando mensaje de éxito pendiente:', error);
                localStorage.removeItem('auth_success_pending');
            }
        }
    }

    /**
     * Navigate to the panel
     */
    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawerOpened = false;
        }
    }

    /**
     * Get the details of the panel
     */
    getPanelInfo(id: string): any {
        return this.panels.find(panel => panel.id === id);
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * ✅ CORRECCIÓN: Verificar si el usuario es admin con logging detallado
     */
    private isUserAdmin(): boolean {
        console.log('🔍 [Settings] Iniciando verificación de permisos admin...');
        
        try {
            // Verificar userData en localStorage
            const userData = localStorage.getItem('userData');
            console.log('📦 [Settings] userData en localStorage:', userData ? 'Existe' : 'No existe');
            
            if (userData) {
                const user = JSON.parse(userData);
                console.log('👤 [Settings] Datos de usuario parseados:', {
                    id_usuario: user.id_usuario,
                    isAdmin: user.isAdmin,
                    cargo_usuario: user.cargo_usuario,
                    nombre: user.nombre
                });
                
                const isAdminById = user.id_usuario === 1;
                const isAdminByFlag = user.isAdmin === true;
                
                console.log('🔍 [Settings] Verificaciones:', {
                    'id_usuario === 1': isAdminById,
                    'isAdmin === true': isAdminByFlag,
                    'Resultado final': isAdminById || isAdminByFlag
                });
                
                if (isAdminById || isAdminByFlag) {
                    console.log('✅ [Settings] Usuario verificado como admin');
                    return true;
                }
            }

            // Fallback: verificar token JWT
            console.log('🔄 [Settings] Verificando token JWT como fallback...');
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    console.log('🎫 [Settings] Payload del token:', {
                        userId: payload.userId,
                        email: payload.email
                    });
                    
                    if (payload.userId === 1) {
                        console.log('✅ [Settings] Usuario verificado como admin por token JWT');
                        return true;
                    }
                } catch (tokenError) {
                    console.error('❌ [Settings] Error parseando token JWT:', tokenError);
                }
            } else {
                console.log('⚠️ [Settings] No hay token JWT disponible');
            }
        } catch (e) {
            console.error('❌ [Settings] Error verificando permisos de admin:', e);
        }
        
        console.log('❌ [Settings] Usuario NO es admin');
        return false;
    }

    /**
     * Check screen size
     */
    private _checkScreenSize(): void {
        // Check if screen is small
        if (window.innerWidth < 1024) {
            this.drawerMode = 'over';
            this.drawerOpened = false;
        } else {
            this.drawerMode = 'side';
            this.drawerOpened = true;
        }
    }
}

