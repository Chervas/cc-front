import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Clinica, CreateClinicaResponse, UpdateClinicaResponse } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class ClinicasService {
    // Private
    private _clinica: BehaviorSubject<Clinica | null> = new BehaviorSubject(null);
    private _clinicas: BehaviorSubject<Clinica[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for clinica
     */
    get clinica$(): Observable<Clinica> {
        return this._clinica.asObservable();
    }

    /**
     * Getter for clinicas
     */
    get clinicas$(): Observable<Clinica[]> {
        return this._clinicas.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get clinicas
     */
    getClinicas(): Observable<Clinica[]> {
        return this._httpClient.get<Clinica[]>(`${environment.apiUrl}/clinicas`).pipe(
            tap((clinicas) => {
                this._clinicas.next(clinicas);
            }),
        );
    }

    /**
     * Search clinicas with given query
     *
     * @param query
     */
    searchClinicas(query: string): Observable<Clinica[]> {
        return this._httpClient.get<Clinica[]>(`${environment.apiUrl}/clinicas/search`, {
            params: { query },
        }).pipe(
            tap((clinicas) => {
                this._clinicas.next(clinicas);
            }),
        );
    }

    /**
     * Get clinica by id
     */
    getClinicaById(id: string): Observable<Clinica> {
        return this._clinicas.pipe(
            take(1),
            map((clinicas) => {
                // Find the clinica
                const clinica = clinicas?.find(item => item.id_clinica === id) || null;

                // Update the clinica
                this._clinica.next(clinica);

                // Return the clinica
                return clinica;
            }),
            switchMap((clinica) => {
                if (!clinica) {
                    return this._httpClient.get<Clinica>(`${environment.apiUrl}/clinicas/${id}`).pipe(
                        tap((response) => {
                            this._clinica.next(response);
                        }),
                    );
                }

                return of(clinica);
            }),
        );
    }

    /**
     * Create clinica
     */
    createClinica(clinica: Partial<Clinica>): Observable<CreateClinicaResponse> {
        return this.clinicas$.pipe(
            take(1),
            switchMap(clinicas => this._httpClient.post<CreateClinicaResponse>(`${environment.apiUrl}/clinicas`, clinica).pipe(
                map((response) => {
                    // Update the clinicas with the new clinica
                    this._clinicas.next([response.clinica, ...clinicas]);

                    // Return the response
                    return response;
                })
            ))
        );
    }

    /**
     * ✅ MÉTODO UPDATECLINICA - ESTE ERA EL QUE FALTABA
     */
    updateClinica(id: string, clinica: Partial<Clinica>): Observable<Clinica> {
        console.log('🚀 SERVICIO: Enviando petición PATCH a:', `${environment.apiUrl}/clinicas/${id}`);
        console.log('📦 SERVICIO: Datos a enviar:', clinica);
        
        return this._httpClient.patch<Clinica>(`${environment.apiUrl}/clinicas/${id}`, clinica).pipe(
            tap((updatedClinica) => {
                console.log('✅ SERVICIO: Respuesta recibida del servidor:', updatedClinica);
                
                // Update the clinica in the store
                this._clinica.next(updatedClinica);

                // Update the clinica in the clinicas list
                this.clinicas$.pipe(take(1)).subscribe(clinicas => {
                    if (clinicas) {
                        const index = clinicas.findIndex(item => item.id_clinica === id);
                        if (index !== -1) {
                            clinicas[index] = updatedClinica;
                            this._clinicas.next(clinicas);
                        }
                    }
                });
            }),
            tap({
                error: (error) => {
                    console.error('❌ SERVICIO: Error en la petición:', error);
                }
            })
        );
    }

    /**
     * Delete the clinica
     */
    deleteClinica(id: string): Observable<boolean> {
        return this.clinicas$.pipe(
            take(1),
            switchMap(clinicas => this._httpClient.delete(`${environment.apiUrl}/clinicas/${id}`).pipe(
                map((isDeleted: any) => {
                    // Find the index of the deleted clinica
                    const index = clinicas.findIndex(item => item.id_clinica === id);

                    // Delete the clinica
                    clinicas.splice(index, 1);

                    // Update the clinicas
                    this._clinicas.next(clinicas);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }

    /**
     * Add servicio to clinica
     */
    addServicioToClinica(id_clinica: string, id_servicio: string): Observable<any> {
        return this._httpClient.post(`${environment.apiUrl}/clinicas/add-servicio`, {
            id_clinica,
            id_servicio
        });
    }

    /**
     * Get servicios by clinica
     */
    getServiciosByClinica(id_clinica: string): Observable<any[]> {
        return this._httpClient.get<any[]>(`${environment.apiUrl}/clinicas/${id_clinica}/servicios`);
    }

    /**
     * ✅ MÉTODO HELPER: Get headers (opcional, para debug)
     */
    getHeaders(): any {
        return this._httpClient['defaultOptions']?.headers || 'No headers available';
    }

        /**
     * Upload avatar (placeholder)
     */
    uploadAvatar(id: string, file: File): Observable<any> {
        console.log('Upload avatar no implementado aún');
        return of({ message: 'Upload no implementado' });
    }

}


