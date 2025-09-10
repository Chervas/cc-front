import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, catchError, switchMap, startWith } from 'rxjs/operators';
import { of } from 'rxjs';

export interface JobStatus {
  schedule: string;
  status: string;
  lastExecution: string | null;
  lastError: string | null;
}

export interface JobsSystemStatus {
  systemRunning: boolean;
  systemInitialized: boolean;
  jobsCount: number;
  jobs: { [key: string]: JobStatus };
  todayStats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  };
  recentLogs: JobLog[];
}

export interface JobLog {
  id?: number;
  jobType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
  errorMessage: string | null;
  createdAt?: string;
}

export interface JobStatistics {
  period: string;
  summary: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: string;
  };
  jobTypeStats: Array<{
    jobType: string;
    executions: number;
    avgDurationSeconds: string | null;
  }>;
  dailyTrend: Array<{
    date: string;
    executions: number;
    successful: number;
  }>;
}

export interface JobConfiguration {
  schedules: { [key: string]: string };
  timezone: string;
  autoStart: boolean;
  dataRetention: {
    syncLogs: number;
    tokenValidations: number;
    socialStats: number;
  };
  retries: {
    maxAttempts: number;
    delayMs: number;
  };
}

export interface MetaUsageStatus {
  usagePct: number;
  nextAllowedAt: number;
  now: number;
  waiting: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JobsMonitoringService {
  private readonly baseUrl = 'https://crm.clinicaclick.com/api/metasync/jobs';
  private _systemStatus$ = new BehaviorSubject<JobsSystemStatus | null>(null);
  private _isLoading$ = new BehaviorSubject<boolean>(false);
  private _error$ = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public readonly systemStatus$ = this._systemStatus$.asObservable();
  public readonly isLoading$ = this._isLoading$.asObservable();
  public readonly error$ = this._error$.asObservable();

  constructor(private http: HttpClient) {
    // Iniciar polling automático cada 30 segundos
    this.startAutoRefresh();
  }

  /**
   * Uso actual de la API de Meta (para gauge)
   */
  getMetaUsageStatus(): Observable<MetaUsageStatus | null> {
    return this.http.get<MetaUsageStatus>(`${this.baseUrl}/usage/meta`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Tail del log de una ejecución (o log general por env)
   */
  tailSyncLog(id: number | null, lines: number = 400, important: boolean = true): Observable<{filePath: string; lines: number; items: {level: string; line: string}[]} | null> {
    const lid = id ?? 0;
    const qs = `lines=${lines}${important ? '&filter=important' : ''}`;
    return this.http.get<any>(`${this.baseUrl}/sync-logs/${lid}/tail?${qs}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener headers con token de autorización
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Manejar errores de HTTP
   */
  private handleError(error: any): Observable<any> {
    console.error('❌ Error en JobsMonitoringService:', error);
    
    let errorMessage = 'Error desconocido';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    this._error$.next(errorMessage);
    this._isLoading$.next(false);
    
    return of(null);
  }

  /**
   * Iniciar actualización automática del estado
   */
  private startAutoRefresh(): void {
    // Cargar estado inicial
    this.refreshSystemStatus();

    // Actualizar cada 30 segundos
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.getSystemStatus())
    ).subscribe();
  }

  /**
   * Obtener estado actual del sistema de jobs
   */
  getSystemStatus(): Observable<JobsSystemStatus | null> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.get<JobsSystemStatus>(`${this.baseUrl}/status`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._systemStatus$.next(response);
        this._isLoading$.next(false);
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Refrescar estado del sistema manualmente
   */
  refreshSystemStatus(): void {
    this.getSystemStatus().subscribe();
  }

  /**
   * Inicializar sistema de jobs
   */
  initializeJobs(): Observable<any> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.post(`${this.baseUrl}/initialize`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        // Refrescar estado después de inicializar
        this.refreshSystemStatus();
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Iniciar todos los jobs
   */
  startJobs(): Observable<any> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.post(`${this.baseUrl}/start`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        this.refreshSystemStatus();
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Detener todos los jobs
   */
  stopJobs(): Observable<any> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.post(`${this.baseUrl}/stop`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        this.refreshSystemStatus();
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Reiniciar sistema de jobs
   */
  restartJobs(): Observable<any> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.post(`${this.baseUrl}/restart`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        this.refreshSystemStatus();
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Ejecutar un job específico manualmente
   */
  runJob(jobName: string): Observable<any> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.post(`${this.baseUrl}/run/${jobName}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        // Refrescar estado después de ejecutar job
        setTimeout(() => this.refreshSystemStatus(), 1000);
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Lanzar sincronización por clínica (rango)
   */
  runClinicSync(clinicaId: number, startDate?: string, endDate?: string): Observable<any> {
    const body: any = {};
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;
    return this.http.post(`https://crm.clinicaclick.com/api/metasync/clinica/${clinicaId}/sync`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(resp => resp),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener logs de ejecución con filtros
   */
  getJobsLogs(params: {
    page?: number;
    limit?: number;
    status?: string;
    jobType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<{
    logs: JobLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  } | null> {
    this._isLoading$.next(true);
    this._error$.next(null);

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}/logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return this.http.get<any>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener estadísticas de rendimiento
   */
  getJobsStatistics(period: string = '24h'): Observable<JobStatistics | null> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.get<JobStatistics>(`${this.baseUrl}/statistics?period=${period}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener configuración actual del sistema
   */
  getJobsConfiguration(): Observable<{
    configuration: JobConfiguration;
    systemStatus: {
      initialized: boolean;
      running: boolean;
      jobsCount: number;
    };
  } | null> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.get<any>(`${this.baseUrl}/configuration`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtener próximas ejecuciones programadas
   */
  getNextExecutions(): Observable<{
    nextExecutions: { [key: string]: {
      schedule: string;
      description: string;
      timezone: string;
    } };
    currentTime: string;
    timezone: string;
  } | null> {
    this._isLoading$.next(true);
    this._error$.next(null);

    return this.http.get<any>(`${this.baseUrl}/next-executions`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        this._isLoading$.next(false);
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Limpiar error actual
   */
  clearError(): void {
    this._error$.next(null);
  }

  /**
   * Obtener estado actual del sistema (valor actual)
   */
  getCurrentSystemStatus(): JobsSystemStatus | null {
    return this._systemStatus$.value;
  }

  /**
   * Verificar si el sistema está funcionando
   */
  isSystemHealthy(): boolean {
    const status = this.getCurrentSystemStatus();
    return status?.systemRunning && status?.systemInitialized || false;
  }

  /**
   * Obtener resumen de estado para mostrar en UI
   */
  getStatusSummary(): {
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    message: string;
    details: string;
  } {
    const systemStatus = this.getCurrentSystemStatus();
    
    if (!systemStatus) {
      return {
        status: 'unknown',
        message: 'Estado desconocido',
        details: 'No se ha podido obtener el estado del sistema'
      };
    }

    if (!systemStatus.systemInitialized) {
      return {
        status: 'error',
        message: 'Sistema no inicializado',
        details: 'El sistema de jobs cron no ha sido inicializado'
      };
    }

    if (!systemStatus.systemRunning) {
      return {
        status: 'warning',
        message: 'Sistema detenido',
        details: 'El sistema está inicializado pero los jobs no están ejecutándose'
      };
    }

    const { todayStats } = systemStatus;
    const successRate = todayStats.totalExecutions > 0 
      ? (todayStats.successfulExecutions / todayStats.totalExecutions) * 100 
      : 100;

    if (successRate < 80) {
      return {
        status: 'warning',
        message: 'Rendimiento degradado',
        details: `Tasa de éxito: ${successRate.toFixed(1)}% (${todayStats.successfulExecutions}/${todayStats.totalExecutions})`
      };
    }

    return {
      status: 'healthy',
      message: 'Sistema operativo',
      details: `${systemStatus.jobsCount} jobs activos, ${todayStats.totalExecutions} ejecuciones hoy`
    };
  }
}
