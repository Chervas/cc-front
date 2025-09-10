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
import { AuthService } from 'app/core/auth/auth.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseLoadingService } from '@fuse/services/loading';
import { User } from 'app/core/user/user.types';

// ✅ IMPORTS CORRECTOS: Desde el directorio shared
import { AssetMappingComponent } from '../shared/asset-mapping.component';
import { GoogleAssetMappingComponent } from '../shared/google-asset-mapping.component';
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

// ✅ NUEVO: Interface para mapeos existentes
interface MetaMapping {
    clinica: {
        id: number;
        nombre: string;
        avatar_url?: string;
    };
    assets: {
        facebook_pages: any[];
        instagram_business: any[];
        ad_accounts: any[];
    };
    totalAssets: number;
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
        AssetMappingComponent,
        GoogleAssetMappingComponent // ✅ Nuevo mapeo Google
    ],
})
export class SettingsConnectedAccountsComponent implements OnInit {
    currentUser: any = null; // ✅ CAMBIO: any en lugar de User para tener id_usuario

    // Estado del mapeo de activos
    showAssetMapping = false;
    showGoogleMapping = false;
    
    // ✅ NUEVO: Propiedades para mapeos existentes
    metaMappings: MetaMapping[] = [];
    isLoadingMappings = false;
    
    // ✅ CONFIGURACIÓN CORRECTA: Usando la interfaz del shared
    assetMappingConfig: AssetMappingConfig = {
        mode: 'full-mapping',
        allowMultipleAssets: true,
        allowMultipleClinics: true,
        showAsModal: false, // ✅ Propiedad correcta del shared
        title: 'Mapear Activos de Meta',
        subtitle: 'Asigna tus páginas, cuentas de Instagram y cuentas publicitarias a clínicas específicas'
    };
    googleMappingTitle = 'Mapear propiedades de Search Console';
    googleMappingSubtitle = 'Asigna sitios verificados a tus clínicas';

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
                'Search Console',
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
        private _authService: AuthService, // ✅ AÑADIDO: AuthService para obtener usuario de negocio
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseLoadingService: FuseLoadingService,
        private _snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        // ✅ CAMBIO: Usar AuthService para obtener usuario de negocio con id_usuario
        this._authService.getCurrentUser().subscribe(user => {
            this.currentUser = user;
            console.log('👤 Usuario de negocio obtenido:', user);
        });

        this._checkMetaConnectionStatus();
        this._checkGoogleConnectionStatus();
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
                        
                        // ✅ NUEVO: Cargar mapeos existentes si está conectado
                        this._loadMetaMappings();
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
     * ✅ NUEVO: Cargar mapeos existentes de Meta
     */
    private _loadMetaMappings(): void {
        this.isLoadingMappings = true;
        this._changeDetectorRef.markForCheck();

        this._httpClient.get<any>('https://autenticacion.clinicaclick.com/oauth/meta/mappings').subscribe(
            (response) => {
                if (response && response.success) {
                    this.metaMappings = response.mappings || [];
                    console.log('✅ Mapeos de Meta cargados:', this.metaMappings);
                } else {
                    this.metaMappings = [];
                    console.log('No hay mapeos de Meta disponibles');
                }
                this.isLoadingMappings = false;
                this._changeDetectorRef.markForCheck();
            },
            (error) => {
                console.error('❌ Error al cargar mapeos de Meta:', error);
                this.metaMappings = [];
                this.isLoadingMappings = false;
                this._changeDetectorRef.markForCheck();
            }
        );
    }

    /**
     * ✅ NUEVO: Obtener iniciales de clínica para avatar fallback
     */
    getClinicInitials(name: string): string {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    /**
     * ✅ NUEVO: Obtener icono para tipo de activo
     */
    getAssetTypeIcon(type: string): string {
        switch (type) {
            case 'facebook_page': return 'heroicons_outline:globe-alt';
            case 'instagram_business': return 'heroicons_outline:camera';
            case 'ad_account': return 'heroicons_outline:megaphone';
            default: return 'heroicons_outline:squares-2x2';
        }
    }

    /**
     * ✅ NUEVO: Obtener nombre amigable para tipo de activo
     */
    getAssetTypeName(type: string): string {
        switch (type) {
            case 'facebook_page': return 'Página Facebook';
            case 'instagram_business': return 'Instagram Business';
            case 'ad_account': return 'Cuenta Publicitaria';
            default: return type;
        }
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
                this._connectGoogle();
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

        // ✅ OBTENER userId: Usar el ID del usuario logueado (CORREGIDO)
        // Nota: Usar id_usuario (number) del modelo de negocio, NO id (string) de Fuse
        const userId = this.currentUser.id_usuario?.toString() || '1'; // Usar el ID real del usuario
        
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
        // Añadimos instagram_manage_insights para poder leer alcance/insights de medios/cuenta
        const scope = 'pages_read_engagement,pages_show_list,instagram_basic,instagram_manage_insights,ads_read';
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
     * ✅ NUEVO: Estado de conexión Google
     */
    private _checkGoogleConnectionStatus(): void {
        this._httpClient.get<any>('https://autenticacion.clinicaclick.com/oauth/google/connection-status').subscribe(
            (res) => {
                const googleAcc = this.accounts.find(a => a.id === 'google');
                if (!googleAcc) return;
                googleAcc.connected = !!res?.connected;
                if (res?.connected) {
                    googleAcc.userEmail = res.userEmail || '';
                    googleAcc.userName = res.userName || '';
                    this._loadGoogleMappings();
                }
                this._changeDetectorRef.markForCheck();
            },
            () => {
                const googleAcc = this.accounts.find(a => a.id === 'google');
                if (googleAcc) googleAcc.connected = false;
                this._changeDetectorRef.markForCheck();
            }
        );
    }

    googleMappings: any[] = [];
    isLoadingGoogleMappings = false;
    private _loadGoogleMappings(): void {
        this.isLoadingGoogleMappings = true;
        this._httpClient.get<any>('https://autenticacion.clinicaclick.com/oauth/google/mappings').subscribe(
            (resp) => {
                this.googleMappings = resp?.mappings || [];
                this.isLoadingGoogleMappings = false;
                this._changeDetectorRef.markForCheck();
            },
            () => { this.googleMappings = []; this.isLoadingGoogleMappings = false; this._changeDetectorRef.markForCheck(); }
        );
    }

    private _disconnectGoogle(): void {
        const dialogRef = this._fuseConfirmationService.open({
            title: 'Desconectar Google',
            message: '¿Seguro que quieres desconectar tu cuenta de Google? Se eliminarán los mapeos de Search Console.',
            icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: { confirm: { show: true, label: 'Desconectar', color: 'warn' }, cancel: { show: true, label: 'Cancelar' } },
            dismissible: true
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._fuseLoadingService.show();
                this._httpClient.delete('https://autenticacion.clinicaclick.com/oauth/google/disconnect').subscribe(
                    () => {
                        const acc = this.accounts.find(a => a.id === 'google');
                        if (acc) { acc.connected = false; acc.userEmail = undefined as any; acc.userName = undefined as any; }
                        this.googleMappings = [];
                        this._fuseLoadingService.hide();
                        this._snackBar.open('✅ Google desconectado', '', { duration: 4000, panelClass: ['snackbar-success'] });
                        this._changeDetectorRef.markForCheck();
                    },
                    (err) => {
                        this._fuseLoadingService.hide();
                        this._snackBar.open('❌ Error al desconectar Google', '', { duration: 4000, panelClass: ['snackbar-error'] });
                        console.error(err);
                    }
                );
            }
        });
    }

    /**
     * ✅ NUEVO: Conectar Google (Search Console OAuth)
     */
    private _connectGoogle(): void {
        this._fuseLoadingService.show();
        this._snackBar.open('📎 Conectando con Google…', '', { duration: 2500 });

        this._httpClient.get<any>('https://autenticacion.clinicaclick.com/oauth/google/connect').subscribe(
            (resp) => {
                this._fuseLoadingService.hide();
                const authUrl = resp?.authUrl;
                if (!authUrl) {
                    this._snackBar.open('❌ No se pudo generar la URL de conexión de Google', '', { duration: 4000, panelClass: ['snackbar-error'] });
                    return;
                }
                // Redirigir a Google OAuth
                window.location.href = authUrl;
            },
            (err) => {
                this._fuseLoadingService.hide();
                console.error('❌ Error generando authUrl Google:', err);
                this._snackBar.open('❌ Error al conectar con Google', '', { duration: 5000, panelClass: ['snackbar-error'] });
            }
        );
    }

    /**
     * ✅ Clase dinámica para los badges de permisos
     */
    getPermissionClass(account: ConnectedAccount, permission: string): any {
        const base = 'px-3 py-1 rounded-full text-xs border';
        // Google: marcar Search Console como conectado
        if (account.id === 'google' && account.connected && /search console/i.test(permission)) {
            return {
                [base]: true,
                'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800': true
            };
        }
        return {
            [base]: true,
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800': true
        };
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
                this._disconnectGoogle();
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

    openGoogleMapping(): void {
        this.showGoogleMapping = true;
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
            
            // ✅ NUEVO: Recargar mapeos después de un mapeo exitoso
            this._loadMetaMappings();
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

    onGoogleMappingComplete(ev: { success: boolean; mapped: number }): void {
        this.showGoogleMapping = false;
        if (ev?.success) {
            this._snackBar.open(`✅ Mapeados ${ev.mapped} sitio(s)`, '', { duration: 4000, panelClass: ['snackbar-success'] });
            // Refrescar mapeos sin recargar la página
            this._loadGoogleMappings();
        } else {
            this._snackBar.open('❌ Error mapeando sitios', '', { duration: 4000, panelClass: ['snackbar-error'] });
        }
        this._changeDetectorRef.markForCheck();
    }

    onGoogleMappingCancelled(): void {
        this.showGoogleMapping = false;
        this._changeDetectorRef.markForCheck();
    }
}
