import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Subject, takeUntil } from 'rxjs';

interface ConnectedAccount {
    id: string;
    name: string;
    description: string;
    icon: string;
    connected: boolean;
    permissions: string[];
    color: string;
}

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        NgClass,
    ],
})
export class SettingsComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'connected-accounts';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

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

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Setup available panels
        this.panels = [
            {
                id: 'connected-accounts',
                icon: 'heroicons_outline:link',
                title: 'Cuentas Conectadas',
                description: 'Gestiona las conexiones con redes sociales y plataformas publicitarias',
            },
        ];

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Set the drawerMode and drawerOpened
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                } else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Navigate to the panel
     *
     * @param panel
     */
    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
    }

    /**
     * Get the details of the panel
     *
     * @param id
     */
    getPanelInfo(id: string): any {
        return this.panels.find((panel) => panel.id === id);
    }

    /**
     * Connect account
     */
    connectAccount(accountId: string): void {
        if (accountId === 'meta') {
            this.connectMeta();
        } else if (accountId === 'google') {
            this.connectGoogle();
        } else if (accountId === 'tiktok') {
            this.connectTikTok();
        }
    }

    /**
     * Disconnect account
     */
    disconnectAccount(accountId: string): void {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (account) {
            account.connected = false;
        }
    }

    /**
     * Connect to Meta (Facebook/Instagram) using OAuth2
     */
    private connectMeta(): void {
        const clientId = '1025462336033536';
        const redirectUri = encodeURIComponent('https://autenticacion.clinicaclick.com/oauth/meta/callback');
        const scope = encodeURIComponent([
            'pages_show_list',
            'pages_read_engagement', 
            'instagram_basic',
            'instagram_manage_insights',
            'ads_read',
            'leads_retrieval',
            'business_management'
        ].join(','));
        
        const state = this.generateRandomState();
        
        // Store state in sessionStorage for verification
        sessionStorage.setItem('oauth_state', state);
        
        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `scope=${scope}&` +
            `response_type=code&` +
            `state=${state}`;
        
        // Open OAuth window
        window.location.href = authUrl;
    }

    /**
     * Connect to Google (placeholder)
     */
    private connectGoogle(): void {
        console.log('Google OAuth integration - To be implemented');
        // TODO: Implement Google OAuth2 flow
    }

    /**
     * Connect to TikTok (placeholder)
     */
    private connectTikTok(): void {
        console.log('TikTok OAuth integration - To be implemented');
        // TODO: Implement TikTok OAuth2 flow
    }

    /**
     * Generate random state for OAuth security
     */
    private generateRandomState(): string {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0].toString(36);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Track by function for accounts
     */
    trackAccountByFn(index: number, item: ConnectedAccount): string {
        return item.id;
    }
}

