import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✅ USAR TIPOS VERIFICADOS
import { RoleService, Usuario, UsuarioClinicaResponse } from 'app/core/services/role.service';

@Component({
    selector: 'app-role-test',
    templateUrl: './role-test-component.html',
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule
    ],
    standalone: true
})
export class RoleTestComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();
    
    // ✅ PROPIEDADES USANDO TIPOS VERIFICADOS
    currentUser: Usuario | null = null;
    clinicas: UsuarioClinicaResponse[] = [];
    selectedRole: string | null = null;
    selectedClinica: UsuarioClinicaResponse | null = null;
    testResults: any = {};

    constructor(private roleService: RoleService) {}

    ngOnInit(): void {
        console.log('🧪 RoleTestComponent: Inicializando con datos reales del backend...');
        this.loadRealData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ✅ CARGAR DATOS REALES DEL BACKEND - VERIFICADO
    private loadRealData(): void {
        this.roleService.currentUser$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(user => {
            this.currentUser = user;
            this.log(`👤 Usuario actual: ${user?.nombre} ${user?.apellidos} (ID: ${user?.id_usuario})`);
        });

        this.roleService.clinicasConRol$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(clinicas => {
            this.clinicas = clinicas;
            this.log(`🏥 Clínicas disponibles: ${clinicas.length}`);
            clinicas.forEach(clinica => {
                // ✅ USAR PROPIEDADES REALES - VERIFICADO
                this.log(`  - ${clinica.name} (${clinica.userRole})`);  // ← PROPIEDADES REALES
            });
        });

        this.roleService.selectedRole$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(role => {
            this.selectedRole = role;
            this.log(`🎭 Rol seleccionado: ${role}`);
            console.log('🔍 [DEBUG] Rol actual del usuario:', this.getCurrentRole());
            console.log('🔍 [DEBUG] ¿Tiene rol admin?', this.roleService.hasRole('administrador'));
            console.log('🔍 [DEBUG] ¿Tiene rol propietario?', this.roleService.hasRole('propietario'));
            console.log('🔍 [DEBUG] ¿Tiene rol administrador?', this.roleService.hasRole('administrador'));
            console.log('🔍 [DEBUG] ¿Tiene rol personaldeclinica?', this.roleService.hasRole('personaldeclinica'));
        });

        this.roleService.selectedClinica$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(clinica => {
            this.selectedClinica = clinica;
            // ✅ USAR PROPIEDADES REALES - VERIFICADO
            this.log(`🏥 Clínica seleccionada: ${clinica?.name}`);  // ← PROPIEDAD REAL
        });
    }

    getCurrentRole(): string {
        const role = this.roleService.getCurrentRole();
        return role || 'Sin rol';
    }

    // ✅ TEST DE ROLES USANDO PROPIEDADES REALES - VERIFICADO
    testRoles(): void {
        this.log('🧪 Iniciando test de roles con valores reales...');
        
        const rolesReales: string[] = ['administrador', 'propietario', 'doctor', 'personal', 'paciente'];
        
        this.testResults.roles = {};

        rolesReales.forEach(role => {
            const hasRole = this.roleService.hasRole(role);
            this.testResults.roles[role] = hasRole;
            this.log(`🧪 Rol ${role}: ${hasRole ? '✅' : '❌'}`);
        });

        const isAdmin = this.roleService.isAdmin();
        this.testResults.isAdmin = isAdmin;
        this.log(`🧪 Es Admin: ${isAdmin ? '✅' : '❌'}`);
    }

    testPermissions(): void {
        this.log('🧪 Iniciando test de permisos basados en roles reales...');
        
        const permissions = this.roleService.getCurrentPermissions();
        this.testResults.permissions = permissions;
        
        this.log(`🧪 Permisos actuales (${permissions.length}):`);
        permissions.forEach(permission => {
            this.log(`  - ${permission}`);
        });
    }

    testAdvancedPermissions(): void {
        this.log('🧪 Iniciando test de permisos avanzados...');
        
        this.testResults.advancedPermissions = {};
        
        const permissionGroups = [
            ['clinic.manage', 'users.manage'],
            ['patients.view', 'appointments.view'],
            ['settings.modify']
        ];

        permissionGroups.forEach((group, index) => {
            const currentPermissions = this.roleService.getCurrentPermissions();
            const hasAllPermissions = group.every(permission => 
                currentPermissions.includes(permission)
            );
            
            this.testResults.advancedPermissions[`group_${index}`] = {
                permissions: group,
                hasAll: hasAllPermissions
            };
            
            this.log(`🧪 Grupo ${index}: ${group.join(', ')} → ${hasAllPermissions ? '✅' : '❌'}`);
        });
    }

    // ✅ TEST DE CLÍNICAS POR ROL USANDO PROPIEDADES REALES - VERIFICADO
    testClinicasByRole(): void {
        this.log('🧪 Iniciando test de clínicas por rol...');
        
        this.testResults.clinicasByRole = {};
        
        const rolesReales: string[] = ['administrador', 'propietario', 'doctor', 'personal', 'paciente'];
        
        rolesReales.forEach(role => {
            const clinicas = this.roleService.getClinicasByRole(role);
            this.testResults.clinicasByRole[role] = clinicas;
            
            this.log(`🧪 Clínicas como ${role}: ${clinicas.length}`);
            clinicas.forEach(clinica => {
                // ✅ USAR PROPIEDADES REALES - VERIFICADO
                this.log(`  - ${clinica.name} (${clinica.userSubRole || 'Sin subrol'})`);  // ← PROPIEDADES REALES
            });
        });
    }

    changeRole(role: string): void {
        this.log(`🧪 Cambiando rol a: ${role}`);
        this.roleService.selectRole(role);
    }

    // ✅ CAMBIAR CLÍNICA USANDO PROPIEDADES REALES - VERIFICADO
    changeClinica(clinica: UsuarioClinicaResponse): void {
        this.log(`🧪 Cambiando clínica a: ${clinica.name}`);  // ← PROPIEDAD REAL
        this.roleService.selectClinica(clinica);
    }

    // ✅ OBTENER ROLES DISPONIBLES USANDO PROPIEDADES REALES - VERIFICADO
    getAvailableRoles(): string[] {
        return this.clinicas.map(clinica => clinica.userRole)  // ← PROPIEDAD REAL
            .filter((role, index, array) => array.indexOf(role) === index);
    }

    getUserInfo(): string {
        if (!this.currentUser) return 'No hay usuario cargado';
        
        return `${this.currentUser.nombre} ${this.currentUser.apellidos} (${this.currentUser.email_usuario})`;
    }

    // ✅ OBTENER INFORMACIÓN DE LA CLÍNICA USANDO PROPIEDADES REALES - VERIFICADO
    getClinicaInfo(): string {
        if (!this.selectedClinica) return 'No hay clínica seleccionada';
        
        return `${this.selectedClinica.name} - ${this.selectedClinica.userRole}${  // ← PROPIEDADES REALES
            this.selectedClinica.userSubRole ? ` (${this.selectedClinica.userSubRole})` : ''  // ← PROPIEDAD REAL
        }`;
    }

    clearResults(): void {
        this.testResults = {};
        this.log('🧪 Resultados limpiados');
    }

    getResultsJson(): string {
        return JSON.stringify(this.testResults, null, 2);
    }

    hasResults(): boolean {
        return Object.keys(this.testResults).length > 0;
    }

    reloadData(): void {
        this.log('🧪 Recargando datos del backend...');
        this.clearResults();
    }

    private log(message: string): void {
        console.log(message);
    }

    // ✅ OBTENER ESTADÍSTICAS USANDO PROPIEDADES REALES - VERIFICADO
    getStats(): any {
        return {
            totalClinicas: this.clinicas.length,
            rolesUnicos: this.getAvailableRoles().length,
            rolActual: this.selectedRole,
            clinicaActual: this.selectedClinica?.name || 'Ninguna',  // ← PROPIEDAD REAL
            esAdmin: this.roleService.isAdmin(),
            permisos: this.roleService.getCurrentPermissions().length
        };
    }

    testRolesReales(): void {
        this.log('🧪 Iniciando test de roles reales del backend...');
        
        this.testResults.rolesReales = {};
        
        const rolesReales: string[] = ['administrador', 'propietario', 'doctor', 'personal', 'paciente'];

        rolesReales.forEach(role => {
            const hasRole = this.roleService.hasRole(role);
            const level = this.roleService.getRoleLevel(role);
            const label = this.roleService.getRoleLabel(role);
            const color = this.roleService.getRoleColor(role);
            const icon = this.roleService.getRoleIcon(role);
            
            this.testResults.rolesReales[role] = {
                hasRole,
                level,
                label,
                color,
                icon
            };
            
            this.log(`🧪 Rol ${role}: ${hasRole ? '✅' : '❌'} (Nivel: ${level}, Label: ${label})`);
        });
    }

    runAllTests(): void {
        this.log('🧪 Ejecutando todos los tests...');
        this.clearResults();
        
        this.testRoles();
        this.testPermissions();
        this.testAdvancedPermissions();
        this.testClinicasByRole();
        this.testRolesReales();
        
        this.log('🧪 Todos los tests completados');
    }

    testRoleLevels(): void {
        this.log('🧪 Iniciando test de niveles de roles...');
        
        this.testResults.roleLevels = {};
        
        const rolesReales: string[] = ['administrador', 'propietario', 'doctor', 'personal', 'paciente'];
        
        rolesReales.forEach(role => {
            const level = this.roleService.getRoleLevel(role);
            this.testResults.roleLevels[role] = level;
            this.log(`🧪 Nivel de ${role}: ${level}`);
        });
    }

    testRoleDisplay(): void {
        this.log('🧪 Iniciando test de display de roles...');
        
        this.testResults.roleDisplay = {};
        
        const rolesReales: string[] = ['administrador', 'propietario', 'doctor', 'personal', 'paciente'];
        
        rolesReales.forEach(role => {
            this.testResults.roleDisplay[role] = {
                label: this.roleService.getRoleLabel(role),
                color: this.roleService.getRoleColor(role),
                icon: this.roleService.getRoleIcon(role)
            };
            
            this.log(`🧪 Display ${role}: ${this.roleService.getRoleLabel(role)} (${this.roleService.getRoleColor(role)})`);
        });
    }
}

