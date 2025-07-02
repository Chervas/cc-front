import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ServiciosAsignadosFormComponent } from '../../servicios_asignados/form/servicios-asignados-form.component';
import { HistorialDeServiciosService } from '../historial_de_servicios.service';
import { HistorialDeServiciosProduct, HistorialDeServiciosPagination } from '../historial_de_servicios.types';
import { takeUntil, switchMap, debounceTime, map, take } from 'rxjs/operators';
import { Subject, Observable, merge, forkJoin } from 'rxjs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'historial-de-servicios-list',
    templateUrl: './historial_de_servicios_list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: fuseAnimations,
    standalone: true,
    styles: [
        /* language=SCSS */
        `
            .servicios-grid {
                grid-template-columns: 40px 80px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 20px;

                @screen sm {
                    grid-template-columns: 20px 1fr 2fr 3fr 4fr 3fr 1fr  1fr 1fr 1fr 1fr 1fr 1fr 20px;
                }
            }
        `,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        MatSortModule,
        MatProgressBarModule,
        MatSelectModule,
        MatDialogModule,
        MatCheckboxModule,
        MatRadioModule,
        MatDatepickerModule,
        MatButtonToggleModule,
        MatSnackBarModule,
        ServiciosAsignadosFormComponent,
    ]
})
export class HistorialDeServiciosListComponent implements OnInit, AfterViewInit, OnDestroy {
    isCreating: boolean = false;
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    products$: Observable<HistorialDeServiciosProduct[]>;
    clinicas$: Observable<any[]>;
    servicios$: Observable<any[]>;
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: HistorialDeServiciosPagination;
    searchInputControl: FormControl = new FormControl();
    selectedProduct: HistorialDeServiciosProduct | null = null;
    selectedProductForm: FormGroup;
    selectedProducts: HistorialDeServiciosProduct[] = []; // Lista de productos seleccionados
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private _historialDeServiciosService: HistorialDeServiciosService,
        private _snackBar: MatSnackBar,
        private _dialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService
    ) {}

    ngOnInit(): void {
        this.selectedProductForm = this._formBuilder.group({
            id_servicio_asignado: [''],
            fecha_cobro: [new Date(), [Validators.required]],  // Asegúrate de usar fecha_cobro
            id_clinica: ['', [Validators.required]],
            nombre_clinica: ['', [Validators.required]],
            id_servicio: ['', [Validators.required]],
            nombre_servicio: ['', [Validators.required]],
            descripcion_detallada_servicio: [''],
            descripcion_servicio: ['', [Validators.required]], // Añadido
            precio_servicio: [0, [Validators.required]],
            iva_servicio: [21, [Validators.required]],
            servicio_recurrente: [false, [Validators.required]],
            num_factura_asociada: [''],
            empresa_servicio: ['La voz medios digitales SL', [Validators.required]],
            incluir_en_factura: [false, [Validators.required]],
            datos_fiscales_clinica: this._formBuilder.group({
                denominacion_social: [''],
                cif_nif: [''],
                direccion_facturacion: ['']
            }),
            precio_especial: [false, [Validators.required]]  // Añadido
        });

        this.clinicas$ = this._historialDeServiciosService.getClinicas();
        this.servicios$ = this._historialDeServiciosService.getServicios();

        this._historialDeServiciosService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: HistorialDeServiciosPagination) => {
                this.pagination = pagination;
                this._changeDetectorRef.markForCheck();
            });

        this.products$ = this._historialDeServiciosService.products$;

        this._historialDeServiciosService.getProducts(0, 50, 'id_servicio_asignado', 'desc').subscribe();

        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    return this._historialDeServiciosService.getProducts(0, 50, 'id_servicio_asignado', 'desc', query);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();
    }

    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    this._paginator.pageIndex = 0;
                });
    
            merge(this._sort.sortChange, this._paginator.page)
                .pipe(
                    switchMap(() => {
                        this.isLoading = true;
                        return this._historialDeServiciosService.getProducts(
                            this._paginator.pageIndex, 
                            this._paginator.pageSize, 
                            this._sort.active, 
                            this._sort.direction || 'asc'  // Asignar 'asc' si direction es una cadena vacía
                        );
                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                )
                .subscribe();
        }
    }
    

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleDetails(productId: number): void {
        console.log('toggleDetails productId:', productId);
        if (this.selectedProduct && this.selectedProduct.id_servicio_asignado === productId) {
            this.selectedProduct = null;
        } else {
            this._historialDeServiciosService.getProductById(productId)
                .subscribe((product) => {
                    console.log('Producto obtenido para detalles:', product);
                    this.selectedProduct = product;
                    this.selectedProductForm.patchValue(product);
                    this._changeDetectorRef.markForCheck();
                });
        }
    }

    closeDetails(): void {
        this.selectedProduct = null;
    }

    resetForm(): void {
        this.selectedProductForm.reset({
            id_servicio_asignado: '',
            fecha_cobro: null,
            id_clinica: '',
            nombre_clinica: '',
            id_servicio: '',
            nombre_servicio: '',
            descripcion_detallada_servicio: '',
            descripcion_servicio: '', // Añadido
            precio_servicio: 0,
            iva_servicio: 21,
            servicio_recurrente: false,
            num_factura_asociada: '',
            empresa_servicio: 'La voz medios digitales SL',
            incluir_en_factura: false,
            datos_fiscales_clinica: {
                denominacion_social: '',
                cif_nif: '',
                direccion_facturacion: ''
            },
            precio_especial: false
        });
        this.selectedProduct = null;
    }

    updateSelectedProduct(): void {
        if (this.selectedProductForm.invalid) {
            this.showFlashMessage('error');
            this._snackBar.open('Por favor, completa los campos requeridos', 'Cerrar', {
                duration: 3000
            });
            return;
        }
    
        const product = { ...this.selectedProduct, ...this.selectedProductForm.getRawValue() };
        console.log('Datos del formulario antes de actualizar:', product);
    
        this._historialDeServiciosService.updateProduct(product.id_servicio_asignado, product).subscribe(
            (updatedProduct) => {
                console.log('Producto actualizado:', updatedProduct);
                this.showFlashMessage('success');
                this._snackBar.open('Servicio histórico actualizado', 'Cerrar', {
                    duration: 3000
                });
                this._historialDeServiciosService.getProducts(0, 50, 'id_servicio_asignado', 'desc').subscribe();
                this.resetForm();
            },
            (error) => {
                console.error('Error al actualizar el producto:', error);
                this.showFlashMessage('error');
            }
        );
    }

    deleteSelectedProduct(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Eliminar servicio histórico',
            message: '¿Está seguro que desea eliminar este servicio histórico? ¡Esta acción no se puede deshacer!',
            actions: {
                confirm: {
                    label: 'Eliminar',
                },
            },
        });
    
        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const product = this.selectedProductForm.getRawValue();
                this._historialDeServiciosService.deleteProduct(product.id_servicio_asignado).subscribe(() => {
                    this.showFlashMessage('success');
                    this._snackBar.open('Servicio histórico eliminado', 'Cerrar', {
                        duration: 3000
                    });
                    this._historialDeServiciosService.getProducts(0, 50, 'id_servicio_asignado', 'desc').subscribe();
                    this.closeDetails();
                }, (error) => {
                    console.error('Error al eliminar el producto:', error);
                    this.showFlashMessage('error');
                });
            }
        });
    }

    duplicateProduct(): void {
        const product = this.selectedProductForm.getRawValue();
        console.log('Duplicando producto:', product);

        delete product.id_servicio_asignado;

        if (!product.fecha_cobro) {
            this.showFlashMessage('error');
            this._snackBar.open('Fecha de cobro es requerida', 'Cerrar', {
                duration: 3000,
            });
            return;
        }

        this._historialDeServiciosService.createProduct(product).subscribe(
            (newProduct) => {
                console.log('Producto duplicado:', newProduct);
                this.showFlashMessage('success');
                this._snackBar.open('Servicio histórico duplicado', 'Cerrar', {
                    duration: 3000,
                });
                this._historialDeServiciosService.getProducts(0, 50, 'id_servicio_asignado', 'desc').subscribe();
                this.resetForm();
            },
            (error) => {
                console.error('Error al duplicar el producto:', error);
                this.showFlashMessage('error');
            }
        );
    }

    showFlashMessage(type: 'success' | 'error'): void {
        this.flashMessage = type;
        this._changeDetectorRef.markForCheck();
        setTimeout(() => {
            this.flashMessage = null;
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }

    openFormDialog(): void {
        const dialogRef = this._dialog.open(ServiciosAsignadosFormComponent, {
            width: '80vw',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('Producto creado desde diálogo con datos:', result);
                this.showFlashMessage('success');
                this._snackBar.open('Servicio histórico creado', 'Cerrar', {
                    duration: 3000,
                });
                this._historialDeServiciosService.getProducts(0, 50, 'id_servicio_asignado', 'desc').subscribe();
            }
        });
    }

    toggleProductSelection(product: HistorialDeServiciosProduct): void {
        product.selected = !product.selected;
        this.updateSelectedProducts();
    }

    toggleSelectAll(): void {
        this.products$.pipe(take(1)).subscribe(products => {
            const allSelected = products.every(product => product.selected);
    
            products.forEach(product => {
                product.selected = !allSelected;
                console.log(`Producto ${product.id_servicio_asignado} seleccionado: ${product.selected}`);
            });
    
            this.updateSelectedProducts();
        });
    }
    
    updateSelectedProducts(): void {
        this.products$.pipe(take(1)).subscribe(products => {
            this.selectedProducts = products.filter(product => product.selected);
            this._changeDetectorRef.markForCheck();
        });
    }
    

    deleteSelectedProducts(): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Eliminar servicios históricos seleccionados',
            message: '¿Está seguro que desea eliminar los servicios históricos seleccionados? ¡Esta acción no se puede deshacer!',
            actions: {
                confirm: {
                    label: 'Eliminar',
                },
            },
        });
    
        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const deleteObservables = this.selectedProducts.map(product => 
                    this._historialDeServiciosService.deleteProduct(product.id_servicio_asignado)
                );
    
                forkJoin(deleteObservables).subscribe(() => {
                    this.showFlashMessage('success');
                    this._snackBar.open('Servicios históricos eliminados', 'Cerrar', {
                        duration: 3000
                    });
                    this._historialDeServiciosService.getProducts(0, 50, 'id_servicio_asignado', 'desc').subscribe();
                    this.updateSelectedProducts();
                }, (error) => {
                    console.error('Error al eliminar los productos:', error);
                    this.showFlashMessage('error');
                });
            }
        });
    }
}
