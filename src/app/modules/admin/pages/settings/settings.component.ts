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
import { SettingsConnectedAccountsComponent } from './connected-accounts/connected-accounts.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importar MatSnackBar

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
        MatSnackBarModule // Añadir MatSnackBarModule
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
        private _router: Router, // Necesario para la redirección y limpieza de URL
        private _snackBar: MatSnackBar // Inyectar MatSnackBar
    ) {}

    ngOnInit(): void {
        this._checkScreenSize();
        
        // Suscribirse a los cambios de media query para el drawer
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.drawerMode = matchingAliases.includes('lg') ? 'side' : 'over';
                this.drawerOpened = matchingAliases.includes('lg');
                this._changeDetectorRef.markForCheck();
            });

        // Procesar los query params de la URL
        this._route.queryParamMap
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((params) => {
                const connected = params.get('connected');
                const error = params.get('error');
                const userId = params.get('userId'); // Nuevo: ID de usuario de Meta
                const userName = params.get('userName'); // Nuevo: Nombre de usuario de Meta
                const userEmail = params.get('userEmail'); // Nuevo: Email de usuario de Meta
                const accessToken = params.get('accessToken'); // Nuevo: Access Token de Meta

                if (connected === 'meta') {
                    this.selectedPanel = 'connected-accounts'; // Asegurarse de que el panel correcto esté activo
                    this._snackBar.open('Cuenta Meta conectada correctamente.', 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-success'] // Clase CSS para estilos personalizados
                    });

                    // ALMACENAR CREDENCIALES DE META
                    if (userId && userName && userEmail && accessToken) {
                        localStorage.setItem('meta_user_id', userId);
                        localStorage.setItem('meta_user_name', userName);
                        localStorage.setItem('meta_user_email', userEmail);
                        localStorage.setItem('meta_access_token', accessToken);
                        console.log('Credenciales de Meta almacenadas en localStorage.');
                    }

                } else if (error) {
                    this.selectedPanel = 'connected-accounts'; // Asegurarse de que el panel correcto esté activo
                    this._snackBar.open(`Error al conectar cuenta: ${error}`, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-error'] // Clase CSS para estilos personalizados
                    });
                }

                // Limpiar los query params de la URL para evitar recargas o comportamientos inesperados
                if (connected || error) {
                    this._router.navigate([], {
                        queryParams: { connected: null, error: null, userId: null, userName: null, userEmail: null, accessToken: null },
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
}
