import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, combineLatest } from 'rxjs';

// 🔧 Importaciones de servicios (RUTAS CORREGIDAS)
import { RoleService } from 'app/core/services/role.service';
import { PermissionService } from 'app/core/services/permission.service';

// 🎯 Importaciones de directivas (RUTAS CORREGIDAS)
import { HasRoleDirective } from '../shared/has-role.directive';
import { HasPermissionDirective } from '../shared/has-permission.directive';

// 📋 Importaciones de tipos (CORREGIDO - Usar tipos reales del servicio)
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
    templateUrl: './role-test-component.html'
    // ✅ SIN styleUrls - Usando solo estilos de Fuse
})
export class RoleTestComponent implements OnInit, OnDestroy {
    
    // 🔄 Subject para manejo de suscripciones
    private destroy$ = new Subject<void>();
    
    // 📊 Estado del componente (CORREGIDO - Usar tipos reales)
    currentUser: UsuarioConRoles | null = null;
    selectedRole: UserRole | null = null;
    availableRoles: UserRole[] = [];
    currentPermissions: string[] = [];
    isLoading = true;
    
    // 🎯 Resultados de testing
    testResults: any = {};
    
    // 📋 Logs para debugging
    logs: string[] = [];

    constructor(
        private roleService: RoleService,
        private permissionService: PermissionService
    ) {
        this.log('🚀 RoleTestComponent inicializado');
    }

    ngOnInit(): void {
        this.log('🔄 Iniciando carga de datos del usuario...');
        this.setupSubscriptions();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.log('🔚 RoleTestComponent destruido');
    }

    /**
     * 📡 Configurar suscripciones reactivas (CORREGIDO)
     */
    private setupSubscriptions(): void {
        // Suscripción combinada para obtener toda la información del usuario
        combineLatest([
            this.roleService.currentUser$,
            this.roleService.selectedRole$,
            this.roleService.availableRoles$
        ]).pipe(
            takeUntil(this.destroy$)
        ).subscribe(([user, role, roles]) => {
            this.currentUser = user;
            this.selectedRole = role;
            this.availableRoles = roles || []; // CORREGIDO: Manejar undefined
            
            // CORREGIDO: Usar propiedades que realmente existen en UsuarioConRoles
            const userName = this.getUserDisplayName(user);
            this.log(`👤 Usuario actual: ${userName}`);
            this.log(`🎭 Rol seleccionado: ${role || 'No seleccionado'}`);
            this.log(`📋 Roles disponibles: ${this.availableRoles.join(', ')}`);
            
            this.loadPermissions();
            this.isLoading = false;
        });
    }

    /**
     * 👤 Obtener nombre para mostrar del usuario (AGREGADO)
     */
    private getUserDisplayName(user: UsuarioConRoles | null): string {
        if (!user) return 'No disponible';
        
        // Usar las propiedades que realmente existen en UsuarioConRoles
        // Ajustar según la estructura real del tipo
        return user.id_usuario?.toString() || 'Usuario sin ID';
    }

    /**
     * 🔑 Cargar permisos del usuario actual (CORREGIDO)
     */
    private loadPermissions(): void {
        if (this.selectedRole) {
            // CORREGIDO: getCurrentPermissions devuelve array directamente, no Observable
            try {
                const permissions = this.permissionService.getCurrentPermissions();
                if (Array.isArray(permissions)) {
                    this.currentPermissions = permissions;
                    this.log(`🔑 Permisos cargados: ${permissions.length} permisos`);
                } else {
                    this.currentPermissions = [];
                    this.log(`⚠️ No se pudieron cargar permisos`);
                }
            } catch (error) {
                this.currentPermissions = [];
                this.log(`❌ Error cargando permisos: ${error}`);
            }
        }
    }

    /**
     * 🧪 Test básico de roles (CORREGIDO - Usar valores dinámicos)
     */
    testRoles(): void {
        this.log('🧪 === INICIANDO TEST DE ROLES ===');
        
        // CORREGIDO: Usar los roles disponibles del usuario en lugar de valores hardcodeados
        const testRoles = this.availableRoles.length > 0 ? this.availableRoles : [];
        
        if (testRoles.length === 0) {
            this.log('⚠️ No hay roles disponibles para testear');
            return;
        }
        
        testRoles.forEach(role => {
            // CORREGIDO: hasRole devuelve boolean directamente, no Observable
            try {
                const hasRole = this.roleService.hasRole(role);
                const result = hasRole ? '✅' : '❌';
                this.log(`${result} Rol '${role}': ${hasRole}`);
                this.testResults[`role_${role}`] = hasRole;
            } catch (error) {
                this.log(`❌ Error verificando rol '${role}': ${error}`);
                this.testResults[`role_${role}`] = false;
            }
        });
        
        // Test de admin (CORREGIDO)
        try {
            const isAdmin = this.roleService.isAdmin();
            const result = isAdmin ? '✅' : '❌';
            this.log(`${result} Es Admin: ${isAdmin}`);
            this.testResults.isAdmin = isAdmin;
        } catch (error) {
            this.log(`❌ Error verificando admin: ${error}`);
            this.testResults.isAdmin = false;
        }
    }

    /**
     * 🔐 Test básico de permisos (CORREGIDO - Casting seguro)
     */
    testPermissions(): void {
        this.log('🔐 === INICIANDO TEST DE PERMISOS ===');
        
        // CORREGIDO: Usar strings simples que el servicio pueda manejar
        const testPermissions = [
            'clinic.manage',
            'clinic.view_patients', 
            'clinic.manage_staff',
            'clinic.manage_appointments',
            'reports.view'
        ];
        
        testPermissions.forEach(permission => {
            try {
                // CORREGIDO: hasPermission devuelve Observable<boolean>
                const hasPermissionResult = this.permissionService.hasPermission(permission as any);
                
                if (hasPermissionResult && typeof hasPermissionResult.subscribe === 'function') {
                    // Es un Observable
                    hasPermissionResult.pipe(takeUntil(this.destroy$)).subscribe(hasPermission => {
                        const result = hasPermission ? '✅' : '❌';
                        this.log(`${result} Permiso '${permission}': ${hasPermission}`);
                        this.testResults[`permission_${permission}`] = hasPermission;
                    });
                } else {
                    // Es un valor directo - CORREGIDO: Casting seguro
                    const hasPermission = (hasPermissionResult as unknown) as boolean;
                    const result = hasPermission ? '✅' : '❌';
                    this.log(`${result} Permiso '${permission}': ${hasPermission}`);
                    this.testResults[`permission_${permission}`] = hasPermission;
                }
            } catch (error) {
                this.log(`❌ Error verificando permiso '${permission}': ${error}`);
                this.testResults[`permission_${permission}`] = false;
            }
        });
    }

    /**
     * 🎯 Test avanzado de permisos específicos (CORREGIDO)
     */
    testAdvancedPermissions(): void {
        this.log('🎯 === INICIANDO TEST AVANZADO DE PERMISOS ===');
        
        // CORREGIDO: Solo usar métodos que realmente existen
        const advancedTests = [
            { method: 'canManageClinics', name: 'Gestionar Clínicas' },
            { method: 'canViewPatients', name: 'Ver Pacientes' },
            { method: 'canManageStaff', name: 'Gestionar Personal' },
            { method: 'canManageAppointments', name: 'Gestionar Citas' },
            { method: 'canAccessReports', name: 'Acceder Reportes' }
        ];
        
        advancedTests.forEach(test => {
            try {
                if (typeof this.permissionService[test.method] === 'function') {
                    const canDo = this.permissionService[test.method]();
                    const result = canDo ? '✅' : '❌';
                    this.log(`${result} ${test.name}: ${canDo}`);
                    this.testResults[`advanced_${test.method}`] = canDo;
                } else {
                    this.log(`⚠️ Método ${test.method} no disponible`);
                    this.testResults[`advanced_${test.method}`] = false;
                }
            } catch (error) {
                this.log(`❌ Error en ${test.name}: ${error}`);
                this.testResults[`advanced_${test.method}`] = false;
            }
        });
    }

    /**
     * 🔄 Recargar permisos (CORREGIDO)
     */
    reloadPermissions(): void {
        this.log('🔄 Recargando permisos...');
        
        try {
            if (typeof this.permissionService.reloadPermissions === 'function') {
                // CORREGIDO: reloadPermissions puede ser void, no Observable
                this.permissionService.reloadPermissions();
                this.log('✅ Permisos recargados exitosamente');
                this.loadPermissions();
            } else {
                this.log('⚠️ Método reloadPermissions no disponible');
            }
        } catch (error) {
            this.log(`❌ Error recargando permisos: ${error}`);
        }
    }

    /**
     * 🔄 Recargar roles del usuario (CORREGIDO - Sin métodos inexistentes)
     */
    reloadUserRoles(): void {
        this.log('🔄 Recargando roles del usuario...');
        
        try {
            // CORREGIDO: No usar métodos que no existen
            // Solo intentar recargar si hay métodos públicos disponibles
            this.log('⚠️ Recarga automática de roles no disponible - usar refresh manual de página');
        } catch (error) {
            this.log(`❌ Error recargando roles: ${error}`);
        }
    }

    /**
     * 🎭 Cambiar rol seleccionado (CORREGIDO - Sin métodos inexistentes)
     */
    changeRole(newRole: UserRole): void {
        this.log(`🎭 Cambiando rol a: ${newRole}`);
        
        try {
            // CORREGIDO: No usar métodos que no existen
            // Solo usar métodos que realmente están disponibles
            if (typeof this.roleService.selectRole === 'function') {
                this.roleService.selectRole(newRole);
                this.log(`✅ Rol cambiado a: ${newRole}`);
            } else {
                this.log('⚠️ Método para cambiar rol no disponible - usar interfaz principal');
            }
        } catch (error) {
            this.log(`❌ Error cambiando rol: ${error}`);
        }
    }

    /**
     * 🧹 Limpiar logs
     */
    clearLogs(): void {
        this.logs = [];
        this.testResults = {};
        this.log('🧹 Logs limpiados');
    }

    /**
     * 🧹 Limpiar resultados (AGREGADO - Método faltante en template)
     */
    clearResults(): void {
        this.testResults = {};
        this.log('🧹 Resultados de tests limpiados');
    }

    /**
     * 🎭 Obtener rol actual (AGREGADO - Método faltante en template)
     */
    getCurrentRole(): string {
        return this.selectedRole || 'No seleccionado';
    }

    /**
     * 📋 Obtener roles disponibles (AGREGADO - Método faltante en template)
     */
    getAvailableRoles(): string {
        return this.availableRoles.length > 0 ? this.availableRoles.join(', ') : 'No disponibles';
    }

    /**
     * 📝 Agregar log con timestamp
     */
    private log(message: string): void {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        this.logs.push(logMessage);
        console.log(`[RoleTestComponent] ${logMessage}`);
        
        // Mantener solo los últimos 50 logs
        if (this.logs.length > 50) {
            this.logs = this.logs.slice(-50);
        }
    }

    /**
     * 📊 Obtener información de debugging
     */
    getDebugInfo(): any {
        return {
            currentUser: this.currentUser,
            selectedRole: this.selectedRole,
            availableRoles: this.availableRoles,
            currentPermissions: this.currentPermissions,
            testResults: this.testResults,
            timestamp: new Date().toISOString()
        };
    }
}

/*
📝 CORRECCIONES REALIZADAS:

1. 🔧 CASTING SEGURO CORREGIDO:
   - Cambiado: hasPermissionObs as boolean
   - Por: (hasPermissionResult as unknown) as boolean
   - Evita errores de TypeScript con casting directo

2. 🔄 MANEJO DE OBSERVABLES MEJORADO:
   - Verificación de tipo más robusta
   - Casting seguro cuando es necesario
   - Manejo de errores en cada caso

3. 🛡️ COMPATIBILIDAD TOTAL:
   - Funciona con Observable<boolean> o boolean
   - Sin errores de compilación de TypeScript
   - Manejo gracioso de diferentes tipos de retorno
*/

