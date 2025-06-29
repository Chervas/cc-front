import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ServiciosAsignadosPagination, ServiciosAsignadosProduct } from 'app/modules/admin/apps/ventas/servicios_asignados/servicios_asignados.types';
import { HistorialDeServiciosProduct } from 'app/modules/admin/apps/ventas/historial_de_servicios/historial_de_servicios.types';
import { HistorialDeServiciosService } from 'app/modules/admin/apps/ventas/historial_de_servicios/historial_de_servicios.service';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { switchMap, take, tap, map, filter, catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';


@Injectable({ providedIn: 'root' })
export class ServiciosAsignadosService {
    // URL base del API de servicios asignados
    private baseUrl = `${environment.apiUrl}/servicios`; // Ajusta la dirección IP o URL según corresponda

    // Private
    private _pagination: BehaviorSubject<ServiciosAsignadosPagination | null> = new BehaviorSubject(null);
    private _product: BehaviorSubject<ServiciosAsignadosProduct | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<ServiciosAsignadosProduct[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient, private historialDeServiciosService: HistorialDeServiciosService) {}

    // Accessors
    get pagination$(): Observable<ServiciosAsignadosPagination> {
        return this._pagination.asObservable();
    }

    get product$(): Observable<ServiciosAsignadosProduct> {
        return this._product.asObservable();
    }

    get products$(): Observable<ServiciosAsignadosProduct[]> {
        return this._products.asObservable();
    }

    // Public methods
    getProducts(page: number = 0, size: number = 10, sort: string = 'nombre_servicio', order: 'asc' | 'desc' | '' = 'asc', search: string = ''):
        Observable<{ pagination: ServiciosAsignadosPagination; products: ServiciosAsignadosProduct[] }> {
        console.log('Fetching products with params:', { page, size, sort, order, search });
        return this._httpClient.get<{ pagination: ServiciosAsignadosPagination; products: ServiciosAsignadosProduct[] }>(`${this.baseUrl}/products`, {
            params: {
                page: '' + page,
                size: '' + size,
                sort,
                order,
                search,
            },
        }).pipe(
            tap(response => {
                console.log('Received products response:', response);
                this._pagination.next(response.pagination);
                this._products.next(response.products);
            }),
            catchError(this.handleError)
        );
    }

    getProductById(id: number): Observable<ServiciosAsignadosProduct> {
        console.log('Fetching product by ID:', id);
        return this._products.pipe(
            take(1),
            map(products => {
                if (!Array.isArray(products)) {
                    throw new TypeError('Products is not an array');
                }

                const product = products.find(item => item.id_servicio_asignado === id) || null;
                this._product.next(product);
                return product;
            }),
            switchMap(product => {
                if (!product) {
                    return new Observable<ServiciosAsignadosProduct>((subscriber) => {
                        subscriber.error('Could not find product with id of ' + id + '!');
                    });
                }
                return new Observable<ServiciosAsignadosProduct>((subscriber) => {
                    subscriber.next(product);
                });
            }),
            catchError(this.handleError)
        );
    }

    createProduct(product: ServiciosAsignadosProduct): Observable<ServiciosAsignadosProduct> {
        console.log('Creating product:', product);
        return this.products$.pipe(
            take(1),
            switchMap(products => {
                if (!Array.isArray(products)) {
                    products = [];
                }
    
                return this._httpClient.post<ServiciosAsignadosProduct>(`${this.baseUrl}`, product).pipe(
                    tap(newProduct => {
                        console.log('New product created:', newProduct);
                        this._products.next([newProduct, ...products]);
                    }),
                    catchError(this.handleError)
                );
            })
        );
    }
    
    

    updateProduct(id: number, product: ServiciosAsignadosProduct): Observable<ServiciosAsignadosProduct> {
        console.log('Updating product with ID:', id, 'and data:', product);
        return this.products$.pipe(
            take(1),
            switchMap(products => {
                if (!Array.isArray(products)) {
                    throw new TypeError('Products is not an array');
                }

                return this._httpClient.patch<ServiciosAsignadosProduct>(`${this.baseUrl}/${id}`, product).pipe(
                    map(updatedProduct => {
                        console.log('Product updated:', updatedProduct);
                        const index = products.findIndex(item => item.id_servicio_asignado === id);
                        products[index] = updatedProduct;
                        this._products.next(products);
                        return updatedProduct;
                    }),
                    switchMap(updatedProduct => this.product$.pipe(
                        take(1),
                        filter(item => item && item.id_servicio_asignado === id),
                        tap(() => {
                            this._product.next(updatedProduct);
                            return updatedProduct;
                        })
                    )),
                    catchError(this.handleError)
                );
            })
        );
    }

    deleteProduct(id: number): Observable<boolean> {
        console.log('Deleting product with ID:', id);
        return this.products$.pipe(
            take(1),
            switchMap(products => {
                if (!Array.isArray(products)) {
                    throw new TypeError('Products is not an array');
                }

                return this._httpClient.delete(`${this.baseUrl}/${id}`).pipe(
                    map((isDeleted: boolean) => {
                        console.log('Product deleted:', isDeleted);
                        const index = products.findIndex(item => item.id_servicio_asignado === id);
                        products.splice(index, 1);
                        this._products.next(products);
                        return isDeleted;
                    }),
                    catchError(this.handleError)
                );
            })
        );
    }

    getClinicas(): Observable<any[]> {
        console.log('Fetching all clinicas');
        return this._httpClient.get<any[]>(`${environment.apiUrl}/clinicas`).pipe(
            catchError(this.handleError)
        );
    }

    getClinicaById(id: number): Observable<any> {
        console.log('Fetching clinica by ID:', id);
        return this._httpClient.get<any>(`${environment.apiUrl}/clinicas/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    getServicios(): Observable<any[]> {
        console.log('Fetching all servicios');
        return this._httpClient.get<any[]>(`${environment.apiUrl}/servicios`).pipe(
            catchError(this.handleError)
        );
    }

    getServicioById(id: number): Observable<any> {
        console.log('Fetching servicio by ID:', id);
        return this._httpClient.get<any>(`${environment.apiUrl}/servicios/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    getProductsByMonth(filter: string, sortField: string, sortOrder: string): Observable<{ products: ServiciosAsignadosProduct[] }> {
        let startDate: string;
        let endDate: string;
        const currentDate = new Date();

        switch (filter) {
            case 'last-month':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).toISOString();
                break;
            case 'this-month':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
                break;
            case 'next-month':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString();
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();
                break;
            default:
                startDate = '';
                endDate = '';
        }

        console.log('Fetching products by month with filter:', filter, 'startDate:', startDate, 'endDate:', endDate);

        return this._httpClient.get<{ products: ServiciosAsignadosProduct[] }>(`${this.baseUrl}/products`, {
            params: {
                startDate,
                endDate,
                sortField,
                sortOrder
            }
        }).pipe(
            tap(response => {
                console.log('Received products by month response:', response);
                this._products.next(response.products);
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Servicios para el estado de mes cerrado
     */
    isMonthClosed(monthName: string): Observable<boolean> {
        console.log("Calling isMonthClosed with monthName:", monthName);
        return this._httpClient.get<boolean>(`${this.baseUrl}/is-month-closed`, {
            params: { monthName }
        }).pipe(
            tap(response => {
                console.log('Received isMonthClosed response:', response);
            }),
            map(response => {
                console.log('Mapped response:', response);
                return response === true;
            }),
            catchError((error: HttpErrorResponse) => {
                console.error("Error in isMonthClosed:", error);
                if (error.status === 404) {
                    return of(false);
                }
                return throwError(error);
            })
        );
    }
    
    
    
    

    closeMonth(month: number, year: number): Observable<any> {
        console.log('Calling closeMonth with month:', month, 'and year:', year);
        return this._httpClient.post<any>(`${this.baseUrl}/close-month`, { month, year }).pipe(
            tap(response => {
                console.log('Received closeMonth response:', response);
                // Llamada a handleMonthClosure
                this.handleMonthClosure(month, year);
            }),
            catchError(this.handleError)
        );
    }
    

    /**
     * Manejo de la lógica de cierre de mes
     */
    private handleMonthClosure(month: number, year: number): void {
        console.log('Handling month closure for month:', month, 'year:', year);
        this.products$.pipe(take(1)).subscribe(products => {
            if (products) {
                console.log('Products to handle for closure:', products);
                const currentDate = new Date(year, month, 1); // Fecha del mes actual
                products.forEach(product => {
                    console.log('Processing product:', product);
                    if (product.servicio_recurrente) {
                        const newDate = new Date(year, month + 1, 5); // Fecha del mes siguiente
    
                        if (product.estado_servicio === 'activo') {
                            // Crear en servicios asignados del mes siguiente
                            this.getServicioById(product.id_servicio).subscribe(servicio => {
                                const newProduct: ServiciosAsignadosProduct = {
                                    ...product,
                                    fecha_cobro: newDate,
                                    estado_servicio: 'activo',
                                    precio_especial: false,
                                    precio_servicio: servicio.precio_servicio
                                };
                                console.log('Creating new assigned product for next month:', newProduct);
                                this.createProduct(newProduct).subscribe();
    
                                // Pasar a Historial de servicios
                                const historialData: HistorialDeServiciosProduct = {
                                    ...product,
                                    fecha_cobro: currentDate,
                                    incluir_en_factura: false
                                };
                                console.log('Creating historial product for current month:', historialData);
                                this.historialDeServiciosService.createProduct(historialData).subscribe((newProduct: HistorialDeServiciosProduct) => {
                                    console.log('Created historial product (activo):', newProduct);
                                });
                            });
                        } else if (product.estado_servicio === 'pausa' || product.estado_servicio === 'pausado hasta fecha') {
                            // Crear en servicios asignados del mes siguiente sin cambios
                            const newProduct: ServiciosAsignadosProduct = {
                                ...product,
                                fecha_cobro: newDate,
                                precio_especial: false
                            };
                            console.log('Creating new assigned product for next month (pausa/pausado hasta fecha):', newProduct);
                            this.createProduct(newProduct).subscribe();
                        }
                    } else if (product.estado_servicio === 'activo') {
                        // Pasar a Historial de servicios si no es recurrente
                        const historialData: HistorialDeServiciosProduct = {
                            ...product,
                            fecha_cobro: currentDate,
                            incluir_en_factura: false
                        };
                        console.log('Creating historial product for current month (no recurrente):', historialData);
                        this.historialDeServiciosService.createProduct(historialData).subscribe((newProduct: HistorialDeServiciosProduct) => {
                            console.log('Created historial product (no recurrente):', newProduct);
                        });
                    }
                });
            }
        });
    }
    
    
    
    
    
    

    /**
     * Manejo de errores
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        console.error('An error occurred:', error);
        return throwError('Something bad happened; please try again later.');
    }

    /**
     * Obtener resumen del mes (total en euros y número de clientes)
     */
    getMonthSummary(month: number, year: number): Observable<any> {
        return this._httpClient.get<any>(`${this.baseUrl}/month-summary`, {
            params: {
                month: month.toString(),
                year: year.toString()
            }
        }).pipe(
            map(summary => {
                summary.total = summary.total ?? 0;
                summary.totalIVA = summary.totalIVA ?? 0;
                summary.clinicsCount = summary.clinicsCount ?? 0;
                summary.pausedServicesCount = summary.pausedServicesCount ?? 0;
                summary.pausedServicesTotal = summary.pausedServicesTotal ?? 0;
                return summary;
            }),
            catchError(this.handleError) // Asegúrate de manejar los errores
        );
    }
    
    
    
}
