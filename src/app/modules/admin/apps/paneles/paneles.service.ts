import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map, forkJoin } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PanelesService {
  private _data: BehaviorSubject<any> = new BehaviorSubject(null);
  private _metricas: BehaviorSubject<any> = new BehaviorSubject(null);

  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient) {
    // Initialize with mock data
    this._data.next(this._getMockData());
  }

  // --------------------------------------------
  // @ Accessors
  // --------------------------------------------

  /**
   * Getter for data
   */
  get data$(): Observable<any> {
    return this._data.asObservable();
  }

  /**
   * Getter for metricas
   */
  get metricas$(): Observable<any> {
    return this._metricas.asObservable();
  }

  // --------------------------------------------
  // @ Public methods
  // --------------------------------------------

  /**
   * Get data
   */
  getData(): Observable<any> {
    // For now, return mock data
    // Later you can uncomment the HTTP call
    // return this._httpClient.get('api/dashboards/project').pipe(
    //     tap((response: any) => {
    //         this._data.next(response);
    //     }),
    // );

    this._data.next(this._getMockData());
    return this._data.asObservable();
  }

  // --------------------------------------------
  // NUEVOS MÉTODOS PARA MÉTRICAS
  // --------------------------------------------

  /**
   * Obtener métricas de redes sociales por clínica
   */
  getMetricasByClinica(clinicaId: number | string, startDate?: string, endDate?: string): Observable<any> {
    // Construir parámetros de consulta
    let params = '';
    if (startDate || endDate) {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      params = `?${queryParams.toString()}`;
    }

    // Si clinicaId es CSV, realizar múltiples peticiones y agregar
    if (typeof clinicaId === 'string' && clinicaId.includes(',')) {
      const ids = clinicaId.split(',').map(id => id.trim()).filter(Boolean);
      const requests = ids.map(id => {
        const url = `${environment.apiUrl}/paneles/metricas/redes-sociales?idClinica=${id}${params ? '&' + params.substring(1) : ''}`;
        return this._httpClient.get(url);
      });

      return forkJoin(requests).pipe(
        map((responses: any[]) => {
          // Intentar agregar estructuras típicas { data: { resumen, platforms, ... } }
          const acc: any = { group: true, clinicasIncluidas: ids, agregado: {} };
          const unwrap = (r: any) => (r?.data ?? r);
          const unwrapped = responses.map(unwrap);
          if (unwrapped.length === 0) return acc;

          // Tomar base del primero y sumar numéricos conocidos
          const base = JSON.parse(JSON.stringify(unwrapped[0]));
          // Agregar resumen
          if (base.resumen) {
            ['totalImpressions','totalReach','totalProfileVisits','totalFollowers'].forEach(k => {
              base.resumen[k] = unwrapped.reduce((s, u) => s + (u.resumen?.[k] || 0), 0);
            });
          }
          // Agregar por plataforma si existen
          if (base.platforms) {
            Object.keys(base.platforms).forEach(p => {
              if (!base.platforms[p]?.metricas) return;
              const keys = Object.keys(base.platforms[p].metricas);
              keys.forEach(k => {
                base.platforms[p].metricas[k] = unwrapped.reduce((s, u) => s + (u.platforms?.[p]?.metricas?.[k] || 0), 0);
              });
            });
          }
          acc.agregado = base;
          return acc;
        }),
        tap((agg: any) => {
          console.log('📊 Métricas agregadas (grupo):', agg);
          const metricas = agg?.agregado || agg;
          this._metricas.next(metricas);
        })
      );
    }

    // Caso normal: clínica única
    const url = `${environment.apiUrl}/paneles/metricas/redes-sociales?idClinica=${clinicaId}${params ? '&' + params.substring(1) : ''}`;
    return this._httpClient.get(url).pipe(
      tap((response: any) => {
        console.log('📊 Respuesta del backend:', response);
        const metricas = response?.data ?? response;
        console.log('📊 Métricas finales:', metricas);
        this._metricas.next(metricas);
      })
    );
  }

  /**
   * Obtener métricas en tiempo real (para dashboard)
   */
  getMetricasResumen(clinicaId: number): Observable<any> {
    // Obtener métricas de los últimos 7 días
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    return this.getMetricasByClinica(
      clinicaId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }

  /**
   * Obtener métricas históricas (para gráficos)
   */
  getMetricasHistoricas(clinicaId: number, dias: number = 30): Observable<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - dias);

    return this.getMetricasByClinica(
      clinicaId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ).pipe(
      map((response: any) => {
        const metricas = response?.data ?? response;
        const result: Record<string, { fecha: string; seguidores: number }[]> = {};

        Object.keys(metricas || {}).forEach((red) => {
          const historico = metricas[red]?.historico || [];
          result[red] = historico.map((item: any) => ({
            fecha: item.fecha,
            seguidores: item.seguidores,
          }));
        });

        return result;
      })
    );
  }

  /**
   * Refrescar métricas (para botón de actualizar)
   */
  refreshMetricas(clinicaId: number): Observable<any> {
    return this.getMetricasResumen(clinicaId);
  }

  /**
   * Limpiar datos de métricas
   */
  clearMetricas(): void {
    this._metricas.next(null);
  }

  // --------------------------------------------
  // @ Private methods
  // --------------------------------------------

  /**
   * Get mock data
   */
  private _getMockData(): any {
    return {
      summary: {
        budget: 32000,
        spent: 18600,
        remaining: 13400,
        completed: 68
      },
      githubIssues: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        series: [
          {
            name: 'New issues',
            type: 'line',
            data: [42, 28, 43, 34, 20, 25, 22, 28, 20]
          },
          {
            name: 'Closed issues',
            type: 'column',
            data: [11, 10, 8, 11, 8, 10, 17, 9, 7]
          }
        ]
      },
      taskDistribution: {
        labels: ['Frontend', 'Backend', 'API', 'Issues'],
        series: [15, 20, 38, 27]
      },
      budgetDistribution: {
        categories: ['Concept', 'Design', 'Development', 'Testing', 'Marketing', 'Maintenance'],
        series: [
          {
            name: 'Budget Distribution',
            data: [83, 73, 62, 84, 67, 79]
          }
        ]
      },
      weeklyExpenses: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        series: [
          {
            name: 'Expenses',
            data: [37, 32, 39, 27, 18, 24, 20]
          }
        ]
      },
      monthlyExpenses: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        series: [
          {
            name: 'Expenses',
            data: [2100, 1800, 2800, 2200, 2600, 3000]
          }
        ]
      },
      yearlyExpenses: {
        labels: ['2019', '2020', '2021', '2022', '2023'],
        series: [
          {
            name: 'Expenses',
            data: [25000, 24000, 32000, 28000, 26000]
          }
        ]
      }
    };
  }
}
