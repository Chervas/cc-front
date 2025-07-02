import { AsyncPipe, CurrencyPipe, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ServiciosService } from '../servicios.service';
import { ServiciosPagination, ServiciosProduct } from '../servicios.types';
import { debounceTime, map, merge, Observable, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector       : 'servicios-list',
    templateUrl    : './servicios.component.html',
    styles         : [
        /* language=SCSS */
        `
            .servicios-grid {
                grid-template-columns: 2fr 1fr 1fr 1fr 48px;

                @screen sm {
                    grid-template-columns: 2fr 1fr 1fr 1fr 48px;
                }
            }
        `,
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations,
    standalone     : true,
    imports        : [NgIf, MatProgressBarModule, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatSortModule, NgFor, NgTemplateOutlet, MatPaginatorModule, NgClass, MatSelectModule, MatOptionModule, MatRippleModule, AsyncPipe, CurrencyPipe, MatSnackBarModule],
})
export class ServiciosListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    products$: Observable<ServiciosProduct[]>;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: ServiciosPagination;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedProduct: ServiciosProduct | null = null;
    selectedProductForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _serviciosService: ServiciosService,
        private _snackBar: MatSnackBar
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
        // Crear el formulario seleccionado del producto
        this.selectedProductForm = this._formBuilder.group({
            id_servicio      : [''],
            nombre_servicio  : ['Nuevo servicio', [Validators.required]],
            descripcion_servicio: [''],
            precio_servicio  : [0, [Validators.required]],
            iva_servicio     : [21, [Validators.required]],
            categoria_servicio: ['SEO', [Validators.required]],
            empresa_servicio: ['La voz medios digitales SL', [Validators.required]],
        });

        console.log('Formulario inicializado:', this.selectedProductForm.getRawValue());
        this.resetForm(); 

        // Obtener la paginación
        this._serviciosService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: ServiciosPagination) =>
            {
                // Actualizar la paginación
                this.pagination = pagination;

                // Marcar para verificación
                this._changeDetectorRef.markForCheck();
            });

        // Obtener los productos
        this.products$ = this._serviciosService.products$;

        // Obtener productos inicialmente con tamaño de página 50
        this._serviciosService.getProducts(0, 50, 'nombre_servicio', 'asc').subscribe();

        // Suscribirse a los cambios en el campo de entrada de búsqueda
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) =>
                {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._serviciosService.getProducts(0, 50, 'nombre_servicio', 'asc', query);
                }),
                map(() =>
                {
                    this.isLoading = false;
                }),
            )
            .subscribe();
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        if ( this._sort && this._paginator )
        {
            // Establecer la ordenación inicial
            this._sort.sort({
                id          : 'nombre_servicio',
                start       : 'asc',
                disableClear: true,
            });

            // Marcar para verificación
            this._changeDetectorRef.markForCheck();

            // Si el usuario cambia el orden de clasificación...
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() =>
                {
                    // Restablecer a la primera página
                    this._paginator.pageIndex = 0;

                    // Cerrar los detalles
                    this.closeDetails();
                });

            // Obtener productos si cambia el orden o la página
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() =>
                {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._serviciosService.getProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
                }),
                map(() =>
                {
                    this.isLoading = false;
                }),
            ).subscribe();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
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
    toggleDetails(productId: number): void
    {
        // Si el producto ya está seleccionado...
        if ( this.selectedProduct && this.selectedProduct.id_servicio === productId )
        {
            // Cerrar los detalles
            this.closeDetails();
            return;
        }

        // Obtener el producto por id
        this._serviciosService.getProductById(productId)
            .subscribe((product) =>
            {
                // Establecer el producto seleccionado
                this.selectedProduct = product;
                console.log('Producto seleccionado:', this.selectedProduct);

                // Llenar el formulario
                this.selectedProductForm.patchValue(product);

                // Marcar para verificación
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Cerrar los detalles
     */
    closeDetails(): void
    {
        this.selectedProduct = null;
    }

    /**
     * Crear producto
     */
    createProduct(): void {
        const product = this.selectedProductForm.getRawValue();
        console.log('Datos del formulario antes de crear:', product);
    
        // Verificar y convertir valores numéricos
        product.precio_servicio = parseFloat(product.precio_servicio);
        product.iva_servicio = parseFloat(product.iva_servicio);
    
        if (isNaN(product.precio_servicio) || isNaN(product.iva_servicio) || product.categoria_servicio === '' || product.nombre_servicio === '') {
            console.error('El precio y el IVA deben ser números y la categoría y el nombre no deben estar vacíos');
            this.showFlashMessage('error');
            return;
        }
    
        console.log('Creando producto:', product);
    
        // Crear el producto en el servidor
        this._serviciosService.createProduct(product).subscribe(
            (newProduct) => {
                console.log('Producto creado:', newProduct);
                // Mostrar un mensaje de éxito
                this.showFlashMessage('success');
                this._snackBar.open('Servicio creado', 'Cerrar', {
                    duration: 3000, // 3000 milisegundos = 3 segundos
                });
                this._serviciosService.getProducts().subscribe();
                this.resetForm(); // Reiniciar el formulario después de crear un producto
            },
            (error) => {
                console.error('Error al crear el producto:', error);
                this.showFlashMessage('error');
            }
        );
    }

    /**
     * Reiniciar formulario
     */
    resetForm(): void {
        console.log('Reiniciando formulario');
        this.selectedProductForm.reset({
            id_servicio: '',
            nombre_servicio: 'Nuevo servicio',
            descripcion_servicio: '',
            precio_servicio: 0,
            iva_servicio: 21,
            categoria_servicio: 'SEO',
            empresa_servicio: 'La voz medios digitales SL',
        });
    
        this.selectedProduct = null; // Asegurarse de reiniciar selectedProduct
    }

    /**
     * Actualizar el producto seleccionado utilizando los datos del formulario
     */
    updateSelectedProduct(): void
    {
        // Obtener el objeto del producto
        const product = this.selectedProductForm.getRawValue();
        console.log('Actualizando producto:', product);

        // Actualizar el producto en el servidor
        this._serviciosService.updateProduct(product.id_servicio, product).subscribe(() =>
        {
            // Mostrar un mensaje de éxito
            this.showFlashMessage('success');
            this._snackBar.open('Servicio actualizado', 'Cerrar', {
                duration: 3000, // 3000 milisegundos = 3 segundos
            });
            this.resetForm(); // Reiniciar el formulario después de actualizar un producto
        });
    }

    /**
     * Eliminar el producto seleccionado utilizando los datos del formulario
     */
    deleteSelectedProduct(): void
    {
        // Abrir el cuadro de diálogo de confirmación
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Eliminar servicio',
            message: '¿Está seguro que desea eliminar este servicio? ¡Esta acción no se puede deshacer!',
            actions: {
                confirm: {
                    label: 'Eliminar',
                },
            },
        });

        // Suscribirse a la acción de cierre del cuadro de diálogo de confirmación
        confirmation.afterClosed().subscribe((result) =>
        {
            // Si se presionó el botón de confirmación...
            if ( result === 'confirmed' )
            {
                // Obtener el objeto del producto
                const product = this.selectedProductForm.getRawValue();
                console.log('Eliminando producto:', product);

                // Eliminar el producto en el servidor
                this._serviciosService.deleteProduct(product.id_servicio).subscribe(() =>
                {
                    // Cerrar los detalles
                    this.closeDetails();
                });
            }
        });
    }

    /**
     * Mostrar mensaje flash
     */
    showFlashMessage(type: 'success' | 'error'): void
    {
        // Mostrar el mensaje
        this.flashMessage = type;

        // Marcar para verificación
        this._changeDetectorRef.markForCheck();

        // Ocultarlo después de 3 segundos
        setTimeout(() =>
        {
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
    trackByFn(index: number, item: any): any
    {
        return item.id_servicio || index;
    }
}
