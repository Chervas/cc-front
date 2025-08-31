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
import { Subject, takeUntil, Observable } from 'rxjs';

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

    // ✅ CORREGIDO: Usar Observable para roles disponibles
    availableRoles$: Observable<string[]>;
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

        // ✅ CORREGIDO: Usar Observable reactivo para roles disponibles
        this.availableRoles$ = this.roleService.availableRoles$;
        
        // ✅ OPCIONAL: Suscribirse para debug (se puede quitar en producción)
        this.roleService.availableRoles$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((roles) => {
                console.log('🎭 [ClassyLayout] Roles disponibles actualizados:', roles);
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
     * Handle role change
     */
    onRoleChange(role: string): void
    {
        console.log('🎭 [ClassyLayout] Cambio de rol:', role);
        // ✅ CORREGIDO: Usar setRole() en lugar de setSelectedRole()
        this.roleService.setRole(role);
    }

    /**
     * ✅ NUEVO: Get role icon using Fuse icons
     */
    getRoleIcon(role: string): string
    {
        const icons: Record<string, string> = {
            'administrador': 'heroicons_outline:shield-check',
            'propietario': 'heroicons_outline:building-office',
            'medico': 'heroicons_outline:user-circle',
            'paciente': 'heroicons_outline:user'
        };
        return icons[role] || 'heroicons_outline:user';
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
                    console.log('✅ [ClassyLayout] Grupos cargados:', this.groups.length, this.groups);
                    this.updateClinicLists();
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

        // ✅ LÓGICA JERÁRQUICA CORREGIDA
        this.buildHierarchicalGroups();
    }

    /**
     * ✅ FUNCIÓN CORREGIDA: Construir grupos jerárquicos
     */
    private buildHierarchicalGroups(): void {
        const totalClinics = this.clinicasForRole.length;

        console.log('🔍 [ClassyLayout] Construyendo grupos jerárquicos:', {
            totalClinics,
            groups: this.groups.length,
            clinicasForRole: this.clinicasForRole.map(c => ({
                name: c.name,
                groupId: c.groupId,
                grupoClinica: c.grupoClinica
            }))
        });

        if (totalClinics === 0) {
            this.clinicGroups = [];
            return;
        }

        // Group clinics by their groups
        const grouped: { [key: string]: UsuarioClinicaResponse[] } = {};

        // ✅ CORREGIDO: Primero agrupar por grupos existentes
        this.groups.forEach(group => {
            const groupClinics = this.clinicasForRole.filter(clinica => {
                const clinicGroupId = clinica.grupoClinica?.id_grupo || clinica.groupId;
                const matches = String(clinicGroupId) === String(group.id_grupo);
                
                if (matches) {
                    console.log(`✅ [ClassyLayout] Clínica "${clinica.name}" pertenece al grupo "${group.nombre_grupo}"`);
                }
                
                return matches;
            });

            if (groupClinics.length > 0) {
                grouped[group.nombre_grupo] = groupClinics;
                console.log(`📋 [ClassyLayout] Grupo "${group.nombre_grupo}": ${groupClinics.length} clínicas`);
            }
        });

        // ✅ CORREGIDO: Clínicas sin grupo
        const ungrouped = this.clinicasForRole.filter(c => {
            const clinicGroupId = c.grupoClinica?.id_grupo || c.groupId;
            const hasGroup = clinicGroupId && this.groups.some(g => String(g.id_grupo) === String(clinicGroupId));
            
            if (!hasGroup) {
                console.log(`🔍 [ClassyLayout] Clínica "${c.name}" sin grupo (groupId: ${clinicGroupId})`);
            }
            
            return !hasGroup;
        });

        if (ungrouped.length > 0) {
            grouped['Sin Grupo'] = ungrouped;
            console.log(`📋 [ClassyLayout] Sin Grupo: ${ungrouped.length} clínicas`);
        }

        // ✅ CORREGIDO: Ordenar grupos - grupos reales primero, "Sin Grupo" al final
        const groupNames = Object.keys(grouped);
        const realGroups = groupNames.filter(name => name !== 'Sin Grupo').sort();
        const orderedGroupNames = [...realGroups];
        
        if (grouped['Sin Grupo']) {
            orderedGroupNames.push('Sin Grupo');
        }

        // Convert to array in correct order
        this.clinicGroups = orderedGroupNames.map(groupName => ({
            name: groupName,
            clinics: grouped[groupName]
        }));

        console.log('📋 [ClassyLayout] Grupos finales para template:', this.clinicGroups.map(g => ({
            name: g.name,
            count: g.clinics.length
        })));
    }

    /**
     * Get the currently selected clinic ID for the select component
     */
    getSelectedClinicId(): string | number
    {
        return this.selectedClinicOption || 'all';
    }

    /**
     * ✅ CORREGIDO: Handle clinic selection change - ahora maneja "Sin Grupo" como seleccionable
     */
    onClinicChange(value: string | number): void
    {
        console.log('🔄 [ClassyLayout] Cambio de clínica/grupo:', value);

        if (value === 'all') {
            // Show all clinics
            this.selectedClinicOption = 'all';
            this.selectedGroupName = null;
            // Señal explícita de "todas" para que las vistas carguen todo
            this.clinicFilterService.setSelectedClinicId('all');
            this.clinicFilterService.setSelectedGroupName(null);
        } else if (typeof value === 'string' && value.startsWith('group:')) {
            // Group selected (including "Sin Grupo")
            const groupName = value.replace('group:', '');
            this.selectedClinicOption = value;
            this.selectedGroupName = groupName;
            
            // Get all clinic IDs from this group
            const group = this.clinicGroups.find(g => g.name === groupName);
            if (group && group.clinics.length > 0) {
                console.log(`🏥 [ClassyLayout] Seleccionado grupo "${groupName}" con ${group.clinics.length} clínicas`);
                this.clinicFilterService.setFilteredClinics(group.clinics);
                this.clinicFilterService.setSelectedGroupName(groupName);
                // Propagar IDs como CSV para vistas que aceptan multi-clínica
                const csvIds = group.clinics.map(c => c.id).join(',');
                this.clinicFilterService.setSelectedClinicId(csvIds);
            } else {
                // Grupo sin clínicas: limpiar selección
                this.clinicFilterService.setSelectedGroupName(null);
                this.clinicFilterService.setSelectedClinicId(null);
            }
        } else {
            // Individual clinic selected
            const clinicId = typeof value === 'string' ? parseInt(value) : value;
            const clinic = this.clinicasForRole.find(c => c.id === clinicId);
            
            if (clinic) {
                this.selectedClinicOption = clinicId;
                this.selectedGroupName = null;
                console.log(`🏥 [ClassyLayout] Seleccionada clínica individual: ${clinic.name}`);
                this.clinicFilterService.setSelectedClinicId(clinicId.toString());
                this.clinicFilterService.setSelectedGroupName(null);
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
