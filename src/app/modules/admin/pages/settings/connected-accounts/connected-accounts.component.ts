import { NgClass, NgFor, NgIf } from '@angular/common'; // Asegúrate de importar NgFor y NgIf
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef, // Importar ChangeDetectorRef
    Component,
    OnInit, // Importar OnInit
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

interface ConnectedAccount {
    id: string;
    name: string;
    description: string;
    icon: string;
    connected: boolean;
    permissions: string[];
    color: string;
    // Nuevas propiedades para almacenar información del usuario conectado
    userId?: string;
    userName?: string;
    userEmail?: string;
    accessToken?: string;
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
        NgIf, // Asegúrate de que NgIf esté importado
        NgFor, // Asegúrate de que NgFor esté importado
    ],
})
export class SettingsConnectedAccountsComponent implements OnInit { // Implementar OnInit
    
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

    constructor(private _changeDetectorRef: ChangeDetectorRef) {} // Inyectar ChangeDetectorRef

    ngOnInit(): void {
        this._checkMetaConnectionStatus();
    }

    private _checkMetaConnectionStatus(): void {
        const metaUserId = localStorage.getItem('meta_user_id');
        const metaUserName = localStorage.getItem('meta_user_name');
        const metaUserEmail = localStorage.getItem('meta_user_email');
        const metaAccessToken = localStorage.getItem('meta_access_token');

        const metaAccount = this.accounts.find(acc => acc.id === 'meta');
        if (metaAccount && metaUserId && metaUserName && metaUserEmail && metaAccessToken) {
            metaAccount.connected = true;
            metaAccount.userId = metaUserId;
            metaAccount.userName = metaUserName;
            metaAccount.userEmail = metaUserEmail;
            metaAccount.accessToken = metaAccessToken;
            console.log('Estado de conexión Meta cargado desde localStorage.');
        } else if (metaAccount) {
            metaAccount.connected = false; // Asegurarse de que esté desconectado si faltan datos
        }
        this._changeDetectorRef.markForCheck(); // Forzar detección de cambios
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

        console.log(`Desconectando ${account.name}...`);
        account.connected = false;
        account.userId = undefined;
        account.userName = undefined;
        account.userEmail = undefined;
        account.accessToken = undefined;
        
        // Limpiar localStorage
        localStorage.removeItem('meta_user_id');
        localStorage.removeItem('meta_user_name');
        localStorage.removeItem('meta_user_email');
        localStorage.removeItem('meta_access_token');

        this._changeDetectorRef.markForCheck(); // Forzar detección de cambios
    }

    /**
     * Connect to Meta (permisos básicos)
     */
    connectMeta(): void {
        const clientId = '1807844546609897'; // Asegúrate de que este es el ID correcto
        const redirectUri = encodeURIComponent('https://autenticacion.clinicaclick.com/oauth/meta/callback' );
        const scope = encodeURIComponent('email,public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,ads_read,leads_retrieval,business_management'); // Permisos completos
        
        const state = this.generateRandomState();
        
        // Store state in sessionStorage for verification
        sessionStorage.setItem('oauth_state', state);
        
        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `response_type=code&` +
            `state=${state}`;
        
        // Abrir en nueva ventana
        window.location.href = authUrl;
    }

    /**
     * Generate random state for OAuth security
     */
    private generateRandomState( ): string {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0].toString(36);
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: ConnectedAccount): string {
        return item.id;
    }
}
