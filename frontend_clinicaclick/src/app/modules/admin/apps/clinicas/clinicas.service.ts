import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Clinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { CreateClinicaResponse } from 'app/modules/admin/apps/clinicas/clinicas.types'; 
import { environment } from 'environments/environment';

@Injectable({providedIn: 'root'})
export class ClinicasService
{
    // URL base del API de usuario
      private baseUrl = `${environment.apiUrl}/clinicas`;

    // Private
    private _clinicas = new BehaviorSubject<Clinica[]>([]);
    private _clinica = new BehaviorSubject<Clinica | null>(null);
   
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for clinica
     */
    get clinica$(): Observable<Clinica>
    {
        return this._clinica.asObservable();
    }

    /**
     * Getter for clinicas
     */
    get clinicas$(): Observable<Clinica[]>
    {
        return this._clinicas.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get clinicas
     */
    getClinicas(): Observable<Clinica[]>
    {
        console.log('Solicitando todas las clinicas desde:', this.baseUrl);
        return this._httpClient.get<Clinica[]>(`${this.baseUrl}`).pipe(
            tap((clinicas) =>
            {
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
        return this._httpClient.get<Clinica[]>(`${this.baseUrl}/search`, { params: { query } }).pipe(
            tap((clinicas) => {
                this._clinicas.next(clinicas);
            }),
        );
    }

   

    /**
     * Get clinica by id
     */
    getClinicaById(id_clinica: string): Observable<Clinica>
    {
        console.log('Solicitando clinica con ID:', id_clinica);
        return this._httpClient.get<Clinica>(`${this.baseUrl}/${id_clinica}`).pipe(
            tap((clinica) => {
                this._clinica.next(clinica);
            })
        );
    }

    /**
     * Create clinica
     */

    createClinica(clinica: Clinica = {
        id_clinica: '',
        url_web: '',
        url_avatar: null,
        url_fondo: null,
        url_ficha_local: null,
        nombre_clinica: 'Nueva Clínica',
        fecha_creacion: new Date(),
        id_publicidad_meta: null,
        filtro_pc_meta: null,
        url_publicidad_meta: null,
        id_publicidad_google: null,
        filtro_pc_google: null,
        url_publicidad_google: null,
        servicios: '',
        checklist: '',
        estado_clinica: true,
        datos_fiscales_clinica: {
            denominacion_social: 'Nueva Clinica SL',
            cif_nif: 'B1234567H',
            direccion_facturacion: 'Calle Nueva Clínica'
        }
    }): Observable<CreateClinicaResponse> {
        return this._httpClient.post<CreateClinicaResponse>(`${this.baseUrl}`, clinica).pipe(
            tap(response => {
                if (response && response.clinica) {
                    const currentClinicas = this._clinicas.getValue();
                    this._clinicas.next([...currentClinicas, response.clinica]); // Añade el nuevo clinica a la lista actual
                }
            })
        );
    }
    
    


    /**
     * Update clinica
     */
    updateClinica(id_clinica: string, clinica: Clinica): Observable<Clinica> {
        return this._httpClient.patch<{message: string, clinica: Clinica}>(`${this.baseUrl}/${id_clinica}`, clinica).pipe(
            tap((response) => {
                const updatedClinica = response.clinica;
                const clinicas = this._clinicas.getValue() || [];
                const index = clinicas.findIndex(item => item.id_clinica === id_clinica);
                clinicas[index] = updatedClinica;
                this._clinicas.next(clinicas);
                this._clinica.next(updatedClinica);
            }),
            map(response => response.clinica)
        );
    }
    
    
    
    
    

    /**
     * Delete the clinica
     */
    deleteClinica(id_clinica: string): Observable<boolean>
    {
        return this._httpClient.delete<boolean>(`${this.baseUrl}/${id_clinica}`).pipe(
            map((isDeleted) => {
                if (isDeleted) {
                    const clinicas = this._clinicas.getValue() || [];
                    const index = clinicas.findIndex(item => item.id_clinica === id_clinica);
                    clinicas.splice(index, 1);
                    this._clinicas.next(clinicas);
                    this._clinica.next(null);
                }
                return isDeleted;
            })
        );
    }


   


    /**
     * Update the avatar of the given clinica
     *
     * @param id_clinica
     * @param avatar
     */
    uploadAvatar(id_clinica: string, avatar: File): Observable<Clinica> {
        const formData = new FormData();
        formData.append('avatar', avatar);
    
        return this._httpClient.post<Clinica>(`${this.baseUrl}/${id_clinica}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).pipe(
            tap((updatedClinica) => {
                const clinicas = this._clinicas.getValue() || [];
                const index = clinicas.findIndex(item => item.id_clinica === id_clinica);
                clinicas[index] = updatedClinica;
                this._clinicas.next(clinicas);
                this._clinica.next(updatedClinica);
            })
        );
    }

    
}
