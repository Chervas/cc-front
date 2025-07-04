// cc-front/src/app/modules/admin/pages/settings/conected-accounts/connected-accounts.component.ts
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
import { HttpClient } from '@angular/common/http'; // Importar HttpClient
import { UserService } from 'app/core/user/user.service'; // Importar UserService
import { User } from 'app/core/user/user.types'; // Importar User types
import { FuseConfirmationService } from '@fuse/services/confirmation'; // Importar FuseConfirmationService

interface ConnectedAccount {
    id: string;
    name: string;
    description: string;
    icon: string;
    connected: boolean;
    permissions: string[];
    color: string;
    // Propiedades para mostrar info del usuario conectado (obtenidas del backend )
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
        NgIf,
        NgFor,
    ],
})
export class SettingsConnectedAccountsComponent implements OnInit {
    
    currentUser: User | null = null; // Almacenar el usuario actual
    
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
        private _httpClient: HttpClient, // Inyectar HttpClient
        private _userService: UserService, // Inyectar UserService
        private _fuseConfirmationService: FuseConfirmationService // Inyectar FuseConfirmationService
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
                this._changeDetectorRef.markForCheck(); // Forzar detección de cambios
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
                this.connectMeta();
                break;
            case 'google':
                console.log('Google OAuth no implementado aún');
                break;
            case 'tiktok':
                console.log('TikTok OAuth no implementado aún');
                break;
        }
    }

    /**
     * Disconnect account
     */
    disconnectAccount(accountId: string): void {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        switch (accountId) {
            case 'meta':
                this.disconnectMeta();
                break;
            case 'google':
                console.log('Google desconexión no implementada aún');
                break;
            case 'tiktok':
                console.log('TikTok desconexión no implementada aún');
                break;
        }
    }

    /**
     * Connect to Meta (permisos básicos)
     */
    connectMeta(): void {
        const clientId = '1807844546609897'; // Asegúrate de que este es el ID correcto
        const redirectUri = encodeURIComponent('https://autenticacion.clinicaclick.com/oauth/meta/callback' );
        const scope = encodeURIComponent('email,public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,ads_read,leads_retrieval,business_management'); // Permisos completos
        
        // Generar state aleatorio como en la versión original
        const state = this.generateRandomState();
        
        // Store state in sessionStorage for verification
        sessionStorage.setItem('oauth_state', state);
        
        const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `response_type=code&` +
            `state=${state}`;
        
        // Abrir en nueva ventana
        window.location.href = authUrl;
    }

    /**
     * Disconnect from Meta
     */
    disconnectMeta(): void {
        console.log('Solicitando confirmación para desconectar Meta...');
        
        // Configuración del diálogo de confirmación de Fuse
        const confirmation = this._fuseConfirmationService.open({
            title: 'Desconectar Meta',
            message: 'Vas a desconectar tu cuenta de Meta, esto afectará a la recuperación de leads, datos, WhatsApp, etc con tus clínicas. ¿Estás seguro?',
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

        // Suscribirse al resultado del diálogo
        confirmation.afterClosed().subscribe((result) => {
            if (!result || result !== 'confirmed') {
                console.log('Desconexión de Meta cancelada por el usuario');
                return;
            }
            
            console.log('Desconectando Meta...');
            
            const metaAccount = this.accounts.find(acc => acc.id === 'meta');
            if (!metaAccount) return;

            // Llamar al endpoint del backend para eliminar la conexión
            this._httpClient.delete<any>('https://autenticacion.clinicaclick.com/oauth/meta/disconnect').subscribe(
                (response) => {
                    if (response.success) {
                        console.log('✅ Meta desconectado correctamente:', response.message);
                        
                        // Actualizar el estado local
                        metaAccount.connected = false;
                        metaAccount.userId = undefined;
                        metaAccount.userName = undefined;
                        metaAccount.userEmail = undefined;
                        
                        this._changeDetectorRef.markForCheck(); // Forzar detección de cambios
                    } else {
                        console.error('❌ Error al desconectar Meta:', response.error);
                    }
                },
                (error) => {
                    console.error('❌ Error al desconectar Meta:', error);
                    // En caso de error, mantener el estado actual
                }
            );
        });
    }

    /**
     * Generate random state for OAuth security
     */
    generateRandomState(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: ConnectedAccount): string {
        return item.id;
    }
}

