import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { HistorialDeServiciosPagination, HistorialDeServiciosProduct } from './historial_de_servicios.types';

@Injectable({
    providedIn: 'root'
})
export class HistorialDeServiciosService {
    // URL base del API de historial de servicios
    private baseUrl = '${environment.apiUrl}/historialdeservicios';

    private _pagination: BehaviorSubject<HistorialDeServiciosPagination | null> = new BehaviorSubject(null);
    private _product: BehaviorSubject<HistorialDeServiciosProduct | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<HistorialDeServiciosProduct[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) { }

    // Accessors

    get pagination$(): Observable<HistorialDeServiciosPagination> {
        return this._pagination.asObservable();
    }

    get product$(): Observable<HistorialDeServiciosProduct> {
        return this._product.asObservable();
    }

    get products$(): Observable<HistorialDeServiciosProduct[]> {
        return this._products.asObservable();
    }

    // Public methods

    getProducts(page: number = 0, size: number = 50, sort: string = 'id_servicio_asignado', order: 'asc' | 'desc' | '' = 'asc', search: string = ''):
     Observable<{ pagination: HistorialDeServiciosPagination; products: HistorialDeServiciosProduct[] }> {
        console.log('Fetching historial products with params:', { page, size, sort, order, search });
        return this._httpClient.get<{ pagination: HistorialDeServiciosPagination; products: HistorialDeServiciosProduct[] }>(`${this.baseUrl}/products`, {
            params: {
                page: '' + page,
                size: '' + size,
                sort,
                order,
                search,
            },
        }).pipe(
            tap(response => {
                console.log('Received historial products response:', response);
                this._pagination.next(response.pagination);
                this._products.next(response.products);
            }),
            catchError((error) => {
                console.error('Error al solicitar productos:', error);
                return throwError(error);
            })
        );
    }
    

    getProductById(id: number): Observable<HistorialDeServiciosProduct> {
        console.log('Fetching historial product by ID:', id);
        return this._httpClient.get<HistorialDeServiciosProduct>(`${this.baseUrl}/${id}`).pipe(
            tap(product => {
                console.log('Received historial product:', product);
                this._product.next(product);
            }),
            catchError((error) => {
                console.error('Error al obtener el producto:', error);
                return throwError(error);
            })
        );
    }

    // Servicio ajustado para obtener todos los productos para el paginador
    getAllProducts(): Observable<HistorialDeServiciosProduct[]> {
        console.log('Fetching all historial products');
        return this._httpClient.get<HistorialDeServiciosProduct[]>(`${this.baseUrl}/all-products`).pipe(
            tap(response => {
                console.log('Received all historial products response:', response);
            }),
            catchError((error) => {
                console.error('Error al solicitar todos los productos:', error);
                return throwError(error);
            })
        );
    }

    createProduct(product: HistorialDeServiciosProduct): Observable<HistorialDeServiciosProduct> {
        console.log('Creando producto en el backend:', product);
        return this._httpClient.post<HistorialDeServiciosProduct>(`${this.baseUrl}/products`, product).pipe(
            tap((response) => {
                console.log('Producto creado:', response);
            }),
            catchError((error) => {
                console.error('Error al crear el producto:', error);
                return throwError(error);
            })
        );
    }
    

    updateProduct(id: number, product: HistorialDeServiciosProduct): Observable<HistorialDeServiciosProduct> {
        const updatedProduct = {
            ...product,
            fecha_cobro: product.fecha_cobro // Asegúrate de que el nombre del campo es correcto
        };
        console.log('Updating historial product with ID:', id, 'and data:', updatedProduct);
        return this._httpClient.patch<HistorialDeServiciosProduct>(`${this.baseUrl}/${id}`, updatedProduct).pipe(
            tap((response) => {
                console.log('Producto de historial actualizado:', response);
            }),
            catchError((error) => {
                console.error('Error al actualizar el producto de historial:', error);
                return throwError(error);
            })
        );
    }

    deleteProduct(id: number): Observable<void> {
        console.log('Deleting historial product with ID:', id);
        return this._httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(
            tap(() => {
                console.log(`Producto de historial con id ${id} eliminado`);
            }),
            catchError((error) => {
                console.error('Error al eliminar el producto de historial:', error);
                return throwError(error);
            })
        );
    }

    getClinicas(): Observable<any[]> {
        console.log('Fetching clinicas (historial)');
        return this._httpClient.get<any[]>(`${this.baseUrl.replace('historialdeservicios', 'clinicas')}`).pipe(
            tap(response => {
                console.log('Received clinicas response:', response);
            }),
            catchError((error) => {
                console.error('Error al obtener clinicas (historial):', error);
                return throwError(error);
            })
        );
    }

    getClinicaById(id: number): Observable<any> {
        console.log('Fetching clinica by ID (historial):', id);
        return this._httpClient.get<any>(`${this.baseUrl.replace('historialdeservicios', 'clinicas')}/${id}`).pipe(
            tap(response => {
                console.log('Received clinica response:', response);
            }),
            catchError((error) => {
                console.error('Error al obtener la clinica (historial):', error);
                return throwError(error);
            })
        );
    }

    getServicios(): Observable<any[]> {
        console.log('Fetching servicios (historial)');
        return this._httpClient.get<any[]>(`${this.baseUrl.replace('historialdeservicios', 'servicios')}`).pipe(
            tap(response => {
                console.log('Received servicios response:', response);
            }),
            catchError((error) => {
                console.error('Error al obtener servicios (historial):', error);
                return throwError(error);
            })
        );
    }

    getServicioById(id: number): Observable<any> {
        console.log('Fetching servicio by ID (historial):', id);
        return this._httpClient.get<any>(`${this.baseUrl.replace('historialdeservicios', 'servicios')}/${id}`).pipe(
            tap(response => {
                console.log('Received servicio response:', response);
            }),
            catchError((error) => {
                console.error('Error al obtener servicio (historial):', error);
                return throwError(error);
            })
        );
    }
}
