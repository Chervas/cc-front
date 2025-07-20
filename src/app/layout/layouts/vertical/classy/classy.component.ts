import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseVerticalNavigationComponent } from '@fuse/components/navigation/vertical/vertical.component';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { RoleService, UsuarioClinicaResponse, Usuario } from 'app/core/services/role.service';
import { AuthService } from 'app/core/auth/auth.service';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { QuickChatComponent } from 'app/layout/common/quick-chat/quick-chat.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'classy-layout',
    templateUrl: './classy.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        NotificationsComponent,
        UserComponent,
        NgIf,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        LanguagesComponent,
        FuseFullscreenComponent,
        SearchComponent,
        ShortcutsComponent,
        MessagesComponent,
        RouterOutlet,
        QuickChatComponent,
    ],
})
export class ClassyLayoutComponent implements OnInit, OnDestroy
{
    isScreenSmall: boolean;
    navigation: any;
    user: Usuario | null = null;
    
    // Role and clinic data
    availableRoles: string[] = [];
    selectedRole: string = '';
    clinicas: UsuarioClinicaResponse[] = [];
    selectedClinica: UsuarioClinicaResponse | null = null;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _navigationService: NavigationService,
        private _fuseNavigationService: FuseNavigationService,
        private _roleService: RoleService,
        private _authService: AuthService,
    )
    {
        console.log('🎨 [ClassyLayout] Inicializando layout classy original...');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number
    {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) =>
            {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
                console.log('📱 [ClassyLayout] Screen small:', this.isScreenSmall);
            });

        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation) =>
            {
                // Handle navigation structure - could be object with default property or direct array
                if (navigation) {
                    this.navigation = (navigation as any)?.default || navigation || [];
                    const navArray = Array.isArray(this.navigation) ? this.navigation : [];
                    console.log('🧭 [ClassyLayout] Navegación cargada:', {
                        totalItems: navArray.length || 0,
                        groupsWithChildren: navArray.filter(item => item.children?.length > 0).length || 0
                    });
                } else {
                    this.navigation = [];
                    console.log('🧭 [ClassyLayout] Navegación vacía');
                }
            });

        // Subscribe to current user
        this._roleService.currentUser$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user) => {
                this.user = user;
                console.log('👤 [ClassyLayout] Usuario cargado:', user?.nombre || 'Sin usuario');
            });

        // Subscribe to selected role
        this._roleService.selectedRole$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((role) => {
                this.selectedRole = role || '';
                console.log('🎭 [ClassyLayout] Rol seleccionado:', role);
            });

        // Get available roles
        this.availableRoles = this._roleService.getAvailableRoles() || [];
        console.log('🎭 [ClassyLayout] Roles disponibles:', this.availableRoles);

        // Subscribe to selected clinic
        this._roleService.selectedClinica$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinica) => {
                this.selectedClinica = clinica;
                console.log('🏥 [ClassyLayout] Clínica seleccionada:', clinica?.name);
            });

        // Subscribe to clinics list
        this._roleService.clinicas$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinicas) => {
                this.clinicas = clinicas || [];
                console.log('🏥 [ClassyLayout] Clínicas disponibles:', clinicas?.length || 0);
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void
    {
        // Get the navigation
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

        if ( navigation )
        {
            // Toggle the opened status
            navigation.toggle();
        }
    }

    /**
     * Change role
     */
    onRoleChange(newRole: string): void
    {
        console.log('🎭 [ClassyLayout] Cambiando rol a:', newRole);
        this._roleService.setRole(newRole);
    }

    /**
     * Change clinic
     */
    onClinicChange(clinica: UsuarioClinicaResponse): void
    {
        console.log('🏥 [ClassyLayout] Cambiando clínica a:', clinica?.name);
        this._roleService.setClinica(clinica);
    }

    /**
     * Get user initials
     */
    getUserInitials(): string
    {
        if (!this.user?.nombre) return 'U';
        const names = this.user.nombre.split(' ');
        const apellidos = this.user.apellidos?.split(' ') || [];
        const firstInitial = names[0]?.charAt(0) || '';
        const lastInitial = apellidos[0]?.charAt(0) || names[1]?.charAt(0) || '';
        return (firstInitial + lastInitial).toUpperCase();
    }
}

