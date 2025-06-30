import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClinicFilterService {
  
  // Subject para el filtro de clínica seleccionado (IDs separados por coma o null para todas)
  private _selectedClinicId = new BehaviorSubject<string | null>(null);
  
  // Subject para la lista de clínicas filtradas por rol (para desplegables)
  private _filteredClinics = new BehaviorSubject<any[]>([]);
  
  // Subject para el usuario actual
  private _currentUser = new BehaviorSubject<any>(null);
  
  // Subject para el rol seleccionado
  private _selectedRole = new BehaviorSubject<string>('');

  constructor() {}

  // ✅ GETTERS PARA OBSERVABLES
  
  /**
   * Observable del filtro de clínica actual
   * - null: mostrar datos de todas las clínicas del rol
   * - string: IDs de clínicas separados por coma (ej: "1,2,3")
   */
  get selectedClinicId$(): Observable<string | null> {
    return this._selectedClinicId.asObservable();
  }

  /**
   * Observable de las clínicas filtradas por rol (para desplegables)
   */
  get filteredClinics$(): Observable<any[]> {
    return this._filteredClinics.asObservable();
  }

  /**
   * Observable del usuario actual
   */
  get currentUser$(): Observable<any> {
    return this._currentUser.asObservable();
  }

  /**
   * Observable del rol seleccionado
   */
  get selectedRole$(): Observable<string> {
    return this._selectedRole.asObservable();
  }

  // ✅ MÉTODOS PARA ACTUALIZAR FILTROS

  /**
   * Actualizar el filtro de clínica seleccionado
   */
  setSelectedClinicId(clinicId: string | null): void {
    this._selectedClinicId.next(clinicId);
  }

  /**
   * Actualizar las clínicas filtradas por rol
   */
  setFilteredClinics(clinics: any[]): void {
    this._filteredClinics.next(clinics);
  }

  /**
   * Actualizar el usuario actual
   */
  setCurrentUser(user: any): void {
    this._currentUser.next(user);
  }

  /**
   * Actualizar el rol seleccionado
   */
  setSelectedRole(role: string): void {
    this._selectedRole.next(role);
  }

  // ✅ MÉTODOS DE UTILIDAD

  /**
   * Obtener el valor actual del filtro de clínica
   */
  getCurrentClinicFilter(): string | null {
    return this._selectedClinicId.getValue();
  }

  /**
   * Obtener las clínicas filtradas actuales
   */
  getCurrentFilteredClinics(): any[] {
    return this._filteredClinics.getValue();
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): any {
    return this._currentUser.getValue();
  }

  /**
   * Obtener el rol actual
   */
  getCurrentRole(): string {
    return this._selectedRole.getValue();
  }

  /**
   * Verificar si el usuario actual es administrador
   */
  isCurrentUserAdmin(): boolean {
    const user = this.getCurrentUser();
    const adminIds = [1]; // IDs de administradores
    return user && adminIds.includes(user.id_usuario);
  }

  /**
   * Generar parámetros de consulta para APIs que incluyen el filtro de clínica
   */
  getApiParams(additionalParams: any = {}): any {
    const params = { ...additionalParams };
    const clinicFilter = this.getCurrentClinicFilter();
    
    if (clinicFilter) {
      params.clinica_id = clinicFilter;
    }
    
    return params;
  }
}

