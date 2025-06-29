import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GroupClinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupsService {

  // Usamos la ruta en minúsculas para que coincida
  private baseUrl = `${environment.apiUrl}/pacientes`;

  constructor(private _httpClient: HttpClient) {}

  getAllGroups(): Observable<GroupClinica[]> {
    return this._httpClient.get<GroupClinica[]>(`${this.baseUrl}`);
  }

  createGroup(group: { nombre_grupo: string }): Observable<GroupClinica> {
    return this._httpClient.post<GroupClinica>(`${this.baseUrl}`, group);
  }

  updateGroup(id: string, group: { nombre_grupo: string }): Observable<GroupClinica> {
    return this._httpClient.patch<GroupClinica>(`${this.baseUrl}/${id}`, group);
  }

  deleteGroup(id: string): Observable<any> {
    return this._httpClient.delete(`${this.baseUrl}/${id}`);
  }
}
