import { NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector     : 'auth-reset-password',
    templateUrl  : './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [NgIf, FuseAlertComponent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
})
export class AuthResetPasswordComponent implements OnInit
{
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    resetPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    // Para mostrar temporalmente el nuevo password
    newPasswordTemp: string = '';

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void
    {
        // Crear el formulario incluyendo email, password y passwordConfirm
        this.resetPasswordForm = this._formBuilder.group({
                email          : ['', [Validators.required, Validators.email]],
                password       : ['', Validators.required],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: FuseValidators.mustMatch('password', 'passwordConfirm'),
            },
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    resetPassword(): void
    {
        if ( this.resetPasswordForm.invalid )
        {
            return;
        }

        this.resetPasswordForm.disable();
        this.showAlert = false;

        const formData = this.resetPasswordForm.getRawValue();
        console.log('Datos del formulario:', formData);

        // Llamar al servicio de resetPassword enviando email y nueva contraseña
        this._authService.resetPassword(formData.email, formData.password)
            .pipe(
                finalize(() =>
                {
                    this.resetPasswordForm.enable();
                    this.resetPasswordNgForm.resetForm();
                    this.showAlert = true;
                }),
            )
            .subscribe(
                (response: any) =>
                {
                    // Mostrar el nuevo password temporalmente en pantalla
                    this.newPasswordTemp = response.newPassword;
                    this.alert = {
                        type   : 'success',
                        message: `Password reset successful. New password: ${response.newPassword}`,
                    };
                },
                (error) =>
                {
                    this.alert = {
                        type   : 'error',
                        message: 'Something went wrong, please try again.',
                    };
                },
            );
    }
}
