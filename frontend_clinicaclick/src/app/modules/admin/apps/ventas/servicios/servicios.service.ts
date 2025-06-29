import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ServiciosPagination, ServiciosProduct } from 'app/modules/admin/apps/ventas/servicios/servicios.types';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, take, tap, map, filter } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
    // URL base del API de servicios
    private baseUrl = `${environment.apiUrl}/servicios`; // Ajusta la dirección IP o URL según corresponda

    // Private
    private _pagination: BehaviorSubject<ServiciosPagination | null> = new BehaviorSubject(null);
    private _product: BehaviorSubject<ServiciosProduct | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<ServiciosProduct[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) { }

    // Accessors

    /**
     * Getter para pagination (paginación)
     */
    get pagination$(): Observable<ServiciosPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter para product (producto)
     */
    get product$(): Observable<ServiciosProduct> {
        return this._product.asObservable();
    }

    /**
     * Getter para products (productos)
     */
    get products$(): Observable<ServiciosProduct[]> {
        return this._products.asObservable();
    }

    // Public methods

    /**
     * Obtener todos los servicios
     */
    getProducts(page: number = 0, size: number = 10, sort: string = 'nombre_servicio', order: 'asc' | 'desc' | '' = 'asc', search: string = ''):
        Observable<{ pagination: ServiciosPagination; products: ServiciosProduct[] }> {
        return this._httpClient.get<{ pagination: ServiciosPagination; products: ServiciosProduct[] }>(`${this.baseUrl}/products`, {
            params: {
                page: '' + page,
                size: '' + size,
                sort,
                order,
                search,
            },
        }).pipe(
            tap(response => {
                this._pagination.next(response.pagination);
                this._products.next(response.products);
            }),
        );
    }

    /**
     * Obtener producto por ID
     */
    getProductById(id: number): Observable<ServiciosProduct> {
        return this._products.pipe(
            take(1),
            map(products => {
                // Encontrar el producto
                const product = products.find(item => item.id_servicio === id) || null;

                // Actualizar el producto
                this._product.next(product);

                // Devolver el producto
                return product;
            }),
            switchMap(product => {
                if (!product) {
                    return new Observable<ServiciosProduct>((subscriber) => {
                        subscriber.error('Could not found product with id of ' + id + '!');
                    });
                }

                return new Observable<ServiciosProduct>((subscriber) => {
                    subscriber.next(product);
                });
            }),
        );
    }

    /**
     * Crear un nuevo servicio
     */
    createProduct(product: ServiciosProduct): Observable<ServiciosProduct> {
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<ServiciosProduct>(`${this.baseUrl}`, product).pipe(
                map(newProduct => {
                    // Actualizar los productos con el nuevo producto
                    this._products.next([newProduct, ...products]);

                    // Devolver el nuevo producto
                    return newProduct;
                }),
            )),
        );
    }

    /**
     * Actualizar un servicio
     */
    updateProduct(id: number, product: ServiciosProduct): Observable<ServiciosProduct> {
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.patch<ServiciosProduct>(`${this.baseUrl}/${id}`, product).pipe(
                map(updatedProduct => {
                    // Encontrar el índice del producto actualizado
                    const index = products.findIndex(item => item.id_servicio === id);

                    // Actualizar el producto
                    products[index] = updatedProduct;

                    // Actualizar los productos
                    this._products.next(products);

                    // Devolver el producto actualizado
                    return updatedProduct;
                }),
                switchMap(updatedProduct => this.product$.pipe(
                    take(1),
                    filter(item => item && item.id_servicio === id),
                    tap(() => {
                        // Actualizar el producto si está seleccionado
                        this._product.next(updatedProduct);

                        // Devolver el producto actualizado
                        return updatedProduct;
                    }),
                )),
            )),
        );
    }

    /**
     * Eliminar un servicio
     */
    deleteProduct(id: number): Observable<boolean> {
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete(`${this.baseUrl}/${id}`).pipe(
                map((isDeleted: boolean) => {
                    // Encontrar el índice del producto eliminado
                    const index = products.findIndex(item => item.id_servicio === id);

                    // Eliminar el producto
                    products.splice(index, 1);

                    // Actualizar los productos
                    this._products.next(products);

                    // Devolver el estado de eliminación
                    return isDeleted;
                }),
            )),
        );
    }
}
