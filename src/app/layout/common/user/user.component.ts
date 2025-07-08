/**
 * ⚠️ NO BORRAR NUNCA ESTE COMENTARIO ⚠️
 * 
 * 👤 SISTEMA DE USUARIOS: FUSE vs NUESTRO MODELO
 * 
 * Este componente (user.component.ts) utiliza el USUARIO DE FUSE para mostrar
 * información en la interfaz (header, layouts, UI/UX del template).
 * 
 * 🎨 USUARIO DE FUSE (Este componente):
 * - Ubicación: src/app/layout/common/user/user.component.ts
 * - Propósito: UI/UX - Mostrar nombre, email, avatar en header
 * - Campos: user.id (string), user.email, user.name, user.avatar, user.status
 * - Uso: Solo para elementos visuales del template
 * 
 * 🏥 NUESTRO USUARIO (Lógica de negocio):
 * - Ubicación: src/app/core/user/user.service.ts + models/usuario.js (backend)
 * - Propósito: Autenticación, OAuth2, permisos, clínicas
 * - Campos: user.id_usuario (number), user.email_usuario, user.nombre, user.apellidos
 * - Uso: Login, OAuth2, base de datos, lógica de negocio
 * 
 * 🚨 REGLAS CRÍTICAS:
 * 1. Este componente puede usar user.name, user.email para mostrar en UI
 * 2. NUNCA usar user.id para lógica de negocio (es string, no el ID real)
 * 3. Para OAuth2 o backend, usar user.id_usuario desde UserService.getUserIdForOAuth()
 * 4. Los campos de compatibilidad se mapean automáticamente en UserService
 * 
 * 🔧 OAUTH2 META:
 * - Este componente NO maneja OAuth2
 * - OAuth2 está en: src/app/modules/admin/pages/settings/connected-accounts/
 * - OAuth2 usa user.id_usuario (number) del UserService, NO user.id (string) de Fuse
 * 
 * 📍 UBICACIONES:
 * - Usuario Fuse (UI): src/app/layout/common/user/ (este directorio)
 * - Usuario Real (Backend): src/app/core/user/user.service.ts
 * - OAuth2: src/app/modules/admin/pages/settings/connected-accounts/
 * 
 * ✅ FUNCIONAMIENTO ACTUAL:
 * - UserService mapea automáticamente entre ambos modelos
 * - Este componente recibe user.name, user.email mapeados desde nuestro modelo
 * - OAuth2 usa getUserIdForOAuth() que devuelve user.id_usuario real
 * 
 * ⚠️ NO MODIFICAR sin entender la diferencia entre ambos sistemas de usuario
 */



import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector       : 'user',
    templateUrl    : './user.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'user',
    standalone     : true,
    imports        : [MatButtonModule, MatMenuModule, NgIf, MatIconModule, NgClass, MatDividerModule],
})
export class UserComponent implements OnInit, OnDestroy
{
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    user: User;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) =>
            {
                this.user = user;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the user status
     *
     * @param status
     */
    updateUserStatus(status: string): void
    {
        // Return if user is not available
        if ( !this.user )
        {
            return;
        }

        // Update the user
        this._userService.update({
            ...this.user,
            status,
        }).subscribe();
    }

    /**
     * Sign out
     */
    signOut(): void
    {
        this._router.navigate(['/sign-out']);
    }
}
