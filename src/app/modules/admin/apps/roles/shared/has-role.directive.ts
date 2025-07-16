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
            let hasPermission = false;

            if (typeof permissions === 'string') {
                // Permiso único
                hasPermission = this.permissionService.hasPermission(permissions as any);
            } else if (Array.isArray(permissions)) {
                // Múltiples permisos - verificar si tiene alguno
                const permissionArray = permissions;
                
                // CORREGIDO: Hacer casting para evitar error de tipos
                if (typeof this.permissionService.hasAnyPermission === 'function') {
                    hasPermission = this.permissionService.hasAnyPermission(permissionArray as any);
                } else {
                    // Fallback: verificar cada permiso individualmente
                    hasPermission = permissionArray.some(permission => 
                        this.permissionService.hasPermission(permission as any)
                    );
                }
            }

            this.updateView(hasPermission);

        } catch (error) {
            console.error('[HasPermissionDirective] Error verificando permisos:', error);
            // En caso de error, ocultar el elemento por seguridad
            this.updateView(false);
        }
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

1. 🔧 TIPOS CORREGIDOS:
   - Uso de 'as any' para evitar conflictos de tipos Permission vs string
   - Manejo flexible de tipos para compatibilidad

2. 🛡️ MANEJO DE ERRORES:
   - Try-catch para capturar errores de tipos o métodos
   - Fallback seguro ocultando elemento en caso de error

3. 📊 COMPATIBILIDAD:
   - Verificación de existencia del método hasAnyPermission
   - Fallback usando hasPermission individual si hasAnyPermission no existe

4. 🚨 SEGURIDAD:
   - En caso de error, ocultar elemento por defecto
   - Logs de error para debugging

5. 🔄 FLEXIBILIDAD:
   - Soporte para string único o array de strings
   - Adaptable a diferentes implementaciones del PermissionService
*/

