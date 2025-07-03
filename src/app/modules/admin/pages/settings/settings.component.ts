import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // HttpClientModule no es necesario si no se usa HttpClient directamente aquí
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { SettingsConnectedAccountsComponent } from './connected-accounts/connected-accounts.component'; // <-- Importar el subcomponente

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
        NgIf, // Necesario para @if
        NgFor, // Necesario para @for
        SettingsConnectedAccountsComponent, // <-- Importar el subcomponente aquí
    ],
} )
export class SettingsComponent implements OnInit, OnDestroy { // Implementar OnDestroy para _unsubscribeAll
    
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    selectedPanel: string = 'connected-accounts';

    // Paneles del drawer lateral - AÑADIR PROPIEDAD 'icon'
    panels = [
        {
            id: 'connected-accounts',
            title: 'Cuentas Conectadas',
            description: 'Gestiona las conexiones con redes sociales',
            icon: 'heroicons_outline:link' // <-- AÑADIDO: Icono para el panel
        }
        // Puedes añadir más paneles aquí si los necesitas en el futuro
        // { id: 'security', title: 'Seguridad', description: 'Configuración de seguridad', icon: 'heroicons_outline:lock-closed' }
    ];

    // ELIMINAR la definición de 'accounts' de aquí, la manejará SettingsConnectedAccountsComponent
    // accounts = [...];

    private _unsubscribeAll: Subject<any> = new Subject<any>(); // <-- Añadido para OnDestroy

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _route: ActivatedRoute,
        // private _httpClient: HttpClient, // No es necesario si no se usa directamente aquí
        // private _router: Router, // No es necesario si no se usa directamente aquí
     ) {}

    ngOnInit(): void {
        this._checkScreenSize(); // Usar el método privado para el tamaño de pantalla
        this._checkConnectionStatus(); // Usar el método privado para el estado de conexión

        // Suscribirse a los cambios de media query para el drawer
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.drawerMode = matchingAliases.includes('lg') ? 'side' : 'over';
                this.drawerOpened = matchingAliases.includes('lg');
                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy(): void { // <-- Implementar OnDestroy
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Ir a un panel específico
     */
    goToPanel(panelId: string): void {
        this.selectedPanel = panelId;
        
        // En móvil, cerrar el drawer después de seleccionar
        if (this.drawerMode === 'over') {
            this.drawerOpened = false;
        }
        this._changeDetectorRef.markForCheck(); // Forzar detección de cambios
    }

    /**
     * Track function para paneles
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Verificar estado de conexiones (ajustado para el subcomponente)
     */
    private _checkConnectionStatus(): void {
        // Esta lógica ahora debería ser manejada principalmente por connected-accounts.component
        // Aquí solo nos aseguramos de que el panel correcto esté seleccionado si hay un query param
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('connected')) {
            this.selectedPanel = 'connected-accounts';
            // Limpiar URL
            window.history.replaceState({}, document.title, window.location.pathname);
            this._changeDetectorRef.markForCheck();
        }
    }

    /**
     * Verificar tamaño de pantalla para drawer responsive
     */
    private _checkScreenSize(): void {
        // Esta lógica se moverá al ngOnInit con FuseMediaWatcherService
        // Dejarlo aquí como un fallback inicial si no se usa el servicio
        if (window.innerWidth < 1280) {
            this.drawerMode = 'over';
            this.drawerOpened = false;
        } else {
            this.drawerMode = 'side';
            this.drawerOpened = true;
        }
    }
}
