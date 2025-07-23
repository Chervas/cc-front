import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { RoleService, UsuarioClinicaResponse } from 'app/core/services/role.service';
import { AuthService } from 'app/core/auth/auth.service';
import { GroupsService } from 'app/modules/admin/apps/clinicas/groups/groups.service';
import { GroupClinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { ClinicFilterService } from 'app/core/services/clinic-filter-service';
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
        CommonModule,
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        LanguagesComponent,
        FuseFullscreenComponent,
        SearchComponent,
        ShortcutsComponent,
        MessagesComponent,
        NotificationsComponent,
        UserComponent,
        RouterOutlet,
        QuickChatComponent,
    ],
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: Navigation;
    user: any;
    
    // Role and clinic data
    availableRoles: string[] = [];
    selectedRole: string | null = null;
    clinicas: UsuarioClinicaResponse[] = [];
    selectedClinica: UsuarioClinicaResponse | null = null;
     /** Valor actualmente seleccionado en el desplegable de clínicas. Puede ser
     *  'all', 'group:<nombre>' o el ID numérico de la clínica  */
    selectedClinicOption: string | number | null = 'all';
    /** Nombre del grupo seleccionado (si aplica) */
    selectedGroupName: string | null = null;
    clinicasForRole: UsuarioClinicaResponse[] = [];
     /** Agrupaciones de clínicas disponibles para el rol actual */
    clinicGroups: { name: string; clinics: UsuarioClinicaResponse[] }[] = [];
     /** Lista de grupos obtenidos desde la API */
    groups: GroupClinica[] = [];
    
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        public roleService: RoleService,
        private _authService: AuthService,
        private clinicFilterService: ClinicFilterService,
        private _groupsService: GroupsService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        console.log('🎨 [ClassyLayout] Inicializando layout classy con selectores...');
        
        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
                console.log('🧭 [ClassyLayout] Navegación cargada:', navigation);
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
                console.log('📱 [ClassyLayout] Screen small:', this.isScreenSmall);
            });

        // Subscribe to current user
        this.roleService.currentUser$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user) => {
                this.user = user;
                console.log('👤 [ClassyLayout] Usuario cargado:', user);
                this.clinicFilterService.setCurrentUser(user);
            });

        // Subscribe to selected role
        this.roleService.selectedRole$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((role) => {
                this.selectedRole = role;
                console.log('🎭 [ClassyLayout] Rol seleccionado:', role);
                this.clinicFilterService.setSelectedRole(role || '');
                this.updateClinicLists();
            });

        // Subscribe to clinicas
        this.roleService.clinicas$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinicas: UsuarioClinicaResponse[]) => {
                this.clinicas = Array.isArray(clinicas) ? clinicas : [];
                console.log('🏥 [ClassyLayout] Clínicas actualizadas:', this.clinicas.length);
                this.updateClinicLists();
            });

        // Subscribe to selected clinica
        this.roleService.selectedClinica$
            .pipe(takeUntil(this._unsubscribeAll))
             .subscribe((clinic: UsuarioClinicaResponse | null) => {
                this.selectedClinica = clinic;
                if (clinic) {
                    this.selectedClinicOption = clinic.id;
                    this.selectedGroupName = null;
                } else if (!this.selectedGroupName) {
                    this.selectedClinicOption = 'all';
                }
                const name = clinic ? clinic.name : this.selectedGroupName || 'Todas';
                console.log('🏥 [ClassyLayout] Clínica seleccionada:', name);
            });

        // Load available clinic groups
        this._groupsService.getAllGroups()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (groups) => {
                    this.groups = groups;
                    this.updateClinicLists();
                },
                error: (error) => {
                    console.error('❌ [ClassyLayout] Error cargando grupos:', error);
                }
            });

        // Get available roles
        this.availableRoles = this.roleService.getAvailableRoles() || [];
        console.log('🎭 [ClassyLayout] Roles disponibles:', this.availableRoles);
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
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }

    /**
     * Get user initials
     */
    getUserInitials(): string {
        if (!this.user) return 'U';
        
        const firstName = this.user.nombre || '';
        const lastName = this.user.apellidos || '';
        
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }

    /**
     * Handle role change
     */
    onRoleChange(newRole: string): void {
        console.log('🎭 [ClassyLayout] Cambiando rol a:', newRole);
        this.roleService.setRole(newRole);
    }

    updateClinicLists(): void {
        if (!this.selectedRole) {
            this.clinicasForRole = [];
              this.clinicGroups = [];
            this.clinicFilterService.setFilteredClinics([]);
            return;
        }

        this.clinicasForRole = this.clinicas.filter(c => c.userRole === this.selectedRole);

        
         const groups: { name: string; clinics: UsuarioClinicaResponse[] }[] = [];


       
        // Build groups using API-provided groups
        this.groups.forEach(g => {
           const groupId = typeof g.id_grupo === 'string' ? Number(g.id_grupo) : g.id_grupo;
            const groupClinics = this.clinicasForRole.filter(c => c.grupoClinica?.id_grupo === groupId);
            if (groupClinics.length > 0) {
                groups.push({ name: g.nombre_grupo, clinics: groupClinics });
            }
        });

        // Ungrouped clinics
        const ungrouped = this.clinicasForRole.filter(c => !c.grupoClinica);
        if (ungrouped.length > 0) {
            groups.push({ name: 'Sin Grupo', clinics: ungrouped });
        }

        this.clinicGroups = groups;

        this.clinicFilterService.setFilteredClinics(this.clinicasForRole);
    }



      

    /**
     * Obtain clinics grouped by group name for the current role
     */
    getGroupedClinicasForCurrentRole(): Record<string, UsuarioClinicaResponse[]> {
         const grouped: Record<string, UsuarioClinicaResponse[]> = {};
        this.clinicGroups.forEach(g => {
            grouped[g.name] = g.clinics;
        });
        return grouped;

    }

    /**
     * Handle clinic change
     */
     onClinicChange(value: number | string | null): void {
        if (value === null || value === 'all') {
            this.selectedGroupName = null;
            this.selectedClinicOption = 'all';
            this.roleService.clearSelectedClinica();
            this.clinicFilterService.setSelectedClinicId(null);
            return;
        }

        if (typeof value === 'string' && value.startsWith('group:')) {
            const groupName = value.slice(6);
            const group = this.clinicGroups.find(g => g.name === groupName);
            const ids = group ? group.clinics.map(c => c.id).join(',') : '';
            this.selectedGroupName = groupName;
            this.selectedClinicOption = value;
            this.roleService.clearSelectedClinica();
            this.clinicFilterService.setSelectedClinicId(ids || null);
            return;
        }

        const clinic = this.clinicas.find(c => c.id === value);
        if (clinic) {
            this.selectedGroupName = null;
            this.selectedClinicOption = clinic.id;
            this.roleService.setClinica(clinic);
            this.clinicFilterService.setSelectedClinicId(String(clinic.id));
        } else {
            this.selectedGroupName = null;
            this.selectedClinicOption = 'all';
            this.roleService.clearSelectedClinica();
            this.clinicFilterService.setSelectedClinicId(null);
        }
    }

    /**
     * Get the currently selected clinic ID
     */
     getSelectedClinicId(): number | string | null {
        return this.selectedClinicOption;
    }

    /**
     * Get the currently selected clinic name
     */
    getSelectedClinicName(): string {
         if (this.selectedGroupName) {
            return this.selectedGroupName;
        }
        const selected = this.roleService.getSelectedClinica();
        return selected?.name || 'Todas';
    }
}

