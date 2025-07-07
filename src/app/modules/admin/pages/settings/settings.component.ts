// cc-front/src/app/modules/admin/pages/settings/settings.component.ts
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
// CORRECCIÓN AQUÍ: Cambiado a 'connected-accounts' (con dos 'n')
import { SettingsConnectedAccountsComponent } from './connected-accounts/connected-accounts.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        NgClass,
        NgIf,
        NgFor,
        SettingsConnectedAccountsComponent,
        MatSnackBarModule
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
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _snackBar: MatSnackBar,
        private _httpClient: HttpClient
    ) {}

    ngOnInit(): void {
        this._checkScreenSize();

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.drawerMode = matchingAliases.includes('lg') ? 'side' : 'over';
                this.drawerOpened = matchingAliases.includes('lg');
                this._changeDetectorRef.markForCheck();
            });

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
                    localStorage.setItem('oauth_success_pending', JSON.stringify(successData));

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
                    this._snackBar.open('⚠️ Has rechazado conectar tu clínica con Meta. Si lo haces por seguridad te adelanto que es completamente seguro, puedes intentarlo más adelante.', 'Cerrar', {
                        duration: 8000,
                        panelClass: ['snackbar-warning']
                    });
                } else if (error) {
                    this.selectedPanel = 'connected-accounts';
                    this._snackBar.open(`Error al conectar cuenta: ${error}`, 'Cerrar', {
                        duration: 8000,
                        panelClass: ['snackbar-error']
                    });
                }

                // ✅ Limpiar los query params de la URL para errores
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
     * ✅ Verificar si hay un mensaje de éxito pendiente después del reload
     */
    private _checkForSuccessMessage(): void {
        const pendingSuccess = localStorage.getItem('oauth_success_pending');
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
                localStorage.removeItem('oauth_success_pending');
                
                console.log('✅ Mensaje de éxito mostrado y limpiado');

            } catch (error) {
                console.error('❌ Error procesando mensaje de éxito pendiente:', error);
                localStorage.removeItem('oauth_success_pending');
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

