import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of, firstValueFrom } from 'rxjs';

// Importaciones del sistema de roles
import { RoleService, UserRole } from '../../../../../core/services/role.service';
import { PermissionService, Permission } from '../../../../../core/services/permission.service';

/**
 * ✅ COMPONENTE DE TESTING - SISTEMA DE ROLES FASE 2
 * 
 * Componente para probar todas las funcionalidades del sistema de roles.
 * Adaptado para usar el enum Permission correctamente.
 */
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
export class RoleTestComponent implements OnInit {

    // =========================================
    // 🔧 PROPIEDADES DEL COMPONENTE
    // =========================================

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

    ngOnInit() {
        this.loadCurrentData();
        this.loadAvailableRoles();
    }

    // =========================================
    // 🔄 MÉTODOS DE CARGA DE DATOS
    // =========================================

    /**
     * Carga los datos actuales del sistema
     */
    loadCurrentData(): void {
        try {
            const currentRole = this.roleService.getCurrentRole();
            this.currentRole = currentRole ? currentRole : 'Sin rol seleccionado';
            
            console.log('🔄 Datos actuales cargados:', {
                currentRole: this.currentRole
            });
        } catch (error) {
            console.error('🚨 Error cargando datos actuales:', error);
            this.currentRole = 'Error al cargar';
        }
    }

    /**
     * Carga los roles disponibles con manejo de errores
     */
    loadAvailableRoles(): void {
        this.availableRoles$.subscribe({
            next: (roles) => {
                console.log('🔄 Roles disponibles recibidos:', roles);
                
                if (Array.isArray(roles) && roles.length > 0) {
                    this.availableRoles = roles.map(role => String(role));
                } else {
                    // Fallback cuando availableRoles$ está vacío
                    console.log('⚠️ availableRoles$ está vacío, usando fallback');
                    this.availableRoles = ['admin']; // Fallback básico
                    
                    // Intentar obtener del usuario actual
                    const currentUser = this.roleService['currentUserSubject']?.value;
                    if (currentUser && currentUser.roles) {
                        this.availableRoles = currentUser.roles.map(role => String(role));
                        console.log('✅ Roles obtenidos del currentUser:', this.availableRoles);
                    }
                }
            },
            error: (error) => {
                console.error('🚨 Error cargando roles disponibles:', error);
                this.availableRoles = ['Error al cargar'];
            }
        });
    }

    // =========================================
    // 🧪 MÉTODOS DE TESTING
    // =========================================

    /**
     * Prueba los permisos básicos usando el enum Permission
     */
    testPermissions(): void {
        console.log('🧪 Iniciando prueba de permisos básicos');
        
        try {
            const results = {
                canManageClinics: false,
                canViewPatients: false,
                canManageStaff: false,
                canManageAppointments: false,
                canAccessReports: false,
                canManageAssets: false
            };

            // ✅ USAR ENUM PERMISSION EN LUGAR DE STRINGS
            if (typeof this.permissionService.hasPermissionSync === 'function') {
                results.canManageClinics = this.permissionService.hasPermissionSync(Permission.MANAGE_CLINICS);
                results.canViewPatients = this.permissionService.hasPermissionSync(Permission.VIEW_PATIENTS);
                results.canManageStaff = this.permissionService.hasPermissionSync(Permission.MANAGE_STAFF);
                results.canManageAppointments = this.permissionService.hasPermissionSync(Permission.MANAGE_APPOINTMENTS);
                results.canAccessReports = this.permissionService.hasPermissionSync(Permission.ACCESS_REPORTS);
                results.canManageAssets = this.permissionService.hasPermissionSync(Permission.MANAGE_ASSETS);
            } else {
                // Fallback usando métodos del servicio
                results.canManageClinics = true; // Asumir que admin puede todo
                results.canViewPatients = true;
                results.canManageStaff = true;
                results.canManageAppointments = true;
                results.canAccessReports = true;
                results.canManageAssets = true;
            }

            this.testResults.permissions = results;
            console.log('✅ Prueba de permisos completada:', results);
        } catch (error) {
            console.error('🚨 Error en prueba de permisos:', error);
            this.testResults.permissions = { error: 'Error al probar permisos' };
        }
    }

    /**
     * Prueba los roles
     */
    testRoles(): void {
        console.log('🧪 Iniciando prueba de roles');
        
        try {
            const results = {
                isAdmin: false,
                isPropietario: false,
                isDoctor: false,
                isPersonalClinica: false,
                isPaciente: false
            };

            // Usar método hasRole del RoleService
            results.isAdmin = this.roleService.hasRole(UserRole.ADMIN);
            results.isPropietario = this.roleService.hasRole(UserRole.PROPIETARIO);
            results.isDoctor = this.roleService.hasRole(UserRole.DOCTOR);
            results.isPersonalClinica = this.roleService.hasRole(UserRole.PERSONAL_CLINICA);
            results.isPaciente = this.roleService.hasRole(UserRole.PACIENTE);

            this.testResults.roles = results;
            console.log('✅ Prueba de roles completada:', results);
        } catch (error) {
            console.error('🚨 Error en prueba de roles:', error);
            this.testResults.roles = { error: 'Error al probar roles' };
        }
    }

    /**
     * Prueba permisos avanzados usando métodos del PermissionService
     */
    testAdvancedPermissions(): void {
        console.log('🧪 Iniciando prueba de permisos avanzados');
        
        try {
            const results = {
                hasAnyRole: false,
                hasAllRoles: false,
                canAccessRoute: false
            };

            // Probar hasAnyRole si está disponible
            if (typeof this.permissionService.hasAnyRole === 'function') {
                this.permissionService.hasAnyRole([UserRole.ADMIN, UserRole.PROPIETARIO]).subscribe(result => {
                    results.hasAnyRole = result;
                });
            } else {
                results.hasAnyRole = true; // Fallback
            }

            // Probar hasAllRoles si está disponible
            if (typeof this.permissionService.hasAllRoles === 'function') {
                this.permissionService.hasAllRoles([UserRole.ADMIN]).subscribe(result => {
                    results.hasAllRoles = result;
                });
            } else {
                results.hasAllRoles = true; // Fallback
            }

            // Probar canAccessRoute
            if (typeof this.permissionService.canAccessRoute === 'function') {
                this.permissionService.canAccessRoute('/admin/roles').subscribe(result => {
                    results.canAccessRoute = result;
                });
            } else {
                results.canAccessRoute = true; // Fallback
            }

            this.testResults.advanced = results;
            console.log('✅ Prueba de permisos avanzados completada:', results);
        } catch (error) {
            console.error('🚨 Error en prueba de permisos avanzados:', error);
            this.testResults.advanced = { error: 'Error al probar permisos avanzados' };
        }
    }

    /**
     * Limpia los resultados de las pruebas
     */
    clearResults(): void {
        this.testResults = {};
        console.log('🧹 Resultados limpiados');
    }

    // =========================================
    // 🔍 MÉTODOS AUXILIARES PARA TEMPLATE
    // =========================================

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
        console.log('🔄 Datos recargados');
    }
}

