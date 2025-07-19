import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { RoleService } from 'app/core/services/role.service';

/**
 * 🔑 Directiva para mostrar/ocultar elementos basado en permisos
 * 
 * ✅ SOLUCIÓN UNIFICADA: Usa RoleService en lugar de PermissionService
 * ✅ MÉTODO SÍNCRONO: No maneja Observables, usa hasPermission() directo
 * ✅ COMPATIBLE: Funciona igual que HasRoleDirective
 * 
 * Uso:
 * <div *hasPermission="'clinics.manage'">Solo con permiso clinics.manage</div>
 * <div *hasPermission="['clinics.manage', 'patients.view']">Con cualquiera de estos permisos</div>
 */
@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private hasView = false;

    @Input() set hasPermission(permissions: string | string[]) {
        this.checkPermissions(permissions);
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private roleService: RoleService  // ✅ CAMBIO: Usar RoleService en lugar de PermissionService
    ) {}

    ngOnInit(): void {
        // ✅ SUSCRIBIRSE A CAMBIOS DE ROL PARA ACTUALIZAR PERMISOS
        this.roleService.selectedRole$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            // Re-evaluar permisos cuando cambie el rol
            const currentPermissions = this.getCurrentPermissions();
            if (currentPermissions) {
                this.checkPermissions(currentPermissions);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private currentPermissions: string | string[] | null = null;

    private getCurrentPermissions(): string | string[] | null {
        return this.currentPermissions;
    }

    private checkPermissions(permissions: string | string[]): void {
        try {
            // ✅ GUARDAR PERMISOS ACTUALES PARA RE-EVALUACIÓN
            this.currentPermissions = permissions;

            if (typeof permissions === 'string') {
                // Permiso único
                this.checkSinglePermission(permissions);
            } else if (Array.isArray(permissions)) {
                // Múltiples permisos - verificar si tiene alguno
                this.checkMultiplePermissions(permissions);
            }
        } catch (error) {
            console.error('❌ [HasPermissionDirective] Error verificando permisos:', error);
            this.updateView(false);
        }
    }

    private checkSinglePermission(permission: string): void {
        // ✅ CAMBIO CRÍTICO: Usar método síncrono del RoleService
        const hasPermission = this.roleService.hasPermission(permission);
        console.log(`🔍 [HasPermissionDirective] ¿Tiene permiso '${permission}'? ${hasPermission}`);
        this.updateView(hasPermission);
    }

    private checkMultiplePermissions(permissions: string[]): void {
        // ✅ CAMBIO CRÍTICO: Usar método síncrono del RoleService
        const hasAnyPermission = this.roleService.hasAnyPermission(permissions);
        console.log(`🔍 [HasPermissionDirective] ¿Tiene algún permiso de [${permissions.join(', ')}]? ${hasAnyPermission}`);
        this.updateView(hasAnyPermission);
    }

    private updateView(show: boolean): void {
        if (show && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
            console.log('✅ [HasPermissionDirective] Contenido mostrado');
        } else if (!show && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
            console.log('❌ [HasPermissionDirective] Contenido ocultado');
        }
    }
}

/**
 * 📋 CAMBIOS REALIZADOS:
 * 
 * 1. ✅ IMPORT CAMBIADO:
 *    - Antes: import { PermissionService } from 'app/core/services/permission.service';
 *    - Ahora: import { RoleService } from 'app/core/services/role.service';
 * 
 * 2. ✅ CONSTRUCTOR CAMBIADO:
 *    - Antes: private permissionService: PermissionService
 *    - Ahora: private roleService: RoleService
 * 
 * 3. ✅ MÉTODOS SÍNCRONOS:
 *    - Antes: this.permissionService.hasPermission(permission) → Observable<boolean>
 *    - Ahora: this.roleService.hasPermission(permission) → boolean
 * 
 * 4. ✅ REACTIVIDAD AGREGADA:
 *    - Se suscribe a cambios de rol para re-evaluar permisos automáticamente
 *    - Cuando el usuario cambie de rol, los permisos se actualizan
 * 
 * 5. ✅ LOGS MEJORADOS:
 *    - Logs más detallados para debugging
 *    - Indica cuándo se muestra/oculta contenido
 * 
 * 6. ✅ MANEJO DE ERRORES:
 *    - Try-catch para evitar errores que rompan la directiva
 *    - Fallback a ocultar contenido en caso de error
 * 
 * 📊 RESULTADO:
 * - ✅ Compatible con el sistema de roles existente
 * - ✅ No requiere manejar Observables en la directiva
 * - ✅ Usa la misma lógica que HasRoleDirective
 * - ✅ Se actualiza automáticamente cuando cambia el rol
 * - ✅ Logs de debug para facilitar troubleshooting
 */

