import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Paciente } from './pacientes.types';
import { environment } from 'environments/environment';
import { ClinicFilterService } from 'app/core/services/clinic-filter-service';


@Injectable({ providedIn: 'root' })
export class PacientesService {
  private baseUrl = `${environment.apiUrl}/pacientes`;
  private _pacientes = new BehaviorSubject<Paciente[]>([]);
  private _paciente = new BehaviorSubject<Paciente | null>(null);

  // ✅ MANTENER BEHAVIORSUBJECTS PARA COMPATIBILIDAD
  // Estos se mantienen para que el código existente siga funcionando
  public selectedClinicId$ = new BehaviorSubject<string | null>(null);
  public filteredClinics$ = new BehaviorSubject<any[]>([]);

  constructor(
    private _httpClient: HttpClient,
    private _clinicFilterService: ClinicFilterService
  ) {
    // ✅ SINCRONIZAR CON EL SERVICIO CENTRALIZADO
    // Cuando el servicio centralizado cambie, actualizar los BehaviorSubjects locales
    this._clinicFilterService.selectedClinicId$.subscribe(value => {
      this.selectedClinicId$.next(value);
    });
    
    this._clinicFilterService.filteredClinics$.subscribe(value => {
      this.filteredClinics$.next(value);
    });
  }

  get pacientes$(): Observable<Paciente[]> {
    return this._pacientes.asObservable();
  }

  get paciente$(): Observable<Paciente | null> {
    return this._paciente.asObservable();
  }

  getPacientes(clinicId?: string | null): Observable<Paciente[]> {
    const params: any = {};
    if (clinicId && clinicId !== 'all') {
      params.clinica_id = clinicId;
      return this._httpClient.get<Paciente[]>(this.baseUrl, { params }).pipe(
        tap((pacientes) => this._pacientes.next(pacientes))
      );
    } else if (clinicId === 'all') {
      // Todas las clínicas: pedir todos (acceso según rol)
      return this._httpClient.get<Paciente[]>(this.baseUrl).pipe(
        tap((pacientes) => this._pacientes.next(pacientes))
      );
    } else {
      // Estado inicial sin selección explícita: no pedir nada
      this._pacientes.next([]);
      return this._pacientes.asObservable();
    }
  }

  searchPacientes(query: string): Observable<Paciente[]> {
    const clinicFilter = this._clinicFilterService.getCurrentClinicFilter();
    const params: any = { query };
    if (clinicFilter) {
      params.clinica_id = clinicFilter;
    }
    return this._httpClient.get<Paciente[]>(`${this.baseUrl}/search`, { params }).pipe(
      tap((pacientes) => this._pacientes.next(pacientes))
    );
  }

  getPacienteById(id: string): Observable<Paciente> {
    return this._httpClient.get<Paciente>(`${this.baseUrl}/${id}`).pipe(
      tap((paciente) => this._paciente.next(paciente))
    );
  }

  createPaciente(data: Partial<Paciente>): Observable<any> {
    return this._httpClient.post<any>(this.baseUrl, data).pipe(
      tap(() => this.getPacientes().subscribe())
    );
  }

  updatePaciente(id: string, data: Partial<Paciente>): Observable<Paciente> {
    return this._httpClient.patch<{ paciente: Paciente }>(`${this.baseUrl}/${id}`, data).pipe(
      map((resp) => resp.paciente),
      tap((paciente) => {
        const current = this._pacientes.value;
        const index = current.findIndex((p) => p.id_paciente === id);
        if (index !== -1) {
          current[index] = paciente;
          this._pacientes.next(current);
        }
        this._paciente.next(paciente);
      })
    );
  }

  deletePaciente(id: string): Observable<any> {
    return this._httpClient.delete<any>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const current = this._pacientes.value;
        const index = current.findIndex((p) => p.id_paciente === id);
        if (index !== -1) {
          current.splice(index, 1);
          this._pacientes.next(current);
        }
        this._paciente.next(null);
      })
    );
  }
}
