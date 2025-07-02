import { AsyncPipe, CurrencyPipe, NgClass, NgForOf, NgIf, NgTemplateOutlet, DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ServiciosAsignadosService } from '../servicios_asignados.service';
import { ServiciosAsignadosPagination, ServiciosAsignadosProduct } from '../servicios_asignados.types';
import { debounceTime, map, merge, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ServiciosAsignadosFormComponent } from '../form/servicios-asignados-form.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FuseAlertComponent } from '@fuse/components/alert';

@Component({
    selector: 'servicios-asignados-list',
    templateUrl: './servicios_asignados.component.html',
    styles: [
        /* language=SCSS */
        `
            .servicios-grid {
                grid-template-columns: 40px 80px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 20px;

                @screen sm {
                    grid-template-columns: 40px 1fr 2fr 3fr 4fr 1fr 1fr 1fr 1fr 20px;
                }
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        NgIf, MatProgressBarModule, MatFormFieldModule, MatIconModule, MatInputModule,
        FormsModule, ReactiveFormsModule, MatButtonModule, MatSortModule, NgForOf,
        NgTemplateOutlet, MatPaginator, NgClass, MatSelectModule, MatOptionModule,
        MatRippleModule, AsyncPipe, CurrencyPipe, MatSnackBarModule, MatDatepickerModule,
        MatSlideToggleModule, DatePipe, MatButtonToggleModule, MatDialogModule, FuseAlertComponent
    ],
})
export class ServiciosAsignadosListComponent implements OnInit, AfterViewInit, OnDestroy {

    products$: Observable<ServiciosAsignadosProduct[]>;
    clinicas$: Observable<any[]>;
    servicios$: Observable<any[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedProduct: ServiciosAsignadosProduct | null = null;
    selectedProductForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    isMonthClosed: boolean = false; // Para manejar el estado del mes cerrado
    showWarning: boolean = false; // Para manejar la visualización del warning
    currentMonthName: string; // Nombre del mes actual
    previousMonthName: string; // Nombre del mes anterior
    nextMonthValue: string; // Valor del próximo mes
    nextMonthLabel: string; // Etiqueta del próximo mes
    selectedMonth: number;
    selectedYear: number;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _serviciosAsignadosService: ServiciosAsignadosService,
        private _snackBar: MatSnackBar,
        private _dialog: MatDialog
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        console.log('Componente inicializado');
    
        // Crear el formulario seleccionado del producto
        this.selectedProductForm = this._formBuilder.group({
            id_servicio_asignado: [''],
            id_clinica: ['', [Validators.required]],
            nombre_clinica: ['', [Validators.required]],
            id_servicio: ['', [Validators.required]],
            nombre_servicio: ['', [Validators.required]],
            descripcion_servicio: [''],
            descripcion_detallada_servicio: [''],
            precio_servicio: [0, [Validators.required]],
            iva_servicio: [21, [Validators.required]],
            servicio_recurrente: [false, [Validators.required]],
            fecha_cobro: [null],
            precio_especial: [false, [Validators.required]],
            empresa_servicio: ['La voz medios digitales SL', [Validators.required]],
            estado_servicio: ['activo', [Validators.required]],
            fecha_pausa: [null],
            datos_fiscales_clinica: this._formBuilder.group({
                denominacion_social: [''],
                cif_nif: [''],
                direccion_facturacion: ['']
            })
        });
    
        console.log('Formulario inicializado:', this.selectedProductForm.value);
    
        this.resetForm();
    
        // Inicializar los meses
        this.initMonths();
    
        // Verificar si el mes anterior está cerrado
        this.checkPreviousMonthClosed();
    
        // Establecer el filtro inicial
        this.onFilterChange('this-month');
    
        // Obtener los productos
        this.products$ = this._serviciosAsignadosService.products$;
    
        // Obtener las clínicas y servicios
        this.clinicas$ = this._serviciosAsignadosService.getClinicas();
        this.servicios$ = this._serviciosAsignadosService.getServicios();
    
        // Suscribirse a los cambios en el campo de selección de clínica
        this.selectedProductForm.get('id_clinica').valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(clinicaId => this._serviciosAsignadosService.getClinicaById(clinicaId))
            )
            .subscribe(clinica => {
                const datosFiscales = clinica.datos_fiscales_clinica || {};
                const currentDatosFiscales = this.selectedProductForm.get('datos_fiscales_clinica').value;
    
                this.selectedProductForm.patchValue({
                    nombre_clinica: clinica.nombre_clinica,
                    datos_fiscales_clinica: {
                        denominacion_social: currentDatosFiscales.denominacion_social || datosFiscales.denominacion_social || '',
                        cif_nif: currentDatosFiscales.cif_nif || datosFiscales.cif_nif || '',
                        direccion_facturacion: currentDatosFiscales.direccion_facturacion || datosFiscales.direccion_facturacion || ''
                    }
                });
                console.log('Valores del formulario después de parchear con clínica:', this.selectedProductForm.value);
            });
    
        // Suscribirse a los cambios en el campo de selección de servicio
        this.selectedProductForm.get('id_servicio').valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(servicioId => this._serviciosAsignadosService.getServicioById(servicioId))
            )
            .subscribe(servicio => {
                const precioEspecial = this.selectedProductForm.get('precio_especial').value;
                const precioServicio = precioEspecial ? servicio.precio_servicio * 0.5 : servicio.precio_servicio;
    
                // Verificar y actualizar campos solo si están vacíos o nulos
                const currentDescripcionServicio = this.selectedProductForm.get('descripcion_servicio').value;
                const descripcion_servicio = currentDescripcionServicio ? currentDescripcionServicio : servicio.descripcion_servicio;
    
                const currentPrecioServicio = this.selectedProductForm.get('precio_servicio').value;
                const precio_servicio = currentPrecioServicio ? currentPrecioServicio : precioServicio;
    
                const currentIvaServicio = this.selectedProductForm.get('iva_servicio').value;
                const iva_servicio = currentIvaServicio ? currentIvaServicio : servicio.iva_servicio;
    
                this.selectedProductForm.patchValue({
                    nombre_servicio: servicio.nombre_servicio,
                    descripcion_servicio: descripcion_servicio,
                    precio_servicio: precio_servicio,
                    iva_servicio: iva_servicio
                });
    
                console.log('Valores del formulario después de parchear con servicio:', this.selectedProductForm.value);
            });
    
        // Suscribirse a los cambios en el campo de selección de precio especial
        this.selectedProductForm.get('precio_especial').valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(precioEspecial => {
                const servicioId = this.selectedProductForm.get('id_servicio').value;
                this._serviciosAsignadosService.getServicioById(servicioId)
                    .subscribe(servicio => {
                        const precioServicio = precioEspecial ? servicio.precio_servicio * 0.5 : servicio.precio_servicio;
                        this.selectedProductForm.patchValue({
                            precio_servicio: precioServicio
                        });
                        console.log('Precio servicio actualizado:', precioServicio);
                    });
            });
    
        // Suscribirse a los cambios en el campo de entrada de búsqueda
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._serviciosAsignadosService.getProducts(0, 50, 'id_servicio_asignado', 'desc', query);
                }),
                map(() => {
                    this.isLoading = false;
                }),
            )
            .subscribe();
    }

    /**
     * manejo de cierres del mes
     */
    initMonths(): void {
        const currentDate = new Date();
        const previousMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);

        this.currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
        this.previousMonthName = previousMonthDate.toLocaleString('default', { month: 'long' });
        this.nextMonthLabel = nextMonthDate.toLocaleString('default', { month: 'long' }) + ' ' + nextMonthDate.getFullYear();
        this.nextMonthValue = 'next-month';

        // Inicializar valores seleccionados
        this.selectedMonth = currentDate.getMonth();
        this.selectedYear = currentDate.getFullYear();
    }

    // Añadir el método para manejar el cambio de pestaña
    onFilterChange(filter: string): void {
        const currentDate = new Date();
        switch (filter) {
            case 'last-month':
                this.selectedMonth = currentDate.getMonth() - 1;
                this.selectedYear = currentDate.getFullYear();
                if (this.selectedMonth < 0) {
                    this.selectedMonth = 11;
                    this.selectedYear -= 1;
                }
                break;
            case 'this-month':
                this.selectedMonth = currentDate.getMonth();
                this.selectedYear = currentDate.getFullYear();
                break;
            case 'next-month':
                this.selectedMonth = currentDate.getMonth() + 1;
                this.selectedYear = currentDate.getFullYear();
                if (this.selectedMonth > 11) {
                    this.selectedMonth = 0;
                    this.selectedYear += 1;
                }
                break;
        }
    
        // Llama a loadProducts con el filtro seleccionado
        this.loadProducts(filter);
    
        // Verifica si el mes seleccionado está cerrado
        this.checkCurrentMonthClosed();
    }
    
    

    checkCurrentMonthClosed(): void {
        const monthName = new Date(this.selectedYear, this.selectedMonth, 1).toLocaleString('es-ES', { month: 'long' }).toLowerCase();
        console.log("Checking if current month is closed for:", monthName);
        this._serviciosAsignadosService.isMonthClosed(monthName).subscribe(isClosed => {
            this.isMonthClosed = isClosed;
            this._changeDetectorRef.markForCheck();
        }, error => {
            console.error('ERROR in checkCurrentMonthClosed:', error);
        });
    }
    
    
    

    closeMonth(): void {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Verifica si estamos cerrando el mes actual, el mes siguiente o el mes pasado
        if (
            (this.selectedMonth === currentMonth && this.selectedYear === currentYear) ||
            (this.selectedMonth === currentMonth + 1 && this.selectedYear === currentYear) ||
            (this.selectedMonth === previousMonth && this.selectedYear === previousYear)
        ) {
            this.showConfirmationPopup();
        } else {
            this.performCloseMonth();
        }
    }

    showConfirmationPopup(): void {
        const monthNameToClose = new Date(this.selectedYear, this.selectedMonth, 1).toLocaleString('default', { month: 'long' });
        const currentMonth = new Date().getMonth();
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
    
        console.log("Fetching summary for month:", this.selectedMonth, "and year:", this.selectedYear);
    
        // Obtener el total en euros y el número de clínicas para el mes a cerrar
        this._serviciosAsignadosService.getMonthSummary(this.selectedMonth, this.selectedYear).subscribe(summary => {
            console.log("Summary received:", summary);
            let message = '';
    
            // Mensaje para el mes pasado
            if (this.selectedMonth === currentMonth - 1 && this.selectedYear === new Date().getFullYear()) {
                message = `Vas a cerrar el mes pasado (${monthNameToClose}) con un total de:<br><br>· ${summary.clinicsCount} clínicas<br>· ${summary.total + summary.totalIVA} € de facturación + IVA.<br><br>¿Quieres continuar? Esta acción no se puede deshacer sin molestar a Carlos.`;
            } else {
                // Mensaje para el mes actual o el próximo mes
                message = `Estás cerrando ${monthNameToClose} pero aún no ha acabado ${currentMonthName}.<br><br>Vas a cerrar el mes con un total de:<br><br>· ${summary.clinicsCount} clínicas<br>· ${summary.total + summary.totalIVA} € de facturación + IVA.<br><br>¿Quieres continuar? Esta acción no se puede deshacer sin molestar a Carlos.`;
            }
    
            const confirmation = this._fuseConfirmationService.open({
                title: 'Cerrar mes',
                message: message,
                icon: {
                    show: true,
                    name: 'heroicons_outline:information-circle',
                    color: this.selectedMonth === currentMonth - 1 ? 'info' : 'warning'
                },
                actions: {
                    confirm: {
                        label: 'Sí',
                        color: this.selectedMonth === currentMonth - 1 ? 'primary' : 'warn'
                    },
                    cancel: {
                        label: 'No'
                    }
                }
            });
    
            confirmation.afterClosed().subscribe((result) => {
                if (result === 'confirmed') {
                    console.log("Month closure confirmed");
                    this.performCloseMonth();
                }
            });
    
            // Mostrar el pop-up con la información detallada
            this._snackBar.open(`Total de clínicas: ${summary.clinicsCount}, Total de facturación: ${summary.total + summary.totalIVA}€`, 'Cerrar', {
                duration: 5000,
            });
        });
    }
    
    
    

    performCloseMonth(): void {
        this._serviciosAsignadosService.closeMonth(this.selectedMonth, this.selectedYear).subscribe(() => {
            this.isMonthClosed = true; // Actualiza el estado local
            this._snackBar.open('Mes cerrado correctamente', 'Cerrar', {
                duration: 3000,
            });
            this.checkPreviousMonthClosed(); // Verificar nuevamente si el mes anterior está cerrado
            console.log("Month closed for:", this.selectedMonth, this.selectedYear);
    
            this._serviciosAsignadosService.getProductsByMonth('this-month', 'id_servicio_asignado', 'desc').subscribe(products => {
                console.log("Products after month closure:", products);
            });
        });
    }
    
    checkPreviousMonthClosed(): void {
        console.log("Checking if previous month is closed for:", this.previousMonthName);
        this._serviciosAsignadosService.isMonthClosed(this.previousMonthName).subscribe(isClosed => {
            this.showWarning = !isClosed;
            this._changeDetectorRef.markForCheck();
        }, error => {
            console.error('ERROR in checkPreviousMonthClosed:', error);
        });
    }


    /* Metodo para cargar productos */

    loadProducts(filter: string): void {
        this.isLoading = true;
    
        this._serviciosAsignadosService.getProductsByMonth(
            filter,
            'id_servicio_asignado',
            'desc'
        ).subscribe(() => {
            this.isLoading = false;
        });
    }
    

    /**
     * After view init
     */
    ngAfterViewInit(): void {
        // Marcar para verificación
        this._changeDetectorRef.markForCheck();
    
        // Cargar los productos inicialmente con el filtro "this-month"
        this.loadProducts('this-month');
    }
    

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Cancelar suscripción de todas las suscripciones
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Alternar detalles del producto
     *
     * @param productId
     */
    toggleDetails(productId: number): void {
        // Si el producto ya está seleccionado...
        if (this.selectedProduct && this.selectedProduct.id_servicio_asignado === productId) {
            // Cerrar los detalles
            this.closeDetails();
            return;
        }

        // Obtener el producto por id
        this._serviciosAsignadosService.getProductById(productId)
            .subscribe((product) => {
                // Establecer el producto seleccionado
                this.selectedProduct = product;
                console.log('Producto seleccionado:', this.selectedProduct);

                // Verificar si los datos están correctos antes de parchear el formulario
                console.log('Datos antes de parchear el formulario:', {
                    id_servicio_asignado: product.id_servicio_asignado || '',
                    id_clinica: product.id_clinica || '',
                    nombre_clinica: product.nombre_clinica || '',
                    id_servicio: product.id_servicio || '',
                    nombre_servicio: product.nombre_servicio || '',
                    descripcion_servicio: product.descripcion_servicio || '',
                    descripcion_detallada_servicio: product.descripcion_detallada_servicio || '',
                    precio_servicio: product.precio_servicio || 0,
                    iva_servicio: product.iva_servicio || 21,
                    servicio_recurrente: product.servicio_recurrente || false,
                    fecha_cobro: product.fecha_cobro || null,
                    precio_especial: product.precio_especial || false,
                    empresa_servicio: product.empresa_servicio || 'La voz medios digitales SL',
                    estado_servicio: product.estado_servicio || 'activo',
                    fecha_pausa: product.fecha_pausa || null,
                    datos_fiscales_clinica: product.datos_fiscales_clinica || {
                        denominacion_social: '',
                        cif_nif: '',
                        direccion_facturacion: ''
                    }
                });

                // Llenar el formulario con los valores del producto
                this.selectedProductForm.patchValue({
                    id_servicio_asignado: product.id_servicio_asignado || '',
                    id_clinica: product.id_clinica || '',
                    nombre_clinica: product.nombre_clinica || '',
                    id_servicio: product.id_servicio || '',
                    nombre_servicio: product.nombre_servicio || '',
                    descripcion_servicio: product.descripcion_servicio || '',
                    descripcion_detallada_servicio: product.descripcion_detallada_servicio || '',
                    precio_servicio: product.precio_servicio || 0,
                    iva_servicio: product.iva_servicio || 21,
                    servicio_recurrente: product.servicio_recurrente || false,
                    fecha_cobro: product.fecha_cobro || null,
                    precio_especial: product.precio_especial || false,
                    empresa_servicio: product.empresa_servicio || 'La voz medios digitales SL',
                    estado_servicio: product.estado_servicio || 'activo',
                    fecha_pausa: product.fecha_pausa || null,
                    datos_fiscales_clinica: product.datos_fiscales_clinica || {
                        denominacion_social: '',
                        cif_nif: '',
                        direccion_facturacion: ''
                    }
                });

                // Verificar los valores del formulario después de parchear
                console.log('Valores del formulario después de parchear:', this.selectedProductForm.value);

                // Forzar la detección de cambios
                this._changeDetectorRef.detectChanges();
            });
    }

    /**
     * Cerrar los detalles
     */
    closeDetails(): void {
        this.selectedProduct = null;
    }

    /**
     * Reiniciar formulario
     */
    resetForm(): void {
        console.log('Reiniciando formulario');
        this.selectedProductForm.reset({
            id_servicio_asignado: '1',
            id_clinica: '1',
            nombre_clinica: '',
            id_servicio: '70',
            nombre_servicio: 'Nuevo servicio', // Proporcionar un valor predeterminado
            descripcion_servicio: '',
            descripcion_detallada_servicio: '',
            precio_servicio: 0,
            iva_servicio: 21,
            servicio_recurrente: false,
            fecha_cobro: null,
            precio_especial: false,
            empresa_servicio: 'La voz medios digitales SL',
            estado_servicio: 'activo',
            fecha_pausa: null,
            datos_fiscales_clinica: {
                denominacion_social: '',
                cif_nif: '',
                direccion_facturacion: ''
            }
        });

        this.selectedProduct = null; // Asegurarse de reiniciar selectedProduct
    }

    /**
     * Actualizar el producto seleccionado utilizando los datos del formulario
     */
    updateSelectedProduct(): void {
        const product = this.selectedProductForm.getRawValue();

        // Log para verificar los datos antes de la solicitud
        console.log('Datos del producto antes de actualizar:', product);

        // Asegurarse de que el estado del servicio sea uno de los valores permitidos
        if (!['activo', 'pausa', 'pausar hasta', 'pausado hasta fecha'].includes(product.estado_servicio)) {
            console.error('Valor inválido para estado_servicio:', product.estado_servicio);
            return;
        }

        console.log('Actualizando producto:', product);

        // Actualizar el producto en el servidor
        this._serviciosAsignadosService.updateProduct(product.id_servicio_asignado, product).subscribe(() => {
            // Mostrar un mensaje de éxito
            this.showFlashMessage('success');
            this._snackBar.open('Servicio asignado actualizado', 'Cerrar', {
                duration: 3000, // 3000 milisegundos = 3 segundos
            });
            this.resetForm(); // Reiniciar el formulario después de actualizar un producto
        });
    }

    /**
     * Eliminar el producto seleccionado utilizando los datos del formulario
     */
    deleteSelectedProduct(): void {
        // Abrir el cuadro de diálogo de confirmación
        const confirmation = this._fuseConfirmationService.open({
            title: 'Eliminar servicio asignado',
            message: '¿Está seguro que desea eliminar este servicio asignado? ¡Esta acción no se puede deshacer!',
            actions: {
                confirm: {
                    label: 'Eliminar',
                },
            },
        });

        // Suscribirse a la acción de cierre del cuadro de diálogo de confirmación
        confirmation.afterClosed().subscribe((result) => {
            // Si se presionó el botón de confirmación...
            if (result === 'confirmed') {
                // Obtener el objeto del producto
                const product = this.selectedProductForm.getRawValue();
                console.log('Eliminando producto:', product);

                // Eliminar el producto en el servidor
                this._serviciosAsignadosService.deleteProduct(product.id_servicio_asignado).subscribe(() => {
                    // Cerrar los detalles
                    this.closeDetails();
                });
            }
        });
    }

    /**
     * Duplicar el producto seleccionado
     */
    duplicateProduct(): void {
        const product = this.selectedProductForm.getRawValue();
        console.log('Duplicando producto:', product);

        // Eliminar el ID del producto para crear uno nuevo
        delete product.id_servicio_asignado;

        // Crear el producto duplicado en el servidor
        this._serviciosAsignadosService.createProduct(product).subscribe(
            (newProduct) => {
                console.log('Producto duplicado:', newProduct);
                // Mostrar un mensaje de éxito
                this.showFlashMessage('success');
                this._snackBar.open('Servicio asignado duplicado', 'Cerrar', {
                    duration: 3000, // 3000 milisegundos = 3 segundos
                });
                this._serviciosAsignadosService.getProducts().subscribe();
                this.resetForm(); // Reiniciar el formulario después de duplicar un producto
            },
            (error) => {
                console.error('Error al duplicar el producto:', error);
                this.showFlashMessage('error');
            }
        );
    }

    /**
     * Mostrar mensaje flash
     */
    showFlashMessage(type: 'success' | 'error'): void {
        // Mostrar el mensaje
        this.flashMessage = type;

        // Marcar para verificación
        this._changeDetectorRef.markForCheck();

        // Ocultarlo después de 3 segundos
        setTimeout(() => {
            this.flashMessage = null;

            // Marcar para verificación
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }

    /**
     * Función de seguimiento para bucles ngFor
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id_servicio_asignado || index;
    }

    // Método para abrir el formulario de asignar servicio en un popup

    openFormDialog(): void {
        const dialogRef = this._dialog.open(ServiciosAsignadosFormComponent, {
            width: '80vw',
            data: {}
        });
    
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('Producto creado desde diálogo con datos:', result);
                this.showFlashMessage('success');
                const mensaje = result.estado_servicio ? 'Servicio asignado creado' : 'Servicio histórico creado';
                this._snackBar.open(mensaje, 'Cerrar', {
                    duration: 3000,
                });
                this._serviciosAsignadosService.getProducts(0, 50, 'id_servicio_asignado', 'desc').subscribe();
            }
        });
    }
    
}
