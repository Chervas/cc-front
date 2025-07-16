import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { RoleService } from 'app/core/services/role.service';
import { UserRole } from 'app/core/constants/role.constants';

/**
 * 🎭 Directiva para mostrar/ocultar elementos basado en roles
 * 
 * Uso:
 * <div *hasRole="'admin'">Solo para administradores</div>
 * <div *hasRole="['admin', 'propietario']">Para admin o propietario</div>
 */
@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private hasView = false;

    @Input() set hasRole(roles: UserRole | UserRole[]) {
        this.checkRoles(roles);
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private roleService: RoleService
    ) {}

    ngOnInit(): void {
        // Suscribirse a cambios en roles si el servicio lo soporta
        // (opcional, depende de la implementación del servicio)
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkRoles(roles: UserRole | UserRole[]): void {
        try {
            let hasRole = false;

            if (typeof roles === 'string') {
                // Rol único
                const result = this.roleService.hasRole(roles);
                if (result && typeof result.subscribe === 'function') {
                    // Es Observable<boolean>
                    result.pipe(takeUntil(this.destroy$)).subscribe(value => {
                        this.updateView((value as unknown) as boolean);
                    });
                    return;
                } else {
                    // Es boolean directo
                    hasRole = (result as unknown) as boolean;
                }
            } else if (Array.isArray(roles)) {
                // Múltiples roles - verificar si tiene alguno
                hasRole = roles.some(role => {
                    const result = this.roleService.hasRole(role);
                    if (result && typeof result.subscribe === 'function') {
                        // Si es Observable, necesitamos manejar asincrónicamente
                        result.pipe(takeUntil(this.destroy$)).subscribe(value => {
                            if ((value as unknown) as boolean) {
                                this.updateView(true);
                            }
                        });
                        return false; // Por ahora false, se actualizará asincrónicamente
                    } else {
                        return (result as unknown) as boolean;
                    }
                });
            }

            this.updateView(hasRole);
        } catch (error) {
            console.error('[HasRoleDirective] Error checking roles:', error);
            this.updateView(false);
        }
    }

    private updateView(show: boolean): void {
        if (show && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!show && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }
}

