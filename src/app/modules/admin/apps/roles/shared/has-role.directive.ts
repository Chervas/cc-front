import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { RoleService, UserRole } from '../../../../../core/services/role.service';

/**
 * 🎯 Directiva *hasRole para mostrar/ocultar elementos basado en roles
 * 
 * Uso:
 * <div *hasRole="'admin'">Solo admins</div>
 * <div *hasRole="['admin', 'propietario']">Admins o propietarios</div>
 */
@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
    private _destroy$ = new Subject<void>();
    private _roleService = inject(RoleService);
    private _templateRef = inject(TemplateRef<any>);
    private _viewContainer = inject(ViewContainerRef);

    @Input() hasRole: UserRole | UserRole[] | string | string[] = [];

    ngOnInit(): void {
        // Suscribirse a cambios en el usuario actual
        this._roleService.currentUser$.pipe(
            takeUntil(this._destroy$)
        ).subscribe(() => {
            this.updateView();
        });

        // Suscribirse a cambios en roles disponibles
        this._roleService.availableRoles$.pipe(
            takeUntil(this._destroy$)
        ).subscribe(() => {
            this.updateView();
        });

        // Verificación inicial
        this.updateView();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    private updateView(): void {
        try {
            const shouldShow = this.checkRoleAccess();
            
            if (shouldShow) {
                if (this._viewContainer.length === 0) {
                    this._viewContainer.createEmbeddedView(this._templateRef);
                }
            } else {
                this._viewContainer.clear();
            }
        } catch (error) {
            console.error('🚨 Error en HasRoleDirective:', error);
            // En caso de error, ocultar el elemento por seguridad
            this._viewContainer.clear();
        }
    }

    private checkRoleAccess(): boolean {
        try {
            // Validar entrada
            if (!this.hasRole) {
                console.warn('🚨 HasRoleDirective: hasRole está vacío');
                return false;
            }

            // Obtener rol actual de forma segura
            const currentRole = this._roleService.getCurrentRole();
            if (!currentRole) {
                console.warn('🚨 HasRoleDirective: No hay rol actual');
                return false;
            }

            // Normalizar roles requeridos
            const requiredRoles = this.normalizeRoles(this.hasRole);
            if (requiredRoles.length === 0) {
                console.warn('🚨 HasRoleDirective: No hay roles requeridos válidos');
                return false;
            }

            // Verificar si el rol actual está en los roles requeridos
            const hasAccess = requiredRoles.some(role => {
                const normalizedRole = this.normalizeRole(role);
                const normalizedCurrentRole = this.normalizeRole(currentRole);
                return normalizedRole === normalizedCurrentRole;
            });

            console.log(`🎯 HasRoleDirective: Rol actual: ${currentRole}, Requeridos: [${requiredRoles.join(', ')}], Acceso: ${hasAccess}`);
            return hasAccess;

        } catch (error) {
            console.error('🚨 Error verificando acceso de rol:', error);
            return false;
        }
    }

    private normalizeRoles(roles: UserRole | UserRole[] | string | string[]): string[] {
        try {
            if (!roles) return [];

            if (Array.isArray(roles)) {
                return roles
                    .filter(role => role != null && role !== '')
                    .map(role => this.normalizeRole(role))
                    .filter(role => role !== '');
            }

            const normalizedRole = this.normalizeRole(roles);
            return normalizedRole ? [normalizedRole] : [];
        } catch (error) {
            console.error('🚨 Error normalizando roles:', error);
            return [];
        }
    }

    private normalizeRole(role: UserRole | string): string {
        try {
            if (!role || role === null || role === undefined) {
                return '';
            }

            // Convertir a string de forma segura
            const roleStr = String(role).trim();
            if (roleStr === '' || roleStr === 'null' || roleStr === 'undefined') {
                return '';
            }

            return roleStr.toLowerCase();
        } catch (error) {
            console.error('🚨 Error normalizando rol individual:', error);
            return '';
        }
    }
}

