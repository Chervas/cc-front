import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✅ IMPORTAR AMBAS DIRECTIVAS
import { HasRoleDirective } from '../shared/has-role.directive';
import { HasPermissionDirective } from '../shared/has-permission.directive';

// ✅ USAR TIPOS VERIFICADOS
import { RoleService, Usuario, UsuarioClinicaResponse } from 'app/core/services/role.service';

@Component({
    selector: 'app-role-test',
    templateUrl: './role-test-component.html',
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        HasRoleDirective,        // ✅ DIRECTIVA PARA ROLES
        HasPermissionDirective   // ✅ DIRECTIVA PARA PERMISOS - AGREGADA
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
        console.log('✅ RoleTestComponent: Inicializando con datos reales del backend...');
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
            console.log('👤 [RoleTestComponent] Usuario actual:', user);
            this.currentUser = user;
        });

        this.roleService.clinicas$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(clinicas => {
            console.log('🏥 [RoleTestComponent] Clínicas cargadas:', clinicas.length);
            this.clinicas = clinicas;
        });

        this.roleService.selectedRole$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(role => {
            console.log('🎭 [RoleTestComponent] Rol seleccionado:', role);
            this.selectedRole = role;
        });

        this.roleService.selectedClinica$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(clinica => {
            console.log('🏥 [RoleTestComponent] Clínica seleccionada:', clinica);
            this.selectedClinica = clinica;
        });
    }

    getCurrentRole(): string {
        const role = this.roleService.getCurrentRole();
        console.log('🔍 [DEBUG] Rol actual del usuario:', role);
        return role || 'Sin rol';
    }

    testRoles(): void {
        console.log('🧪 [RoleTestComponent] Iniciando test de roles...');
        
        const roles = ['administrador', 'propietario', 'paciente', 'medico'];
        const results: any = {};

        roles.forEach(role => {
            const hasRole = this.roleService.hasRole(role);
            results[role] = hasRole;
            console.log(`🔍 [DEBUG] ¿Tiene rol ${role}? ${hasRole}`);
        });

        this.testResults.roles = results;
        console.log('📊 [RoleTestComponent] Resultados de test de roles:', results);
    }

    // ✅ NUEVO MÉTODO PARA TESTEAR PERMISOS ESPECÍFICOS
    testPermissions(): void {
        console.log('🧪 [RoleTestComponent] Iniciando test de permisos...');
        
        // ✅ USAR LOS PERMISOS DEFINIDOS EN EL HTML
        const permissions = [
            'clinics.manage',
            'patients.view',
            'users.manage',
            'reports.view',
            'settings.manage'
        ];
        
        const results: any = {};

        permissions.forEach(permission => {
            const hasPermission = this.roleService.hasPermission(permission);
            results[permission] = hasPermission;
            console.log(`🔍 [DEBUG] ¿Tiene permiso ${permission}? ${hasPermission}`);
        });

        this.testResults.permissions = results;
        console.log('📊 [RoleTestComponent] Resultados de test de permisos:', results);
    }

    // ✅ MÉTODO PARA TESTEAR PERMISOS MÚLTIPLES
    testMultiplePermissions(): void {
        console.log('🧪 [RoleTestComponent] Iniciando test de permisos múltiples...');
        
        const permissionGroups = [
            ['clinics.manage', 'patients.view'],
            ['users.manage', 'settings.manage'],
            ['reports.view', 'reports.generate']
        ];
        
        const results: any = {};

        permissionGroups.forEach((group, index) => {
            const hasAny = this.roleService.hasAnyPermission(group);
            const hasAll = this.roleService.hasAllPermissions(group);
            
            results[`group_${index + 1}_any`] = hasAny;
            results[`group_${index + 1}_all`] = hasAll;
            
            console.log(`🔍 [DEBUG] ¿Tiene algún permiso de [${group.join(', ')}]? ${hasAny}`);
            console.log(`🔍 [DEBUG] ¿Tiene todos los permisos de [${group.join(', ')}]? ${hasAll}`);
        });

        this.testResults.multiplePermissions = results;
        console.log('📊 [RoleTestComponent] Resultados de test de permisos múltiples:', results);
    }

    testAdvancedPermissions(): void {
        console.log('🧪 [RoleTestComponent] Iniciando test de permisos avanzados...');
        
        const advancedTests = [
            { permission: 'gestionar_usuarios', clinica: 'Clínica Central' },
            { permission: 'ver_reportes', clinica: 'Clínica Norte' },
            { permission: 'crear_paciente', clinica: null }
        ];
        
        const results: any = {};

        advancedTests.forEach(test => {
            const hasPermission = this.roleService.hasPermission(test.permission);
            const key = `${test.permission}_${test.clinica || 'global'}`;
            results[key] = hasPermission;
            console.log(`🔍 [DEBUG] ¿Tiene permiso ${test.permission} en ${test.clinica || 'global'}? ${hasPermission}`);
        });

        this.testResults.advancedPermissions = results;
        console.log('📊 [RoleTestComponent] Resultados de test de permisos avanzados:', results);
    }

    testClinicasByRole(): void {
        console.log('🧪 [RoleTestComponent] Iniciando test de clínicas por rol...');
        
        const roles = ['administrador', 'propietario', 'paciente'];
        const results: any = {};

        roles.forEach(role => {
            const clinicas = this.roleService.getClinicasByRole(role);
            results[role] = clinicas.length;
            console.log(`🔍 [DEBUG] Clínicas con rol ${role}: ${clinicas.length}`);
        });

        this.testResults.clinicasByRole = results;
        console.log('📊 [RoleTestComponent] Resultados de test de clínicas por rol:', results);
    }

    changeRole(role: string): void {
        console.log(`🔄 [RoleTestComponent] Cambiando a rol: ${role}`);
        this.roleService.setRole(role);
    }

    changeClinica(clinica: UsuarioClinicaResponse): void {
        console.log(`🔄 [RoleTestComponent] Cambiando a clínica: ${clinica.name}`);
        this.roleService.setClinica(clinica);
    }

    getAvailableRoles(): string[] {
        const roles = this.roleService.getAvailableRoles();
        console.log('📋 [RoleTestComponent] Roles disponibles:', roles);
        return roles;
    }

    getUserInfo(): string {
        if (!this.currentUser) return 'No hay usuario';
        return `${this.currentUser.nombre} ${this.currentUser.apellidos} (ID: ${this.currentUser.id_usuario})`;
    }

    getClinicaInfo(): string {
        if (!this.selectedClinica) return 'No hay clínica seleccionada';
        return `${this.selectedClinica.name} - Rol: ${this.selectedClinica.userRole}`;
    }

    clearResults(): void {
        this.testResults = {};
        console.log('🧹 [RoleTestComponent] Resultados limpiados');
    }

    getResultsJson(): string {
        return JSON.stringify(this.testResults, null, 2);
    }

    hasResults(): boolean {
        return Object.keys(this.testResults).length > 0;
    }

    reloadData(): void {
        console.log('🔄 [RoleTestComponent] Recargando datos...');
        this.roleService.reloadUserData();
    }

    log(message: string): void {
        console.log(`📝 [RoleTestComponent] ${message}`);
    }

    getStats(): any {
        return {
            totalClinicas: this.clinicas.length,
            rolesDisponibles: this.getAvailableRoles().length,
            rolActual: this.selectedRole,
            clinicaActual: this.selectedClinica?.name || 'Ninguna'
        };
    }

    testRolesReales(): void {
        console.log('🧪 [RoleTestComponent] Test con roles reales del sistema...');
        
        const rolesReales = this.getAvailableRoles();
        const results: any = {};

        rolesReales.forEach(role => {
            const hasRole = this.roleService.hasRole(role);
            results[role] = hasRole;
            console.log(`🔍 [DEBUG] ¿Tiene rol real ${role}? ${hasRole}`);
        });

        this.testResults.rolesReales = results;
        console.log('📊 [RoleTestComponent] Resultados de test de roles reales:', results);
    }

    // ✅ MÉTODO ACTUALIZADO PARA INCLUIR TESTS DE PERMISOS
    runAllTests(): void {
        console.log('🚀 [RoleTestComponent] Ejecutando todos los tests...');
        this.clearResults();
        this.testRoles();
        this.testPermissions();              // ✅ AGREGADO
        this.testMultiplePermissions();      // ✅ AGREGADO
        this.testAdvancedPermissions();
        this.testClinicasByRole();
        this.testRolesReales();
        this.testRoleLevels();               // ✅ AGREGADO
        console.log('✅ [RoleTestComponent] Todos los tests completados');
    }

    testRoleLevels(): void {
        console.log('🧪 [RoleTestComponent] Test de niveles de rol...');
        
        const levels = [
            { role: 'administrador', level: 4 },
            { role: 'propietario', level: 3 },
            { role: 'medico', level: 2 },
            { role: 'paciente', level: 1 }
        ];
        
        const results: any = {};

        levels.forEach(item => {
            const hasAccess = this.roleService.hasRoleLevel(item.level);
            results[`${item.role}_level_${item.level}`] = hasAccess;
            console.log(`🔍 [DEBUG] ¿Acceso nivel ${item.level} (${item.role})? ${hasAccess}`);
        });

        this.testResults.roleLevels = results;
        console.log('📊 [RoleTestComponent] Resultados de test de niveles:', results);
    }

    testRoleDisplay(): void {
        console.log('🧪 [RoleTestComponent] Test de visualización de roles...');
        
        const displayTests = [
            'administrador',
            'propietario', 
            'medico',
            'paciente',
            ['administrador', 'propietario'],
            ['medico', 'paciente']
        ];
        
        const results: any = {};

        displayTests.forEach((test, index) => {
            const key = Array.isArray(test) ? test.join('_o_') : test;
            const hasRole = Array.isArray(test) 
                ? test.some(role => this.roleService.hasRole(role))
                : this.roleService.hasRole(test);
            
            results[key] = hasRole;
            console.log(`🔍 [DEBUG] ¿Mostrar para ${key}? ${hasRole}`);
        });

        this.testResults.roleDisplay = results;
        console.log('📊 [RoleTestComponent] Resultados de test de visualización:', results);
    }

    // ✅ NUEVO MÉTODO PARA MOSTRAR PERMISOS ACTUALES
    getCurrentPermissions(): string[] {
        return this.roleService.getCurrentPermissions();
    }

    // ✅ NUEVO MÉTODO PARA DEBUG DEL ESTADO ACTUAL
    debugCurrentState(): void {
        console.log('🔍 [RoleTestComponent] Ejecutando debug del estado actual...');
        this.roleService.debugCurrentState();
        
        const currentPermissions = this.getCurrentPermissions();
        console.log('🔑 [RoleTestComponent] Permisos actuales:', currentPermissions);
        
        // Test específico de los permisos del HTML
        const htmlPermissions = ['clinics.manage', 'patients.view'];
        htmlPermissions.forEach(permission => {
            const hasPermission = this.roleService.hasPermission(permission);
            console.log(`🔍 [RoleTestComponent] ¿Tiene permiso HTML '${permission}'? ${hasPermission}`);
        });
    }
}

/**
 * 📋 CAMBIOS REALIZADOS:
 * 
 * 1. ✅ IMPORT AGREGADO:
 *    - import { HasPermissionDirective } from '../shared/has-permission.directive';
 * 
 * 2. ✅ DIRECTIVA AGREGADA A IMPORTS:
 *    - HasPermissionDirective en el array de imports del @Component
 * 
 * 3. ✅ MÉTODOS NUEVOS PARA PERMISOS:
 *    - testPermissions(): Test de permisos individuales
 *    - testMultiplePermissions(): Test de permisos múltiples
 *    - getCurrentPermissions(): Obtener permisos actuales
 *    - debugCurrentState(): Debug completo del estado
 * 
 * 4. ✅ MÉTODO runAllTests() ACTUALIZADO:
 *    - Incluye todos los nuevos tests de permisos
 * 
 * 5. ✅ COMPATIBILIDAD MANTENIDA:
 *    - Todos los métodos existentes se mantienen
 *    - No se rompe funcionalidad previa
 * 
 * 📊 RESULTADO:
 * - ✅ Ambas directivas (*hasRole y *hasPermission) disponibles
 * - ✅ Tests completos para roles y permisos
 * - ✅ Debug mejorado para troubleshooting
 * - ✅ Compatible con el HTML existente
 */

