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
} )
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

        // Verificar si hay un mensaje de éxito pendiente después del reload
        this._checkForSuccessMessage();

        // Procesar los query params de la URL (modificado para mostrar snackbar después del reload)
        this._route.queryParamMap
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((params) => {
                const connected = params.get('connected');
                const error = params.get('error');
                const userId = params.get('userId');
                const userName = params.get('userName');
                const userEmail = params.get('userEmail');
                const accessToken = params.get('accessToken');

                if (connected === 'meta' && userId && userName && userEmail && accessToken) {
                    // Almacenar los datos en localStorage como en la versión original
                    localStorage.setItem('meta_user_id', userId);
                    localStorage.setItem('meta_user_name', userName);
                    localStorage.setItem('meta_user_email', userEmail);
                    localStorage.setItem('meta_access_token', accessToken);

                    console.log('✅ Datos de Meta almacenados en localStorage:', {
                        userId,
                        userName,
                        userEmail,
                        accessToken: accessToken.substring(0, 20) + '...'
                    });

                    // Preparar mensaje de éxito para después del reload
                    const successData = {
                        platform: 'Meta',
                        userName: userName,
                        userEmail: userEmail
                    };
                    localStorage.setItem('oauth_success_pending', JSON.stringify(successData));

                    this.selectedPanel = 'connected-accounts';

                    // Limpiar query params y recargar inmediatamente (sin mostrar snackbar aún)
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
                        // Reload inmediato después de limpiar la URL
                        setTimeout(() => {
                            window.location.reload();
                        }, 100);
                    });

                } else if (error) {
                    this.selectedPanel = 'connected-accounts';
                    this._snackBar.open(`Error al conectar cuenta: ${error}`, 'Cerrar', {
                        duration: 8000,
                        panelClass: ['snackbar-error']
                    });

                    // Limpiar los query params de la URL para errores
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
                    });
                }

                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    goToPanel(panelId: string): void {
        this.selectedPanel = panelId;
        if (this.drawerMode === 'over') {
            this.drawerOpened = false;
        }
        this._changeDetectorRef.markForCheck();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    private _checkScreenSize(): void {
        if (window.innerWidth < 1280) {
            this.drawerMode = 'over';
            this.drawerOpened = false;
        } else {
            this.drawerMode = 'side';
            this.drawerOpened = true;
        }
    }

    private _checkForSuccessMessage(): void {
        // Verificar si hay un flag de conexión exitosa en localStorage
        const successFlag = localStorage.getItem('oauth_success_pending');
        
        if (successFlag) {
            try {
                const successData = JSON.parse(successFlag);
                
                // Mostrar mensaje de éxito después del reload
                this._snackBar.open(
                    `✅ ${successData.platform} conectado correctamente como ${successData.userName}`,
                    'Cerrar',
                    {
                        duration: 5000,
                        panelClass: ['snackbar-success']
                    }
                );
                
                console.log(`✅ ${successData.platform} conectado exitosamente:`, successData);
                
                // Limpiar el flag después de mostrar el mensaje
                localStorage.removeItem('oauth_success_pending');
                
            } catch (error) {
                console.error('Error al procesar mensaje de éxito:', error);
                localStorage.removeItem('oauth_success_pending');
            }
        }
    }
}

