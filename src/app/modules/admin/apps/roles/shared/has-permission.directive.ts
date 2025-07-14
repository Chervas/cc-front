import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionService } from '../../../../../core/services/permission.service';

/**
 * 🔐 HAS PERMISSION DIRECTIVE
 * Directiva estructural para mostrar/ocultar elementos basado en permisos
 * 
 * Uso:
 * <button *hasPermission="'clinics.manage'">Gestionar Clínicas</button>
 * <div *hasPermission="['patients.view', 'patients.manage']">Ver o gestionar pacientes</div>
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
        private permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        // La verificación se hace en el setter hasPermission
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkPermissions(permissions: string | string[]): void {
        if (!permissions) {
            this.updateView(false);
            return;
        }

        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
        
        this.permissionService.hasAnyPermission(permissionArray)
            .pipe(takeUntil(this.destroy$))
            .subscribe(hasPermission => {
                this.updateView(hasPermission);
            });
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

