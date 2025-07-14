import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../services/permission.service';

/**
 * 🎯 HAS ROLE DIRECTIVE - CONTROL DECLARATIVO DE ELEMENTOS UI
 * 
 * Ubicación: src/app/modules/admin/apps/roles/shared/has-role.directive.ts
 * 
 * Directiva estructural que muestra/oculta elementos basándose en roles del usuario.
 * Sigue la estructura de Fuse colocando shared components dentro del módulo específico.
 */

@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
    
    @Input() hasRole: string | string[] = [];
    @Input() hasRoleOperator: 'AND' | 'OR' = 'OR';
    @Input() hasRoleElse?: TemplateRef<any>;

    private destroy$ = new Subject<void>();
    private hasView = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        this.updateView();
        
        // Suscribirse a cambios en los roles
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
                if (this.hasRoleElse) {
                    this.viewContainer.createEmbeddedView(this.hasRoleElse);
                }
            }
        });
    }

    private async checkPermission(): Promise<boolean> {
        if (!this.hasRole || (Array.isArray(this.hasRole) && this.hasRole.length === 0)) {
            return true;
        }

        const roles = Array.isArray(this.hasRole) ? this.hasRole : [this.hasRole];

        if (this.hasRoleOperator === 'AND') {
            return this.permissionService.hasAllRoles(roles).toPromise() || false;
        } else {
            return this.permissionService.hasAnyRole(roles).toPromise() || false;
        }
    }
}

/**
 * 🎯 EJEMPLOS DE USO:
 * 
 * <!-- Mostrar solo para administradores -->
 * <div *hasRole="'admin'">
 *   Contenido solo para administradores
 * </div>
 * 
 * <!-- Mostrar para propietarios o administradores -->
 * <div *hasRole="['propietario', 'admin']">
 *   Contenido para propietarios y administradores
 * </div>
 * 
 * <!-- Mostrar solo si tiene TODOS los roles (AND) -->
 * <div *hasRole="['doctor', 'propietario']; operator: 'AND'">
 *   Contenido para doctores que también son propietarios
 * </div>
 * 
 * <!-- Con template alternativo -->
 * <div *hasRole="'admin'; else: noAccess">
 *   Contenido para administradores
 * </div>
 * <ng-template #noAccess>
 *   <div>No tienes permisos para ver este contenido</div>
 * </ng-template>
 */

