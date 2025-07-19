import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoleService } from 'app/core/services/role.service';
import { UserRole } from 'app/core/constants/role.constants';

/**
 * ✅ DIRECTIVA *hasRole CORREGIDA COMPLETA
 * Muestra/oculta elementos basado en el rol del usuario
 * 
 * Ejemplos de uso:
 * <div *hasRole="'administrador'">Solo para administradores</div>
 * <div *hasRole="['administrador', 'propietario']">Para admin o propietario</div>
 */
@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private hasView = false;
    private currentRole: UserRole | null = null;

    @Input() set hasRole(role: UserRole) {
        this.currentRole = role;
        this.checkRole(role);
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private roleService: RoleService
    ) {}

    ngOnInit(): void {
        // Suscribirse a cambios en el rol seleccionado
        this.roleService.selectedRole$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            // Re-evaluar cuando cambie el rol
            if (this.currentRole) {
                this.checkRole(this.currentRole);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkRole(role: UserRole): void {
        if (!role) {
            this.hideElement();
            return;
        }

        try {
            let hasRole = false;

            if (typeof role === 'string') {
                // Rol único
                const result = this.roleService.hasRole(role);
                
                // ✅ VERIFICAR SI ES OBSERVABLE O BOOLEAN
                if (result && typeof (result as any).subscribe === 'function') {
                    // Es Observable<boolean>
                    (result as any).pipe(takeUntil(this.destroy$)).subscribe((value: boolean) => {
                        this.updateView(value);
                    });
                    return;
                } else {
                    // Es boolean directo
                    hasRole = Boolean(result);
                }
            } else if (Array.isArray(role)) {
                // Múltiples roles - verificar si tiene alguno
                hasRole = role.some(r => {
                    const result = this.roleService.hasRole(r);
                    
                    if (result && typeof (result as any).subscribe === 'function') {
                        // Si es Observable, manejar asincrónicamente
                        (result as any).pipe(takeUntil(this.destroy$)).subscribe((value: boolean) => {
                            if (value) {
                                this.showElement();
                            }
                        });
                        return false; // Por ahora false, se actualizará asincrónicamente
                    } else {
                        return Boolean(result);
                    }
                });
            }

            this.updateView(hasRole);
            
        } catch (error) {
            console.error('HasRoleDirective: Error verificando rol:', error);
            this.hideElement();
        }
    }

    private updateView(hasRole: boolean): void {
        if (hasRole && !this.hasView) {
            this.showElement();
        } else if (!hasRole && this.hasView) {
            this.hideElement();
        }
    }

    private showElement(): void {
        if (!this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        }
    }

    private hideElement(): void {
        if (this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }
}

