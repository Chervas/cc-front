import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Clinica, ClinicaFormData, CreateClinicaResponse, UpdateClinicaResponse } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({providedIn: 'root'})
export class ClinicasService
{
    // URL base del API de clínicas
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
                // ✅ CORRECCIÓN: Actualizar el BehaviorSubject con la clínica cargada
                this._clinica.next(clinica);
            })
        );
    }

    /**
     * Create clinica
     */
    createClinica(clinica: Partial<Clinica> = {}): Observable<Clinica>
    {
        const defaultClinica: Partial<Clinica> = {
            nombre_clinica: 'Nueva Clínica',
            url_web: '',
            servicios: '',
            estado_clinica: true,
            ...clinica
        };

        return this._httpClient.post<CreateClinicaResponse>(`${this.baseUrl}`, defaultClinica).pipe(
            map(response => response.clinica),
            tap((newClinica) => {
                // Agregar la nueva clínica a la lista
                const currentClinicas = this._clinicas.value;
                this._clinicas.next([newClinica, ...currentClinicas]);
                
                // Establecer como clínica seleccionada
                this._clinica.next(newClinica);
            })
        );
    }

    /**
     * ✅ CORRECCIÓN: Update clinica con mejor manejo de errores
     */
    updateClinica(id_clinica: string, clinicaData: ClinicaFormData): Observable<Clinica>
    {
        console.log('Actualizando clínica:', id_clinica, clinicaData);
        
        // ✅ CORRECCIÓN: Asegurar que el ID sea string
        const clinicaId = String(id_clinica);
        
        return this._httpClient.patch<UpdateClinicaResponse>(`${this.baseUrl}/${clinicaId}`, clinicaData).pipe(
            map(response => {
                console.log('Respuesta del servidor:', response);
                return response.clinica;
            }),
            tap((updatedClinica) => {
                console.log('Clínica actualizada:', updatedClinica);
                
                // ✅ CORRECCIÓN: Actualizar la clínica en la lista
                const currentClinicas = this._clinicas.value;
                const index = currentClinicas.findIndex(c => String(c.id_clinica) === clinicaId);
                if (index !== -1) {
                    currentClinicas[index] = updatedClinica;
                    this._clinicas.next([...currentClinicas]);
                    console.log('Lista de clínicas actualizada');
                }
                
                // ✅ CORRECCIÓN: Actualizar la clínica seleccionada
                this._clinica.next(updatedClinica);
                console.log('Clínica seleccionada actualizada');
            })
        );
    }

    /**
     * Delete clinica
     */
    deleteClinica(id_clinica: string): Observable<boolean>
    {
        return this._httpClient.delete(`${this.baseUrl}/${id_clinica}`).pipe(
            tap(() => {
                // Remover la clínica de la lista
                const currentClinicas = this._clinicas.value;
                const updatedClinicas = currentClinicas.filter(c => c.id_clinica !== id_clinica);
                this._clinicas.next(updatedClinicas);
                
                // Limpiar la clínica seleccionada si es la que se eliminó
                if (this._clinica.value?.id_clinica === id_clinica) {
                    this._clinica.next(null);
                }
            }),
            map(() => true)
        );
    }

    /**
     * Upload avatar
     */
    uploadAvatar(id_clinica: string, avatar: File): Observable<Clinica>
    {
        const formData = new FormData();
        formData.append('avatar', avatar);

        return this._httpClient.post<UpdateClinicaResponse>(`${this.baseUrl}/${id_clinica}/avatar`, formData).pipe(
            map(response => response.clinica),
            tap((updatedClinica) => {
                // Actualizar la clínica en la lista
                const currentClinicas = this._clinicas.value;
                const index = currentClinicas.findIndex(c => c.id_clinica === id_clinica);
                if (index !== -1) {
                    currentClinicas[index] = updatedClinica;
                    this._clinicas.next([...currentClinicas]);
                }
                
                // Actualizar la clínica seleccionada
                this._clinica.next(updatedClinica);
            })
        );
    }
}

