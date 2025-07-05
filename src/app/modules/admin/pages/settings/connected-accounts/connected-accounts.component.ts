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
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'app/core/auth/auth.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseLoadingService } from '@fuse/services/loading'; // ✅ Importar FuseLoadingService

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
    
    currentUser: any = null;
    
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
        private _authService: AuthService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseLoadingService: FuseLoadingService // ✅ Inyectar FuseLoadingService
     ) {}

    ngOnInit(): void {
        this._getCurrentUser();
        this._checkMetaConnectionStatus();
    }

    /**
     * Obtener el usuario actual usando AuthService
     */
    private _getCurrentUser(): void {
        this._authService.getCurrentUser().subscribe({
            next: (user) => {
                this.currentUser = user;
                console.log('🔍 Usuario cargado en connected-accounts:', user);
                console.log('🔍 Estructura del usuario:', {
                    id_usuario: user?.id_usuario,
                    nombre: user?.nombre,
                    email_usuario: user?.email_usuario,
                    allFields: Object.keys(user || {})
                });
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('❌ Error obteniendo usuario actual:', error);
                this.currentUser = null;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    private _checkMetaConnectionStatus(): void {
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
        if (!this.currentUser) {
            console.error('❌ No se pudo obtener el usuario actual para conectar Meta');
            console.log('currentUser:', this.currentUser);
            return;
        }

        const userId = this.currentUser.id_usuario || this.currentUser.id;
        
        if (!userId) {
            console.error('❌ No se encontró id_usuario ni id en el usuario actual');
            console.log('Estructura del usuario:', this.currentUser);
            return;
        }

        // ✅ MOSTRAR LOADING BAR
        this._fuseLoadingService.show();
        console.log('🔄 Mostrando loading bar...');

        const clientId = '1807844546609897';
        const redirectUri = encodeURIComponent('https://autenticacion.clinicaclick.com/oauth/meta/callback');
        const scope = encodeURIComponent('email,public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,ads_read,leads_retrieval,business_management');
        
        const state = userId.toString();
        
        console.log('🔍 Conectando Meta para userId:', state);
        console.log('🔍 Datos del usuario:', {
            userId: userId,
            nombre: this.currentUser.nombre || this.currentUser.name,
            email: this.currentUser.email_usuario || this.currentUser.email
        });
        
        sessionStorage.setItem('oauth_state', state);
        
        const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `response_type=code&` +
            `state=${state}`;
        
        console.log('🚀 Redirigiendo a Meta OAuth...');
        
        // ✅ PEQUEÑO DELAY PARA QUE SE VEA LA LOADING BAR
        setTimeout(() => {
            window.location.href = authUrl;
            // Nota: La loading bar se ocultará automáticamente cuando la página se recargue
        }, 500); // 500ms para que el usuario vea la loading bar
    }

    /**
     * Disconnect from Meta
     */
    disconnectMeta(): void {
        console.log('Solicitando confirmación para desconectar Meta...');
        
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

        confirmation.afterClosed().subscribe((result) => {
            if (!result || result !== 'confirmed') {
                console.log('Desconexión de Meta cancelada por el usuario');
                return;
            }
            
            console.log('Desconectando Meta...');
            
            // ✅ MOSTRAR LOADING BAR PARA DESCONEXIÓN
            this._fuseLoadingService.show();
            
            const metaAccount = this.accounts.find(acc => acc.id === 'meta');
            if (!metaAccount) {
                this._fuseLoadingService.hide();
                return;
            }

            this._httpClient.delete<any>('https://autenticacion.clinicaclick.com/oauth/meta/disconnect').subscribe(
                (response) => {
                    // ✅ OCULTAR LOADING BAR
                    this._fuseLoadingService.hide();
                    
                    if (response.success) {
                        console.log('✅ Meta desconectado correctamente:', response.message);
                        
                        metaAccount.connected = false;
                        metaAccount.userId = undefined;
                        metaAccount.userName = undefined;
                        metaAccount.userEmail = undefined;
                        
                        this._changeDetectorRef.markForCheck();
                    } else {
                        console.error('❌ Error al desconectar Meta:', response.error);
                    }
                },
                (error) => {
                    // ✅ OCULTAR LOADING BAR EN CASO DE ERROR
                    this._fuseLoadingService.hide();
                    console.error('❌ Error al desconectar Meta:', error);
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

