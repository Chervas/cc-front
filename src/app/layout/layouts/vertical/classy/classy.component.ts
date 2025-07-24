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
    selector     : 'classy-layout',
    templateUrl  : './classy.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone   : true,
    imports      : [
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
export class ClassyLayoutComponent implements OnInit, OnDestroy
{
    isScreenSmall: boolean;
    navigation: Navigation;
    user: any;

    // Role and clinic data
    availableRoles: string[] = [];
    selectedRole: string | null = null;
    clinicas: UsuarioClinicaResponse[] = [];
    selectedClinica: UsuarioClinicaResponse | null = null;
    /** Valor actualmente seleccionado en el desplegable de clínicas. Puede ser
     * 'all', 'group:nombreGrupo' o el ID numérico de la clínica */
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
    )
    {
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
        console.log('🔄 [ClassyLayout] Inicializando layout classy con selectores...');

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

        // ✅ CORREGIDO: Usar getAvailableRoles() en lugar de availableRoles$
        this.loadAvailableRoles();

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
            .subscribe((clinica: UsuarioClinicaResponse | null) => {
                this.selectedClinica = clinica;
                if (clinica) {
                    this.selectedClinicOption = clinica.id;
                    this.selectedGroupName = null;
                } else if (!this.selectedGroupName) {
                    this.selectedClinicOption = 'all';
                }
                const name = clinica ? clinica.name : this.selectedGroupName || 'Todas';
                console.log('🏥 [ClassyLayout] Clínica seleccionada:', name);
            });

        // Load available clinic groups
        this.loadGroups();
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
     * ✅ NUEVO MÉTODO: Cargar roles disponibles usando el método correcto
     */
    private loadAvailableRoles(): void
    {
        // Usar getAvailableRoles() que devuelve un array directamente
        this.availableRoles = this.roleService.getAvailableRoles();
        console.log('🎭 [ClassyLayout] Roles disponibles cargados:', this.availableRoles);
    }

    /**
     * Handle role change
     */
    onRoleChange(role: string): void
    {
        console.log('🎭 [ClassyLayout] Cambio de rol:', role);
        // ✅ CORREGIDO: Usar setRole() en lugar de setSelectedRole()
        this.roleService.setRole(role);
    }

    /**
     * Cargar grupos usando GroupsService
     */
    private loadGroups(): void {
        console.log('📋 [ClassyLayout] Cargando grupos...');
        
        this._groupsService.getAllGroups()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (groups) => {
                    this.groups = groups;
                    this.updateClinicLists();
                    console.log('✅ [ClassyLayout] Grupos cargados:', this.groups.length);
                },
                error: (error) => {
                    console.error('❌ [ClassyLayout] Error cargando grupos:', error);
                    this.groups = [];
                    this.updateClinicLists();
                }
            });
    }

    /**
     * Update clinic lists based on current role
     */
    private updateClinicLists(): void
    {
        if (!this.selectedRole) {
            this.clinicasForRole = [];
            this.clinicGroups = [];
            return;
        }

        this.clinicasForRole = this.roleService.getClinicasByRole(this.selectedRole);
        
        console.log('🔄 [ClassyLayout] Actualizando listas para rol:', this.selectedRole);
        console.log('🏥 [ClassyLayout] Clínicas para rol:', this.clinicasForRole.length);

        // ✅ LÓGICA JERÁRQUICA INTELIGENTE
        this.buildHierarchicalGroups();
    }

    /**
     * ✅ NUEVA FUNCIÓN: Construir grupos jerárquicos inteligentes
     */
    private buildHierarchicalGroups(): void {
        const totalClinics = this.clinicasForRole.length;
        const hasGroups = this.groups.length > 0;

        console.log('🔍 [ClassyLayout] Construyendo grupos jerárquicos:', {
            totalClinics,
            hasGroups,
            groups: this.groups.length
        });

        // Lógica condicional inteligente
        if (!hasGroups || totalClinics === 0) {
            // Sin grupos o sin clínicas: mostrar clínicas directamente
            this.clinicGroups = totalClinics > 0 ? [{
                name: 'Sin Grupo',
                clinics: this.clinicasForRole
            }] : [];
            return;
        }

        // Group clinics by their groups
        const grouped: { [key: string]: UsuarioClinicaResponse[] } = {};

        // First, group by existing groups
        this.groups.forEach(group => {
            const groupClinics = this.clinicasForRole.filter(clinica => {
                const clinicGroupId = clinica.grupoClinica?.id_grupo || clinica.groupId;
                // ✅ CORREGIDO: Usar String() para evitar comparación number vs string
                return String(clinicGroupId) === String(group.id_grupo);
            });

            if (groupClinics.length > 0) {
                grouped[group.nombre_grupo] = groupClinics;
            }

            console.log(`🏥 [ClassyLayout] Grupo "${group.nombre_grupo}" (ID: ${group.id_grupo}):`, {
                clinicsFound: groupClinics.length,
                clinics: groupClinics.map(c => ({
                    name: c.name,
                    grupoClinica: c.grupoClinica,
                    groupId: c.groupId,
                    groupName: c.groupName
                }))
            });
        });

        // Add clinics without group
        const ungrouped = this.clinicasForRole.filter(c => {
            const clinicGroupId = c.grupoClinica?.id_grupo || c.groupId;
            return !clinicGroupId;
        });

        if (ungrouped.length > 0) {
            grouped['Sin Grupo'] = ungrouped;
        }

        console.log(`🏥 [ClassyLayout] Clínicas sin grupo: ${ungrouped.length}`);

        // Convert to array
        this.clinicGroups = Object.keys(grouped).map(groupName => ({
            name: groupName,
            clinics: grouped[groupName]
        }));

        console.log('📋 [ClassyLayout] Grupos para template:', Object.keys(grouped));
    }

    /**
     * Get the currently selected clinic ID for the select component
     */
    getSelectedClinicId(): string | number
    {
        return this.selectedClinicOption || 'all';
    }

    /**
     * Handle clinic selection change
     */
    onClinicChange(value: string | number): void
    {
        console.log('🔄 [ClassyLayout] Cambio de clínica/grupo:', value);

        if (value === 'all') {
            // Show all clinics
            this.selectedClinicOption = 'all';
            this.selectedGroupName = null;
            this.clinicFilterService.setSelectedClinicId(null);
        } else if (typeof value === 'string' && value.startsWith('group:')) {
            // Group selected
            const groupName = value.replace('group:', '');
            this.selectedClinicOption = value;
            this.selectedGroupName = groupName;
            
            // Get all clinic IDs from this group
            const group = this.clinicGroups.find(g => g.name === groupName);
            if (group && group.clinics.length > 0) {
                this.clinicFilterService.setFilteredClinics(group.clinics);
            }
        } else {
            // Individual clinic selected
            const clinicId = typeof value === 'string' ? parseInt(value) : value;
            const clinic = this.clinicasForRole.find(c => c.id === clinicId);
            
            if (clinic) {
                this.selectedClinicOption = clinicId;
                this.selectedGroupName = null;
                this.clinicFilterService.setSelectedClinicId(clinicId.toString());
            }
        }
    }

    /**
     * Get display name for selected option
     */
    getSelectedDisplayName(): string
    {
        if (this.selectedGroupName) {
            return `${this.selectedGroupName} (todas)`;
        }
        
        if (this.selectedClinica) {
            return this.selectedClinica.name;
        }
        
        return 'Todas';
    }

    /**
     * ✅ NUEVA FUNCIÓN: Check if a group option should be shown
     */
    shouldShowGroupOption(groupName: string): boolean
    {
        // Don't show group option if there's only one clinic in the group
        const group = this.clinicGroups.find(g => g.name === groupName);
        return group ? group.clinics.length > 1 : false;
    }

    /**
     * ✅ NUEVA FUNCIÓN: Get clinic count for a group
     */
    getClinicCountForGroup(groupName: string): number
    {
        const group = this.clinicGroups.find(g => g.name === groupName);
        return group ? group.clinics.length : 0;
    }

    /**
     * ✅ NUEVA FUNCIÓN: Check if we should show the "all" option
     */
    shouldShowAllOption(): boolean
    {
        return this.clinicasForRole.length > 1;
    }

    /**
     * ✅ NUEVA FUNCIÓN: Get total clinic count
     */
    getTotalClinicCount(): number
    {
        return this.clinicasForRole.length;
    }

    /**
     * Get user initials for avatar
     */
    getUserInitials(): string
    {
        if (!this.user) return '';
        
        const firstName = this.user.nombre || '';
        const lastName = this.user.apellidos || '';
        
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
}

