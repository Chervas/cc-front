import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../services/permission.service';

/**
 * 🔐 HAS PERMISSION DIRECTIVE - CONTROL GRANULAR DE PERMISOS
 * 
 * Ubicación: src/app/modules/admin/apps/roles/shared/has-permission.directive.ts
 * 
 * Directiva estructural que muestra/oculta elementos basándose en permisos específicos.
 * Complementa a HasRoleDirective para control más granular.
 */

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    
    @Input() hasPermission: string | string[] = [];
    @Input() hasPermissionOperator: 'AND' | 'OR' = 'AND';
    @Input() hasPermissionElse?: TemplateRef<any>;

    private destroy$ = new Subject<void>();
    private hasView = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.updateView();
        
        // Suscribirse a cambios en los roles (que afectan permisos)
        this.permissionService.currentRole$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.updateView();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private updateView(): void {
        this.checkPermission().then(hasPermission => {
            if (hasPermission && !this.hasView) {
                this.viewContainer.createEmbeddedView(this.templateRef);
                this.hasView = true;
            } else if (!hasPermission && this.hasView) {
                this.viewContainer.clear();
                this.hasView = false;
                
                // Mostrar template alternativo si existe
                if (this.hasPermissionElse) {
                    this.viewContainer.createEmbeddedView(this.hasPermissionElse);
                }
            }
        });
    }

    private async checkPermission(): Promise<boolean> {
        if (!this.hasPermission || (Array.isArray(this.hasPermission) && this.hasPermission.length === 0)) {
            return true;
        }

        const permissions = Array.isArray(this.hasPermission) ? this.hasPermission : [this.hasPermission];

        if (this.hasPermissionOperator === 'OR') {
            return this.permissionService.hasAnyPermission(permissions).toPromise() || false;
        } else {
            return this.permissionService.hasAllPermissions(permissions).toPromise() || false;
        }
    }
}

/**
 * 🎯 EJEMPLOS DE USO:
 * 
 * <!-- Mostrar solo si puede gestionar clínicas -->
 * <button *hasPermission="'clinics.manage'">
 *   Gestionar Clínicas
 * </button>
 * 
 * <!-- Mostrar si tiene cualquiera de los permisos (OR) -->
 * <div *hasPermission="['patients.view', 'patients.manage']; operator: 'OR'">
 *   Sección de pacientes
 * </div>
 * 
 * <!-- Mostrar solo si tiene TODOS los permisos (AND) -->
 * <div *hasPermission="['reports.view', 'reports.export']; operator: 'AND'">
 *   Exportar reportes
 * </div>
 * 
 * <!-- Con template alternativo -->
 * <div *hasPermission="'admin.access'; else: noAdminAccess">
 *   Panel de administración
 * </div>
 * <ng-template #noAdminAccess>
 *   <div class="text-red-500">Acceso restringido</div>
 * </ng-template>
 * 
 * <!-- Combinando con hasRole -->
 * <div *hasRole="'doctor'" class="doctor-panel">
 *   <button *hasPermission="'prescriptions.create'">
 *     Crear Receta
 *   </button>
 *   <button *hasPermission="'patients.edit'">
 *     Editar Paciente
 *   </button>
 * </div>
 */

