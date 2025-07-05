// ARCHIVO 2: src/app/modules/admin/pages/settings/connected-accounts/connected-accounts.component.ts

import { NgClass, NgFor, NgIf } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseLoadingService } from '@fuse/services/loading';

// Importar el componente de mapeo de activos
import { AssetMappingComponent, AssetMappingConfig, MappingResult } from '../shared/asset-mapping.component';

interface ConnectedAccount {
    id: string;
    name: string;
    description: string;
    icon: string;
    connected: boolean;
    permissions: string[];
    color: string;
    // Propiedades para mostrar info del usuario conectado
    userId?: string;
    userName?: string;
    userEmail?: string;
}

@Component({
    selector: 'settings-connected-accounts',
    templateUrl: './connected-accounts.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgClass,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatSnackBarModule,
        NgIf,
        NgFor,
        AssetMappingComponent // Importar el componente de mapeo
    ],
})
export class SettingsConnectedAccountsComponent implements OnInit {
    
    currentUser: User | null = null;
    
    // Estado del mapeo de activos
    showAssetMapping = false;
    assetMappingConfig: AssetMappingConfig = {
        mode: 'full-mapping',
        allowMultipleAssets: true,
        allowMultipleClinics: true,
        showAsModal: false,
        title: 'Mapear Activos de Meta',
        subtitle: 'Asigna tus páginas, cuentas de Instagram y cuentas publicitarias a clínicas específicas'
    };

    accounts: ConnectedAccount[] = [
        {
            id: 'meta',
            name: 'Meta',
            description: 'Facebook e Instagram',
            icon: 'heroicons_solid:share',
            connected: false,
            color: 'text-blue-600',
            permissions: [
                'Insights de Facebook',
                'Insights de Instagram', 
                'Listado de cuentas publicitarias',
                'Listado de páginas a las que tiene acceso el usuario',
                'Leads',
                'Descarga de facturas',
                'Conversiones offline'
            ]
        },
        {
            id: 'google',
            name: 'Google',
            description: 'Analytics, Ads y Maps',
            icon: 'heroicons_solid:magnifying-glass',
            connected: false,
            color: 'text-red-600',
            permissions: [
                'Acceso a Analytics',
                'Google Ads',
                'Google Maps',
                'Google Local Business'
            ]
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            description: 'TikTok for Business',
            icon: 'heroicons_solid:musical-note',
            connected: false,
            color: 'text-gray-800',
            permissions: [
                'Insights de TikTok',
                'Listado de cuentas publicitarias',
                'Listado de páginas a las que tiene acceso el usuario',
                'Leads',
                'Descarga de facturas'
            ]
        }
    ];

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _httpClient: HttpClient,
        private _userService: UserService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseLoadingService: FuseLoadingService,
        private _snackBar: MatSnackBar
     ) {}

    ngOnInit(): void {
        // Obtener el usuario actual
        this._userService.user$.subscribe(user => {
            this.currentUser = user;
        });
        
        this._checkMetaConnectionStatus();
    }

    private _checkMetaConnectionStatus(): void {
        // Consultar al backend el estado de conexión de Meta
        this._httpClient.get<any>('https://autenticacion.clinicaclick.com/oauth/meta/connection-status').subscribe(
            (response) => {
                const metaAccount = this.accounts.find(acc => acc.id === 'meta');
                if (metaAccount) {
                    metaAccount.connected = response.connected;
                    if (response.connected) {
                        metaAccount.userId = response.metaUserId;
                        metaAccount.userName = response.userName;
                        metaAccount.userEmail = response.userEmail;
                        console.log('Estado de conexión Meta cargado desde el backend.');
                    } else {
                        console.log('No hay conexión Meta activa para este usuario.');
                    }
                }
                this._changeDetectorRef.markForCheck();
            },
            (error) => {
                console.error('Error al consultar estado de conexión Meta:', error);
                const metaAccount = this.accounts.find(acc => acc.id === 'meta');
                if (metaAccount) metaAccount.connected = false;
                this._changeDetectorRef.markForCheck();
            }
        );
    }

    /**
     * Connect account
     */
    connectAccount(accountId: string): void {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        switch (accountId) {
            case 'meta':
                this._connectMeta();
                break;
            case 'google':
                console.log('Conectar Google (no implementado)');
                break;
            case 'tiktok':
                console.log('Conectar TikTok (no implementado)');
                break;
            default:
                console.log(`Conectar ${accountId} no implementado`);
        }
    }

    private _connectMeta(): void {
        console.log('🔗 Iniciando conexión con Meta...');
        
        // Mostrar snackbar informativo
        this._snackBar.open('🔄 Conectando con Meta...', '', {
            duration: 3000,
            panelClass: ['snackbar-info']
        });

        // Redirigir a la URL de autorización de Meta
        window.location.href = 'https://autenticacion.clinicaclick.com/oauth/meta/auth';
    }

    /**
     * Disconnect account
     */
    disconnectAccount(accountId: string): void {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        switch (accountId) {
            case 'meta':
                this._disconnectMeta();
                break;
            case 'google':
                console.log('Desconectar Google (no implementado)');
                break;
            case 'tiktok':
                console.log('Desconectar TikTok (no implementado)');
                break;
            default:
                console.log(`Desconectar ${accountId} no implementado`);
        }
    }

    private _disconnectMeta(): void {
        // Mostrar diálogo de confirmación
        const dialogRef = this._fuseConfirmationService.open({
            title: 'Desconectar Meta',
            message: '¿Estás seguro de que quieres desconectar tu cuenta de Meta? Se perderán todos los mapeos de activos configurados.',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn'
            },
            actions: {
                confirm: {
                    show: true,
                    label: 'Desconectar',
                    color: 'warn'
                },
                cancel: {
                    show: true,
                    label: 'Cancelar'
                }
            },
            dismissible: true
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                console.log('🔗 Desconectando Meta...');
                
                // Mostrar snackbar informativo
                this._snackBar.open('🔄 Desconectando Meta...', '', {
                    duration: 3000,
                    panelClass: ['snackbar-info']
                });

                // Llamar al endpoint de desconexión
                this._httpClient.post('https://autenticacion.clinicaclick.com/oauth/meta/disconnect', {}).subscribe(
                    (response: any) => {
                        console.log('✅ Meta desconectado correctamente:', response);
                        
                        // Actualizar estado local
                        const metaAccount = this.accounts.find(acc => acc.id === 'meta');
                        if (metaAccount) {
                            metaAccount.connected = false;
                            metaAccount.userId = undefined;
                            metaAccount.userName = undefined;
                            metaAccount.userEmail = undefined;
                        }

                        // Ocultar mapeo si estaba visible
                        this.showAssetMapping = false;

                        // Mostrar snackbar de éxito
                        this._snackBar.open('✅ Meta desconectado correctamente', 'Cerrar', {
                            duration: 5000,
                            panelClass: ['snackbar-success']
                        });

                        this._changeDetectorRef.markForCheck();
                    },
                    (error) => {
                        console.error('❌ Error al desconectar Meta:', error);
                        
                        // Mostrar snackbar de error
                        this._snackBar.open('❌ Error al desconectar Meta', 'Cerrar', {
                            duration: 5000,
                            panelClass: ['snackbar-error']
                        });
                    }
                );
            }
        });
    }

    /**
     * Abrir mapeo de activos
     */
    openAssetMapping(): void {
        console.log('🎯 Abriendo mapeo de activos...');
        this.showAssetMapping = true;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Manejar completación del mapeo
     */
    onMappingComplete(result: MappingResult): void {
        console.log('✅ Mapeo completado:', result);
        
        if (result.success) {
            this._snackBar.open(
                `✅ ${result.mappings.length} activos mapeados correctamente`, 
                'Cerrar', 
                {
                    duration: 5000,
                    panelClass: ['snackbar-success']
                }
            );
        } else {
            this._snackBar.open(
                `❌ Error en el mapeo: ${result.message}`, 
                'Cerrar', 
                {
                    duration: 8000,
                    panelClass: ['snackbar-error']
                }
            );
        }

        // Cerrar el mapeo
        this.showAssetMapping = false;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Manejar cancelación del mapeo
     */
    onMappingCancelled(): void {
        console.log('❌ Mapeo cancelado por el usuario');
        this.showAssetMapping = false;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Get Meta account
     */
    getMetaAccount(): ConnectedAccount | undefined {
        return this.accounts.find(acc => acc.id === 'meta');
    }

    /**
     * Check if Meta is connected
     */
    isMetaConnected(): boolean {
        const metaAccount = this.getMetaAccount();
        return metaAccount?.connected || false;
    }

    /**
     * Track by function for ngFor
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}

