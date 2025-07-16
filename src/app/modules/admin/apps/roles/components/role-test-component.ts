import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, combineLatest } from 'rxjs';

// 🔧 Importaciones de servicios (RUTAS CORREGIDAS)
import { RoleService } from 'app/core/services/role.service';
import { PermissionService } from 'app/core/services/permission.service';

// 🔧 Importaciones de directivas (RUTAS CORREGIDAS)
import { HasRoleDirective } from '../shared/has-role.directive';
import { HasPermissionDirective } from '../shared/has-permission.directive';

// 🔧 Importaciones de tipos (CORREGIDO - Usar tipos reales del servicio)
import { UserRole, UsuarioConRoles } from 'app/core/services/role.service';

/**
 * 🧪 Componente de Testing del Sistema de Roles
 * 
 * Este componente permite probar todas las funcionalidades del sistema de roles:
 * - Verificación de roles mediante directivas *hasRole
 * - Verificación de permisos mediante directivas *hasPermission
 * - Testing de métodos del RoleService y PermissionService
 * - Visualización del estado actual del usuario y sus permisos
 */
@Component({
    selector: 'app-role-test',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        HasRoleDirective,        // ✅ Directiva restaurada con ruta correcta
        HasPermissionDirective   // ✅ Directiva restaurada con ruta correcta
    ],
    templateUrl: './role-test-component.html'  // ✅ SIN styleUrls - Usando solo estilos de Fuse
    // ✅ SIN styleUrls - Usando solo componentes de Fuse/Material
})
export class RoleTestComponent implements OnInit, OnDestroy {
    
    // 🔄 Subject para manejo de suscripciones
    private destroy$ = new Subject<void>();

    // 📊 Estado del componente (CORREGIDO - Usar tipos reales)
    currentUser: UsuarioConRoles | null = null;
    selectedRole: UserRole | null = null;
    availableRoles: UserRole[] = [];

    // 📋 Resultados de testing
    testResults: string[] = [];
    permissionResults: string[] = [];
    debugLogs: string[] = [];

    constructor(
        private roleService: RoleService,
        private permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        console.log('[RoleTestComponent] Inicializando componente de testing');
        this.setupSubscriptions();
        this.loadPermissions();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // 🔄 CONFIGURAR SUSCRIPCIONES A OBSERVABLES
    private setupSubscriptions(): void {
        // Suscribirse a cambios en el usuario actual
        this.roleService.currentUser$.pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                this.currentUser = user;
                this.log(`Usuario actual: ${this.getUserDisplayName()}`);
            });

        // Suscribirse a cambios en el rol seleccionado
        this.roleService.selectedRole$.pipe(takeUntil(this.destroy$))
            .subscribe(role => {
                this.selectedRole = role;
                this.log(`Rol seleccionado: ${role || 'Ninguno'}`);
            });

        // Suscribirse a cambios en roles disponibles
        this.roleService.availableRoles$.pipe(takeUntil(this.destroy$))
            .subscribe(roles => {
                this.availableRoles = roles;
                this.log(`Roles disponibles: ${roles.join(', ')}`);
            });
    }

    // 👤 OBTENER NOMBRE PARA MOSTRAR DEL USUARIO
    getUserDisplayName(): string {
        if (!this.currentUser) return 'Usuario no cargado';
        return `ID: ${this.currentUser.id_usuario}`;
    }

    // 🔐 CARGAR PERMISOS DEL USUARIO ACTUAL
    private loadPermissions(): void {
        try {
            this.log('[PermissionService] Cargando permisos del usuario actual...');
            
            // Intentar recargar permisos si el método existe
            if (typeof this.permissionService.reloadPermissions === 'function') {
                const result = this.permissionService.reloadPermissions();
                if (result && typeof result.subscribe === 'function') {
                    result.pipe(takeUntil(this.destroy$)).subscribe({
                        next: () => this.log('[PermissionService] Permisos recargados exitosamente'),
                        error: (error) => this.log(`[PermissionService] Error recargando permisos: ${error}`)
                    });
                } else {
                    this.log('[PermissionService] Permisos recargados (método síncrono)');
                }
            } else {
                this.log('[PermissionService] Método reloadPermissions no disponible');
            }
        } catch (error) {
            this.log(`[PermissionService] Error en loadPermissions: ${error}`);
        }
    }

    // 🧪 TEST DE ROLES
    testRoles(): void {
        this.log('=== INICIANDO TEST DE ROLES ===');
        this.testResults = [];

        // Usar roles disponibles del usuario en lugar de array hardcodeado
        const rolesToTest = this.availableRoles.length > 0 ? this.availableRoles : [];
        
        if (rolesToTest.length === 0) {
            this.testResults.push('❌ No hay roles disponibles para testear');
            this.log('⚠️ Usuario sin roles asignados');
            return;
        }

        rolesToTest.forEach(role => {
            try {
                const hasRoleResult = this.roleService.hasRole(role);
                
                if (hasRoleResult && typeof hasRoleResult.subscribe === 'function') {
                    // Es Observable<boolean>
                    hasRoleResult.pipe(takeUntil(this.destroy$)).subscribe(hasRole => {
                        const result = (hasRole as unknown) as boolean;
                        const status = result ? '✅' : '❌';
                        this.testResults.push(`${status} Rol ${role}: ${result}`);
                        this.log(`[RoleService] hasRole('${role}') = ${result}`);
                    });
                } else {
                    // Es boolean directo
                    const hasRole = (hasRoleResult as unknown) as boolean;
                    const status = hasRole ? '✅' : '❌';
                    this.testResults.push(`${status} Rol ${role}: ${hasRole}`);
                    this.log(`[RoleService] hasRole('${role}') = ${hasRole}`);
                }
            } catch (error) {
                this.testResults.push(`❌ Error testing rol ${role}: ${error}`);
                this.log(`[RoleService] Error en hasRole('${role}'): ${error}`);
            }
        });

        // Test adicional: isAdmin
        try {
            const isAdminResult = this.roleService.isAdmin();
            if (isAdminResult && typeof isAdminResult.subscribe === 'function') {
                isAdminResult.pipe(takeUntil(this.destroy$)).subscribe(isAdmin => {
                    const result = (isAdmin as unknown) as boolean;
                    const status = result ? '✅' : '❌';
                    this.testResults.push(`${status} Es Admin: ${result}`);
                    this.log(`[RoleService] isAdmin() = ${result}`);
                });
            } else {
                const isAdmin = (isAdminResult as unknown) as boolean;
                const status = isAdmin ? '✅' : '❌';
                this.testResults.push(`${status} Es Admin: ${isAdmin}`);
                this.log(`[RoleService] isAdmin() = ${isAdmin}`);
            }
        } catch (error) {
            this.testResults.push(`❌ Error testing isAdmin: ${error}`);
            this.log(`[RoleService] Error en isAdmin(): ${error}`);
        }

        this.log('=== TEST DE ROLES COMPLETADO ===');
    }

    // 🔐 TEST DE PERMISOS
    testPermissions(): void {
        this.log('=== INICIANDO TEST DE PERMISOS ===');
        this.permissionResults = [];

        const permissionsToTest = [
            'read_patients',
            'write_patients', 
            'delete_patients',
            'manage_clinic',
            'view_reports',
            'admin_access'
        ];

        permissionsToTest.forEach(permission => {
            try {
                const hasPermissionResult = this.permissionService.hasPermission(permission);
                
                if (hasPermissionResult && typeof hasPermissionResult.subscribe === 'function') {
                    // Es Observable<boolean>
                    hasPermissionResult.pipe(takeUntil(this.destroy$)).subscribe(hasPermission => {
                        const result = (hasPermission as unknown) as boolean;
                        const status = result ? '✅' : '❌';
                        this.permissionResults.push(`${status} ${permission}: ${result}`);
                        this.log(`[PermissionService] hasPermission('${permission}') = ${result}`);
                    });
                } else {
                    // Es boolean directo
                    const hasPermission = (hasPermissionResult as unknown) as boolean;
                    const status = hasPermission ? '✅' : '❌';
                    this.permissionResults.push(`${status} ${permission}: ${hasPermission}`);
                    this.log(`[PermissionService] hasPermission('${permission}') = ${hasPermission}`);
                }
            } catch (error) {
                this.permissionResults.push(`❌ Error testing ${permission}: ${error}`);
                this.log(`[PermissionService] Error en hasPermission('${permission}'): ${error}`);
            }
        });

        this.log('=== TEST DE PERMISOS COMPLETADO ===');
    }

    // 🔬 TEST AVANZADO DE PERMISOS
    testAdvancedPermissions(): void {
        this.log('=== INICIANDO TEST AVANZADO DE PERMISOS ===');
        
        // Test de múltiples permisos si el método existe
        if (typeof this.permissionService.hasAnyPermission === 'function') {
            const multiplePermissions = ['admin_access', 'manage_clinic', 'view_reports'];
            try {
                const hasAnyResult = this.permissionService.hasAnyPermission(multiplePermissions as any);
                
                if (hasAnyResult && typeof hasAnyResult.subscribe === 'function') {
                    hasAnyResult.pipe(takeUntil(this.destroy$)).subscribe(hasAny => {
                        const result = (hasAny as unknown) as boolean;
                        const status = result ? '✅' : '❌';
                        this.permissionResults.push(`${status} Tiene algún permiso avanzado: ${result}`);
                        this.log(`[PermissionService] hasAnyPermission(${multiplePermissions.join(', ')}) = ${result}`);
                    });
                } else {
                    const hasAny = (hasAnyResult as unknown) as boolean;
                    const status = hasAny ? '✅' : '❌';
                    this.permissionResults.push(`${status} Tiene algún permiso avanzado: ${hasAny}`);
                    this.log(`[PermissionService] hasAnyPermission(${multiplePermissions.join(', ')}) = ${hasAny}`);
                }
            } catch (error) {
                this.permissionResults.push(`❌ Error en test avanzado: ${error}`);
                this.log(`[PermissionService] Error en hasAnyPermission: ${error}`);
            }
        } else {
            this.permissionResults.push('⚠️ Método hasAnyPermission no disponible');
            this.log('[PermissionService] hasAnyPermission no está disponible');
        }

        this.log('=== TEST AVANZADO COMPLETADO ===');
    }

    // 🔄 RECARGAR PERMISOS
    reloadPermissions(): void {
        this.log('🔄 Recargando permisos...');
        this.loadPermissions();
    }

    // 🎭 RECARGAR ROLES DE USUARIO
    reloadUserRoles(): void {
        this.log('🎭 Recargando roles de usuario...');
        if (this.currentUser?.id_usuario) {
            this.roleService.loadUserRoles(this.currentUser.id_usuario).subscribe({
                next: (roles) => this.log(`✅ Roles recargados: ${roles.length} roles encontrados`),
                error: (error) => this.log(`❌ Error recargando roles: ${error}`)
            });
        } else {
            this.log('⚠️ No hay usuario actual para recargar roles');
        }
    }

    // 🎭 CAMBIAR ROL (si es posible)
    changeRole(newRole: UserRole): void {
        this.log(`🎭 Intentando cambiar rol a: ${newRole}`);
        // Verificar si el método existe y es público
        if (typeof this.roleService.setSelectedRole === 'function') {
            try {
                this.roleService.setSelectedRole(newRole);
                this.log(`✅ Rol cambiado a: ${newRole}`);
            } catch (error) {
                this.log(`❌ Error cambiando rol: ${error}`);
            }
        } else {
            this.log('⚠️ Método setSelectedRole no disponible públicamente');
        }
    }

    // 🧹 LIMPIAR LOGS
    clearLogs(): void {
        this.debugLogs = [];
        console.clear();
        this.log('🧹 Logs limpiados');
    }

    // 🧹 LIMPIAR RESULTADOS
    clearResults(): void {
        this.testResults = [];
        this.permissionResults = [];
        this.log('🧹 Resultados de tests limpiados');
    }

    // 🎭 OBTENER ROL ACTUAL
    getCurrentRole(): UserRole | null {
        return this.selectedRole;
    }

    // 📋 OBTENER ROLES DISPONIBLES
    getAvailableRoles(): UserRole[] {
        return this.availableRoles;
    }

    // 📝 FUNCIÓN DE LOGGING
    private log(message: string): void {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        this.debugLogs.push(logMessage);
        console.log(logMessage);
        
        // Mantener solo los últimos 50 logs para evitar memory leaks
        if (this.debugLogs.length > 50) {
            this.debugLogs = this.debugLogs.slice(-50);
        }
    }

    // 🔍 OBTENER INFORMACIÓN DE DEBUG
    getDebugInfo(): any {
        return {
            currentUser: this.currentUser,
            selectedRole: this.selectedRole,
            availableRoles: this.availableRoles,
            testResults: this.testResults,
            permissionResults: this.permissionResults,
            debugLogs: this.debugLogs.slice(-10) // Últimos 10 logs
        };
    }
}

