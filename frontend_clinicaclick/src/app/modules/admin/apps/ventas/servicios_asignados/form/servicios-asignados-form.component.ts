import { Component, Inject, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DatePipe, CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FuseAlertComponent } from '@fuse/components/alert/alert.component';
import { ServiciosAsignadosService } from '../servicios_asignados.service';
import { HistorialDeServiciosService } from '../../historial_de_servicios/historial_de_servicios.service';
import { HistorialDeServiciosProduct } from '../../historial_de_servicios/historial_de_servicios.types';
import { ServiciosAsignadosProduct } from '../servicios_asignados.types'; // Importar tipo correcto
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-servicios-asignados-form',
    templateUrl: './servicios-asignados-form.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatCheckboxModule,
        MatRadioModule,
        MatDialogModule,
        FuseAlertComponent,
        MatSnackBarModule
    ],
    providers: [DatePipe]
})
export class ServiciosAsignadosFormComponent implements OnInit {
    @Output() productCreated = new EventEmitter<HistorialDeServiciosProduct | ServiciosAsignadosProduct>();

    form: FormGroup;
    clinicas$ = this.serviciosAsignadosService.getClinicas();
    servicios$ = this.serviciosAsignadosService.getServicios();
    currentDate: Date = new Date();
    nextMonthFormatted: string;
    thisMonthFormatted: string;
    option1Date: Date;
    filteredDays: (d: Date | null) => boolean;
    public datePipe: DatePipe;

    constructor(
        private fb: FormBuilder,
        private serviciosAsignadosService: ServiciosAsignadosService,
        private historialDeServiciosService: HistorialDeServiciosService,
        public dialogRef: MatDialogRef<ServiciosAsignadosFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private cdr: ChangeDetectorRef,
        private snackBar: MatSnackBar,
        datePipe: DatePipe
    ) {
        this.datePipe = datePipe;
        this.form = this.fb.group({
            id_clinica: ['', Validators.required],
            id_servicio: ['', Validators.required],
            fecha_cobro: ['', Validators.required],
            fecha_cobro_opcion: [null],
            precio_especial: [false, Validators.required],
            precio_servicio: [0, Validators.required],
            descripcion_servicio: [''],
            descripcion_detallada_servicio: [''],
            servicio_recurrente: [true, Validators.required],
            iva_servicio: [21, Validators.required],
            empresa_servicio: ['La voz medios digitales SL', Validators.required],
            editar_datos_fiscales: [false],
            datos_fiscales_clinica: this.fb.group({
                denominacion_social: [''],
                cif_nif: [''],
                direccion_facturacion: ['']
            })
        });
    }

    ngOnInit(): void {
        this.filteredDays = (d: Date | null): boolean => {
            if (!d) {
                return false;
            }
            const date = new Date(d);
            const day = date.getDate();
            return day === 5;
        };

        this.option1Date = this.getOption1Date(this.currentDate);

        this.updateFormBasedOnDate(this.currentDate);

        this.nextMonthFormatted = this.datePipe.transform(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1), 'MMMM', 'es-ES');
        this.thisMonthFormatted = this.datePipe.transform(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1), 'MMMM', 'es-ES');

        this.form.get('id_clinica').valueChanges.subscribe(clinicaId => {
            if (clinicaId) {
                this.serviciosAsignadosService.getClinicaById(clinicaId).subscribe(clinica => {
                    if (clinica && clinica.datos_fiscales_clinica) {
                        this.form.patchValue({
                            datos_fiscales_clinica: clinica.datos_fiscales_clinica
                        });
                    } else {
                        this.form.patchValue({
                            datos_fiscales_clinica: {
                                denominacion_social: '',
                                cif_nif: '',
                                direccion_facturacion: ''
                            }
                        });
                    }
                    this.cdr.detectChanges();
                });
            } else {
                this.form.patchValue({
                    datos_fiscales_clinica: {
                        denominacion_social: '',
                        cif_nif: '',
                        direccion_facturacion: ''
                    }
                });
                this.cdr.detectChanges();
            }
        });

        this.form.get('id_servicio').valueChanges.subscribe(servicioId => {
            if (servicioId) {
                this.serviciosAsignadosService.getServicioById(servicioId).subscribe(servicio => {
                    if (servicio) {
                        const precioEspecial = this.form.get('precio_especial').value;
                        const precioServicio = precioEspecial ? servicio.precio_servicio * 0.5 : servicio.precio_servicio;
                        this.form.patchValue({
                            descripcion_servicio: servicio.descripcion_servicio,
                            precio_servicio: precioServicio,
                            iva_servicio: servicio.iva_servicio
                        });
                        this.cdr.detectChanges();
                    }
                });
            }
        });

        this.form.get('precio_especial').valueChanges.subscribe(precioEspecial => {
            const servicioId = this.form.get('id_servicio').value;
            if (servicioId) {
                this.serviciosAsignadosService.getServicioById(servicioId).subscribe(servicio => {
                    const precioServicio = precioEspecial ? servicio.precio_servicio * 0.5 : servicio.precio_servicio;
                    this.form.patchValue({
                        precio_servicio: precioServicio
                    });
                });
            }
        });

        this.form.get('fecha_cobro_opcion').valueChanges.subscribe(value => {
            if (value === this.option1Date) {
                this.form.patchValue({
                    fecha_cobro: this.option1Date
                });
            }
        });

        this.form.patchValue({
            fecha_cobro_opcion: this.option1Date,
            fecha_cobro: this.option1Date
        });
    }

    getOption1Date(currentDate: Date): Date {
        const day = currentDate.getDate();
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        if (day >= 1 && day <= 5) {
            return new Date(year, month, 5);
        } else if (day >= 6 && day <= 15) {
            return new Date(year, month + 1, 5);
        } else {
            return new Date(year, month + 1, 5);
        }
    }

    updateFormBasedOnDate(date: Date): void {
        const day = date.getDate();
        if (day >= 1 && day <= 5) {
            this.form.patchValue({ precio_especial: false });
        } else if (day >= 6 && day <= 15) {
            this.form.patchValue({ precio_especial: true });
        } else {
            this.form.patchValue({ precio_especial: false });
        }
    }

// En ServiciosAsignadosFormComponent
onSubmit(): void {
    if (this.form.valid) {
        const formValue = this.form.value;

        if (formValue.fecha_cobro_opcion === this.option1Date) {
            formValue.fecha_cobro = this.option1Date;
        }

        this.serviciosAsignadosService.getClinicaById(formValue.id_clinica).subscribe(clinica => {
            formValue.nombre_clinica = clinica.nombre_clinica;

            this.serviciosAsignadosService.getServicioById(formValue.id_servicio).subscribe(servicio => {
                formValue.nombre_servicio = servicio.nombre_servicio;

                const fechaCobro = new Date(formValue.fecha_cobro);
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();

                const monthName = this.datePipe.transform(fechaCobro, 'MMMM', 'es-ES');
                console.log("Verificando estado del mes:", monthName);

                this.serviciosAsignadosService.isMonthClosed(monthName).subscribe(isClosed => {
                    console.log("Estado del mes:", isClosed);
                    if (isClosed && (fechaCobro.getMonth() < currentMonth || fechaCobro.getFullYear() < currentYear)) {
                        console.log('Creando producto desde formulario (historial de servicios):', formValue);
                        const historialData: HistorialDeServiciosProduct = {
                            ...formValue,
                            incluir_en_factura: false
                        };
                        this.historialDeServiciosService.createProduct(historialData).subscribe((newProduct: HistorialDeServiciosProduct) => {
                            console.log('Producto creado en historial de servicios:', newProduct);
                            this.dialogRef.close(newProduct);
                            this.productCreated.emit(newProduct);
                            this.snackBar.open('Servicio histórico creado', 'Cerrar', {
                                duration: 3000,
                            });
                        });
                    } else {
                        console.log('Creando producto desde formulario (servicios asignados):', formValue);
                        const asignadosData: ServiciosAsignadosProduct = {
                            ...formValue,
                            estado_servicio: 'activo'
                        };
                        this.serviciosAsignadosService.createProduct(asignadosData).subscribe((newProduct: ServiciosAsignadosProduct) => {
                            console.log('Producto creado en servicios asignados:', newProduct);
                            this.dialogRef.close(newProduct);
                            this.productCreated.emit(newProduct);
                            this.snackBar.open('Producto asignado creado', 'Cerrar', {
                                duration: 3000,
                            });
                        });
                    }
                });
            });
        });
    }
}

    
    

    onCancel(): void {
        this.dialogRef.close();
    }
}
