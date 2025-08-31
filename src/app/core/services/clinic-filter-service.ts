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
  // Nombre del grupo seleccionado (opcional)
  private _selectedGroupName = new BehaviorSubject<string | null>(null);
  
  // Subject para el usuario actual
  private _currentUser = new BehaviorSubject<any>(null);
  
  // Subject para el rol seleccionado
  private _selectedRole = new BehaviorSubject<string>('');

  constructor() {
    // Inicializar desde localStorage si existe
    try {
      const saved = localStorage.getItem('selectedClinicId');
      if (saved) {
        this._selectedClinicId.next(saved);
      }
      const savedGroup = localStorage.getItem('selectedGroupName');
      if (savedGroup) {
        this._selectedGroupName.next(savedGroup);
      }
    } catch {}
  }

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

  /** Nombre del grupo seleccionado */
  get selectedGroupName$(): Observable<string | null> {
    return this._selectedGroupName.asObservable();
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
    try {
      if (clinicId) {
        localStorage.setItem('selectedClinicId', clinicId);
      } else {
        localStorage.removeItem('selectedClinicId');
      }
    } catch {}
    this._selectedClinicId.next(clinicId);
  }

  /**
   * Actualizar las clínicas filtradas por rol
   */
  setFilteredClinics(clinics: any[]): void {
    this._filteredClinics.next(clinics);
  }

  /** Establecer nombre del grupo seleccionado */
  setSelectedGroupName(name: string | null): void {
    try {
      if (name) localStorage.setItem('selectedGroupName', name);
      else localStorage.removeItem('selectedGroupName');
    } catch {}
    this._selectedGroupName.next(name);
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

  /** Obtener nombre de grupo actual */
  getCurrentSelectedGroupName(): string | null {
    return this._selectedGroupName.getValue();
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
