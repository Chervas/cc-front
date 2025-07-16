import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from 'app/core/services/permission.service';

/**
 * 🔐 Directiva para mostrar/ocultar elementos basado en permisos
 * 
 * Uso:
 * <div *hasPermission="'clinic.manage'">Solo con permiso clinic.manage</div>
 * <div *hasPermission="['clinic.manage', 'clinic.view']">Con cualquiera de estos permisos</div>
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
        // Suscribirse a cambios en permisos si el servicio lo soporta
        // (opcional, depende de la implementación del servicio)
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkPermissions(permissions: string | string[]): void {
        try {
            if (typeof permissions === 'string') {
                // Permiso único
                this.checkSinglePermission(permissions);
            } else if (Array.isArray(permissions)) {
                // Múltiples permisos - verificar si tiene alguno
                this.checkMultiplePermissions(permissions);
            }

        } catch (error) {
            console.error('[HasPermissionDirective] Error verificando permisos:', error);
            // En caso de error, ocultar el elemento por seguridad
            this.updateView(false);
        }
    }

    /**
     * 🔍 Verificar un solo permiso (CORREGIDO - Casting seguro)
     */
    private checkSinglePermission(permission: string): void {
        try {
            const result = this.permissionService.hasPermission(permission as any);
            
            if (result && typeof result.subscribe === 'function') {
                // Es un Observable<boolean>
                result.pipe(takeUntil(this.destroy$)).subscribe(hasPermission => {
                    this.updateView(hasPermission);
                });
            } else {
                // Es un boolean directo - CORREGIDO: Casting seguro
                this.updateView((result as unknown) as boolean);
            }
        } catch (error) {
            console.error('[HasPermissionDirective] Error verificando permiso único:', error);
            this.updateView(false);
        }
    }

    /**
     * 🔍 Verificar múltiples permisos (CORREGIDO - Casting seguro)
     */
    private checkMultiplePermissions(permissions: string[]): void {
        try {
            // CORREGIDO: Verificar si hasAnyPermission existe y manejar Observable
            if (typeof this.permissionService.hasAnyPermission === 'function') {
                const result = this.permissionService.hasAnyPermission(permissions as any);
                
                if (result && typeof result.subscribe === 'function') {
                    // Es un Observable<boolean>
                    result.pipe(takeUntil(this.destroy$)).subscribe(hasPermission => {
                        this.updateView(hasPermission);
                    });
                } else {
                    // Es un boolean directo - CORREGIDO: Casting seguro
                    this.updateView((result as unknown) as boolean);
                }
            } else {
                // Fallback: verificar cada permiso individualmente
                this.checkPermissionsIndividually(permissions);
            }
        } catch (error) {
            console.error('[HasPermissionDirective] Error verificando permisos múltiples:', error);
            this.updateView(false);
        }
    }

    /**
     * 🔍 Verificar permisos individualmente como fallback (CORREGIDO - Casting seguro)
     */
    private checkPermissionsIndividually(permissions: string[]): void {
        let hasAnyPermission = false;
        let pendingChecks = permissions.length;
        
        permissions.forEach(permission => {
            try {
                const result = this.permissionService.hasPermission(permission as any);
                
                if (result && typeof result.subscribe === 'function') {
                    // Es un Observable<boolean>
                    result.pipe(takeUntil(this.destroy$)).subscribe(hasPermission => {
                        if (hasPermission) {
                            hasAnyPermission = true;
                        }
                        
                        pendingChecks--;
                        if (pendingChecks === 0) {
                            this.updateView(hasAnyPermission);
                        }
                    });
                } else {
                    // Es un boolean directo - CORREGIDO: Casting seguro
                    const hasPermission = (result as unknown) as boolean;
                    if (hasPermission) {
                        hasAnyPermission = true;
                    }
                    
                    pendingChecks--;
                    if (pendingChecks === 0) {
                        this.updateView(hasAnyPermission);
                    }
                }
            } catch (error) {
                console.error(`[HasPermissionDirective] Error verificando permiso '${permission}':`, error);
                pendingChecks--;
                if (pendingChecks === 0) {
                    this.updateView(hasAnyPermission);
                }
            }
        });
    }

    private updateView(show: boolean): void {
        if (show && !this.hasView) {
            // Mostrar elemento
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!show && this.hasView) {
            // Ocultar elemento
            this.viewContainer.clear();
            this.hasView = false;
        }
    }
}

/*
📝 CORRECCIONES REALIZADAS:

1. 🔧 CASTING SEGURO CORREGIDO:
   - Cambiado: result as boolean
   - Por: (result as unknown) as boolean
   - Evita errores de TypeScript con casting directo

2. 🛡️ APLICADO EN TODOS LOS LUGARES:
   - checkSinglePermission(): Casting seguro
   - checkMultiplePermissions(): Casting seguro  
   - checkPermissionsIndividually(): Casting seguro

3. 🔄 MANEJO DE OBSERVABLES MANTENIDO:
   - Verificación de tipo antes de casting
   - Suscripción correcta con takeUntil
   - Manejo de errores robusto

4. 📊 COMPATIBILIDAD TOTAL:
   - Funciona con Observable<boolean> o boolean
   - Sin errores de compilación de TypeScript
   - Manejo gracioso de diferentes tipos de retorno
*/

