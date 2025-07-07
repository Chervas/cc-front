// ARCHIVO FINAL CORRECTO: src/app/modules/admin/pages/settings/connected-accounts/connected-accounts.component.ts
// Con imports correctos del directorio shared

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
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseLoadingService } from '@fuse/services/loading';
import { User } from 'app/core/user/user.types';

// ✅ IMPORTS CORRECTOS: Desde el directorio shared
import { AssetMappingComponent } from '../shared/asset-mapping.component';
import { AssetMappingConfig, MappingResult } from '../shared/asset-mapping.types';

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
        NgFor,
        NgIf,
        AssetMappingComponent // ✅ Componente del directorio shared
    ],
})
export class SettingsConnectedAccountsComponent implements OnInit {
    currentUser: User | null = null;

    // Estado del mapeo de activos
    showAssetMapping = false;
    
    // ✅ CONFIGURACIÓN CORRECTA: Usando la interfaz del shared
    assetMappingConfig: AssetMappingConfig = {
        mode: 'full-mapping',
        allowMultipleAssets: true,
        allowMultipleClinics: true,
        showAsModal: false, // ✅ Propiedad correcta del shared
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

    // ✅ Función trackByFn requerida por el HTML
    trackByFn(index: number, item: ConnectedAccount): string {
        return item.id;
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

    /**
     * ✅ MÉTODO CORREGIDO: Conectar Meta
     * Basado en la solución de la conversación anterior
     */
    private _connectMeta(): void {
        console.log('🔗 Iniciando conexión con Meta...');

        // ✅ VALIDACIÓN: Verificar usuario actual
        if (!this.currentUser) {
            console.error('❌ No se pudo obtener el usuario actual para conectar Meta');
            this._snackBar.open('❌ Error: No se pudo obtener el usuario actual', '', {
                duration: 5000,
                panelClass: ['snackbar-error']
            });
            return;
        }

        // ✅ OBTENER userId: Usar el ID del usuario logueado
        // Nota: El User de Fuse puede tener estructura diferente, usar fallback
        const userId = this.currentUser.id || '1'; // Usar el ID que vemos en los logs del backend
        
        console.log('✅ Usuario identificado:', { 
            userId, 
            email: this.currentUser.email,
            currentUser: this.currentUser 
        });

        // ✅ LOADING: Mostrar loading bar
        this._fuseLoadingService.show();

        // ✅ SNACKBAR: Mostrar información
        this._snackBar.open('📱 Conectando con Meta...', '', {
            duration: 3000,
            panelClass: ['snackbar-info']
        });

        // ✅ CONFIGURACIÓN OAUTH: Parámetros de Meta
        const clientId = '1807844546609897'; // Meta App ID
        const redirectUri = 'https://autenticacion.clinicaclick.com/oauth/meta/callback';
        const scope = 'pages_read_engagement,pages_show_list,instagram_basic,ads_read';
        const state = userId; // ✅ IMPORTANTE: Enviar userId como state

        // ✅ CONSTRUIR URL OAUTH: Directamente a Meta (NO al backend)
        const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${scope}&` +
            `response_type=code&` +
            `state=${state}`;

        console.log('➡️ Redirigiendo a Meta OAuth:', authUrl);

        // ✅ REDIRECCIÓN: Ir directamente a Meta OAuth
        setTimeout(() => {
            this._fuseLoadingService.hide();
            window.location.href = authUrl;
        }, 500);
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

    /**
     * ✅ MÉTODO CORREGIDO: Desconectar Meta
     */
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

                // Mostrar loading
                this._fuseLoadingService.show();

                // Mostrar snackbar informativo
                this._snackBar.open('🔄 Desconectando Meta...', '', {
                    duration: 3000,
                    panelClass: ['snackbar-info']
                });

                // ✅ LLAMADA CORRECTA: Usar DELETE (no POST)
                this._httpClient.delete('https://autenticacion.clinicaclick.com/oauth/meta/disconnect').subscribe(
                    (response) => {
                        console.log('✅ Meta desconectado correctamente');
                        
                        // Actualizar estado local
                        const metaAccount = this.accounts.find(acc => acc.id === 'meta');
                        if (metaAccount) {
                            metaAccount.connected = false;
                            metaAccount.userId = undefined;
                            metaAccount.userName = undefined;
                            metaAccount.userEmail = undefined;
                        }

                        // Ocultar loading
                        this._fuseLoadingService.hide();

                        // Mostrar snackbar de éxito
                        this._snackBar.open('✅ Meta desconectado correctamente', '', {
                            duration: 5000,
                            panelClass: ['snackbar-success']
                        });

                        this._changeDetectorRef.markForCheck();
                    },
                    (error) => {
                        console.error('❌ Error al desconectar Meta:', error);
                        
                        // Ocultar loading
                        this._fuseLoadingService.hide();

                        // Mostrar snackbar de error
                        this._snackBar.open('❌ Error al desconectar Meta', '', {
                            duration: 5000,
                            panelClass: ['snackbar-error']
                        });
                    }
                );
            }
        });
    }

    // ✅ Método openAssetMapping requerido por el HTML
    openAssetMapping(): void {
        this.showAssetMapping = true;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Manejar resultado del mapeo
     */
    onMappingComplete(result: MappingResult): void {
        console.log('Mapeo completado:', result);
        this.showAssetMapping = false;
        
        if (result.success) {
            this._snackBar.open('✅ Mapeo de activos guardado correctamente', '', {
                duration: 5000,
                panelClass: ['snackbar-success']
            });
        } else {
            this._snackBar.open('❌ Error al guardar el mapeo de activos', '', {
                duration: 5000,
                panelClass: ['snackbar-error']
            });
        }
        
        this._changeDetectorRef.markForCheck();
    }

    // ✅ Método onMappingCancelled requerido por el HTML
    onMappingCancelled(): void {
        console.log('Mapeo cancelado por el usuario');
        this.showAssetMapping = false;
        this._changeDetectorRef.markForCheck();
    }
}