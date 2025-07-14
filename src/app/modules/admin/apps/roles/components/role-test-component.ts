import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of, firstValueFrom } from 'rxjs';

// Importaciones del sistema de roles
import { RoleService, UserRole } from '../../../../../core/services/role.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { HasRoleDirective } from '../shared/has-role.directive';
import { HasPermissionDirective } from '../shared/has-permission.directive';

/**
 * 🧪 COMPONENTE DE TESTING - SISTEMA DE ROLES FASE 2
 * 
 * Componente para probar todas las funcionalidades del sistema de roles.
 * Adaptado para manejar el RoleService real con availableRoles$ que puede estar vacío.
 */
@Component({
    selector: 'app-role-test',
    templateUrl: './role-test-component.html',
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        HasRoleDirective,
        HasPermissionDirective
    ],
    standalone: true
})
export class RoleTestComponent implements OnInit {

    // ========================================
    // 🎯 PROPIEDADES DEL COMPONENTE
    // ========================================

    // Observables del RoleService
    currentUser$ = this.roleService.currentUser$;
    availableRoles$ = this.roleService.availableRoles$;

    // Datos para mostrar en template
    currentRole: string = '';
    availableRoles: string[] = [];
    testResults: any = {};

    constructor(
        private roleService: RoleService,
        private permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.loadCurrentData();
    }

    // ========================================
    // 🔄 MÉTODOS DE CARGA DE DATOS
    // ========================================

    /**
     * Carga los datos actuales del sistema de roles
     */
    loadCurrentData(): void {
        try {
            // Obtener rol actual
            this.currentRole = this.roleService.getCurrentRole() || 'Sin rol';

            // Obtener roles disponibles de forma segura
            this.loadAvailableRoles();

            console.log('🧪 Datos cargados:', {
                currentRole: this.currentRole,
                availableRoles: this.availableRoles
            });
        } catch (error) {
            console.error('🚨 Error cargando datos:', error);
            this.currentRole = 'Error';
            this.availableRoles = [];
        }
    }

    /**
     * Carga los roles disponibles de forma segura
     */
    private loadAvailableRoles(): void {
        try {
            // Intentar obtener del observable
            this.roleService.availableRoles$.subscribe({
                next: (roles) => {
                    this.availableRoles = roles || [];
                    
                    // Si está vacío pero tenemos rol actual, agregarlo
                    if (this.availableRoles.length === 0 && this.currentRole && this.currentRole !== 'Sin rol') {
                        this.availableRoles = [this.currentRole];
                        console.log('🧪 availableRoles$ vacío, usando rol actual:', this.currentRole);
                    }
                },
                error: (error) => {
                    console.error('🚨 Error obteniendo availableRoles$:', error);
                    // Fallback: usar rol actual si existe
                    if (this.currentRole && this.currentRole !== 'Sin rol') {
                        this.availableRoles = [this.currentRole];
                    }
                }
            }).unsubscribe(); // Desuscribirse inmediatamente
        } catch (error) {
            console.error('🚨 Error en loadAvailableRoles:', error);
            this.availableRoles = [];
        }
    }

    // ========================================
    // 🧪 MÉTODOS DE TESTING
    // ========================================

    /**
     * Prueba permisos básicos
     */
    async testPermissions(): Promise<void> {
        try {
            console.log('🧪 Ejecutando test de permisos básicos...');

            const results = {
                canManageClinics: await firstValueFrom(this.permissionService.canManageClinics()),
                canViewPatients: await firstValueFrom(this.permissionService.canViewPatients()),
                canManageStaff: await firstValueFrom(this.permissionService.canManageStaff()),
                canAccessReports: await firstValueFrom(this.permissionService.canAccessReports())
            };

            this.testResults.permissions = results;
            console.log('🧪 Resultados de permisos:', results);
        } catch (error) {
            console.error('🚨 Error en test de permisos:', error);
            this.testResults.permissions = { error: error.message };
        }
    }

    /**
     * Prueba verificación de roles
     */
    async testRoles(): Promise<void> {
        try {
            console.log('🧪 Ejecutando test de roles...');

            // ✅ CORREGIDO: Usar valores exactos del enum UserRole
            const rolesToTest: UserRole[] = [
                UserRole.ADMIN,           // 'admin'
                UserRole.PROPIETARIO,     // 'propietario'
                UserRole.DOCTOR,          // 'doctor'
                UserRole.PERSONAL_CLINICA, // 'personaldeclinica'
                UserRole.PACIENTE         // 'paciente'
            ];
            
            const results: any = {};

            for (const role of rolesToTest) {
                try {
                    results[`hasRole_${role}`] = await firstValueFrom(this.permissionService.hasRole(role));
                } catch (error) {
                    console.error(`🚨 Error verificando rol ${role}:`, error);
                    results[`hasRole_${role}`] = false;
                }
            }

            this.testResults.roles = results;
            console.log('🧪 Resultados de roles:', results);
        } catch (error) {
            console.error('🚨 Error en test de roles:', error);
            this.testResults.roles = { error: error.message };
        }
    }

    /**
     * Prueba permisos avanzados
     */
    async testAdvancedPermissions(): Promise<void> {
        try {
            console.log('🧪 Ejecutando test avanzado de permisos...');

            // Obtener información detallada del sistema
            const permissionInfo = await firstValueFrom(this.permissionService.getPermissionInfo());
            console.log('🧪 Información detallada de permisos:', permissionInfo);

            // Probar validación de roles (puede fallar si availableRoles está vacío)
            let roleValidation;
            try {
                roleValidation = await firstValueFrom(this.roleService.validateCurrentRoles());
            } catch (error) {
                console.error('🧪 Error validando roles:', error.message);
                roleValidation = { valid: false, message: error.message };
            }

            const results = {
                permissionInfo: permissionInfo,
                roleValidation: roleValidation,
                isAdmin: this.roleService.isAdmin(),
                currentRoleMethod: this.roleService.getCurrentRole()
            };

            this.testResults.advanced = results;
            console.log('🧪 Resultados avanzados:', results);
        } catch (error) {
            console.error('🚨 Error en test avanzado:', error);
            this.testResults.advanced = { error: error.message };
        }
    }

    /**
     * Limpia los resultados de testing
     */
    clearResults(): void {
        this.testResults = {};
        console.log('🧪 Resultados limpiados');
    }

    // ========================================
    // 🔧 MÉTODOS AUXILIARES PARA TEMPLATE
    // ========================================

    /**
     * Obtiene el rol actual (para template)
     */
    getCurrentRole(): string {
        return this.currentRole;
    }

    /**
     * Obtiene los roles disponibles (para template)
     */
    getAvailableRoles(): string[] {
        return this.availableRoles;
    }

    /**
     * Verifica si hay resultados de testing
     */
    hasResults(): boolean {
        return Object.keys(this.testResults).length > 0;
    }

    /**
     * Obtiene los resultados como JSON formateado
     */
    getResultsJson(): string {
        try {
            return JSON.stringify(this.testResults, null, 2);
        } catch (error) {
            return '{ "error": "No se pueden mostrar los resultados" }';
        }
    }

    /**
     * Recarga los datos del sistema
     */
    reloadData(): void {
        this.loadCurrentData();
        console.log('🧪 Datos recargados');
    }
}

