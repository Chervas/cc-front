import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HasRoleDirective } from 'app/modules/admin/apps/roles/shared/has-role.directive';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { 
  JobsMonitoringService, 
  JobsSystemStatus, 
  JobLog, 
  JobStatistics,
  JobConfiguration 
} from './jobs-monitoring.service';

@Component({
  selector: 'app-jobs-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTooltipModule,
    MatSnackBarModule,
    HasRoleDirective
  ],
  templateUrl: './jobs-monitoring.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsMonitoringComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  // Estado del sistema
  systemStatus: JobsSystemStatus | null = null;
  isLoading = false;
  error: string | null = null;

  // Datos para tabs
  jobsLogs: JobLog[] = [];
  jobsStatistics: JobStatistics | null = null;
  jobsConfiguration: any = null;
  nextExecutions: any = null;

  // Configuración de tabla de logs
  logsDisplayedColumns: string[] = ['jobType', 'status', 'startedAt', 'duration', 'recordsProcessed', 'actions'];
  logsPageSize = 10;
  logsCurrentPage = 0;
  logsTotalItems = 0;

  // Formulario de filtros para logs
  logsFilterForm = new FormGroup({
    status: new FormControl(''),
    jobType: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl('')
  });

  // Opciones para filtros
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'completed', label: 'Completado' },
    { value: 'failed', label: 'Fallido' },
    { value: 'running', label: 'Ejecutándose' }
  ];

  jobTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'metricsSync', label: 'Sincronización de Métricas' },
    { value: 'tokenValidation', label: 'Validación de Tokens' },
    { value: 'dataCleanup', label: 'Limpieza de Datos' },
    { value: 'healthCheck', label: 'Verificación de Salud' },
    { value: 'manual_job_execution', label: 'Ejecución Manual' }
  ];

  constructor(
    private jobsService: JobsMonitoringService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  private initializeComponent(): void {
    // Configurar formulario de filtros
    this.logsFilterForm.valueChanges.pipe(
      takeUntil(this._unsubscribeAll)
    ).subscribe(() => {
      this.loadJobsLogs();
    });
  }

  private setupSubscriptions(): void {
    // Suscribirse a cambios en el estado del sistema
    combineLatest([
      this.jobsService.systemStatus$,
      this.jobsService.isLoading$,
      this.jobsService.error$
    ]).pipe(
      takeUntil(this._unsubscribeAll)
    ).subscribe(([systemStatus, isLoading, error]) => {
      this.systemStatus = systemStatus;
      this.isLoading = isLoading;
      this.error = error;
      this.cdr.markForCheck();

      if (error) {
        this.showError(error);
      }
    });
  }

  private loadInitialData(): void {
    // Cargar datos iniciales
    this.refreshSystemStatus();
    this.loadJobsLogs();
    this.loadJobsStatistics();
    this.loadJobsConfiguration();
    this.loadNextExecutions();
  }

  /**
   * Refrescar estado del sistema
   */
  refreshSystemStatus(): void {
    this.jobsService.refreshSystemStatus();
  }

  /**
   * Inicializar sistema de jobs
   */
  initializeJobs(): void {
    this.jobsService.initializeJobs().subscribe({
      next: (response) => {
        if (response) {
          this.showSuccess('Sistema de jobs inicializado correctamente');
          this.loadInitialData();
        }
      },
      error: (error) => {
        this.showError('Error al inicializar sistema de jobs');
      }
    });
  }

  /**
   * Iniciar todos los jobs
   */
  startJobs(): void {
    this.jobsService.startJobs().subscribe({
      next: (response) => {
        if (response) {
          this.showSuccess('Jobs iniciados correctamente');
        }
      },
      error: (error) => {
        this.showError('Error al iniciar jobs');
      }
    });
  }

  /**
   * Detener todos los jobs
   */
  stopJobs(): void {
    this.jobsService.stopJobs().subscribe({
      next: (response) => {
        if (response) {
          this.showSuccess('Jobs detenidos correctamente');
        }
      },
      error: (error) => {
        this.showError('Error al detener jobs');
      }
    });
  }

  /**
   * Reiniciar sistema de jobs
   */
  restartJobs(): void {
    this.jobsService.restartJobs().subscribe({
      next: (response) => {
        if (response) {
          this.showSuccess('Sistema de jobs reiniciado correctamente');
          this.loadInitialData();
        }
      },
      error: (error) => {
        this.showError('Error al reiniciar sistema de jobs');
      }
    });
  }

  /**
   * Ejecutar job específico
   */
  runJob(jobName: string): void {
    this.jobsService.runJob(jobName).subscribe({
      next: (response) => {
        if (response) {
          this.showSuccess(`Job '${jobName}' ejecutado correctamente`);
          this.loadJobsLogs();
        }
      },
      error: (error) => {
        this.showError(`Error al ejecutar job '${jobName}'`);
      }
    });
  }

  /**
   * Cargar logs de jobs
   */
  loadJobsLogs(): void {
    const filters = this.logsFilterForm.value;
    const params = {
      page: this.logsCurrentPage + 1,
      limit: this.logsPageSize,
      ...(filters.status && { status: filters.status }),
      ...(filters.jobType && { jobType: filters.jobType }),
      ...(filters.startDate && { startDate: this.formatDate(filters.startDate) }),
      ...(filters.endDate && { endDate: this.formatDate(filters.endDate) })
    };

    this.jobsService.getJobsLogs(params).subscribe({
      next: (response) => {
        if (response) {
          this.jobsLogs = response.logs;
          this.logsTotalItems = response.pagination.totalItems;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.showError('Error al cargar logs de jobs');
      }
    });
  }

  /**
   * Cargar estadísticas de jobs
   */
  loadJobsStatistics(period: string = '24h'): void {
    this.jobsService.getJobsStatistics(period).subscribe({
      next: (response) => {
        this.jobsStatistics = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.showError('Error al cargar estadísticas');
      }
    });
  }

  /**
   * Cargar configuración de jobs
   */
  loadJobsConfiguration(): void {
    this.jobsService.getJobsConfiguration().subscribe({
      next: (response) => {
        this.jobsConfiguration = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.showError('Error al cargar configuración');
      }
    });
  }

  /**
   * Cargar próximas ejecuciones
   */
  loadNextExecutions(): void {
    this.jobsService.getNextExecutions().subscribe({
      next: (response) => {
        this.nextExecutions = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.showError('Error al cargar próximas ejecuciones');
      }
    });
  }

  /**
   * Manejar cambio de página en logs
   */
  onLogsPageChange(event: any): void {
    this.logsCurrentPage = event.pageIndex;
    this.logsPageSize = event.pageSize;
    this.loadJobsLogs();
  }

  /**
   * Limpiar filtros de logs
   */
  clearLogsFilters(): void {
    this.logsFilterForm.reset();
    this.logsCurrentPage = 0;
  }

  /**
   * Obtener clase CSS para estado de job usando clases Tailwind
   */
  getJobStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtener icono para tipo de job
   */
  getJobTypeIcon(jobType: string): string {
    switch (jobType) {
      case 'metricsSync':
        return 'sync';
      case 'tokenValidation':
        return 'verified_user';
      case 'dataCleanup':
        return 'cleaning_services';
      case 'healthCheck':
        return 'health_and_safety';
      case 'manual_job_execution':
        return 'play_arrow';
      default:
        return 'work';
    }
  }

  /**
   * Formatear duración de ejecución
   */
  formatDuration(startedAt: string, completedAt: string | null): string {
    if (!completedAt) return 'En progreso...';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}m`;
  }

  /**
   * Formatear fecha para API
   */
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Obtener resumen de estado del sistema
   */
  getSystemStatusSummary(): any {
    return this.jobsService.getStatusSummary();
  }

  /**
   * Verificar si el usuario es admin (hardcodeado para user ID 1)
   
  isUserAdmin(): boolean {
    // Por ahora hardcodeamos para user ID 1
    // En el futuro se puede integrar con el sistema de roles
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id === 1 || user.id_usuario === 1;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
   */

  /**
   * Mostrar mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['bg-green-500', 'text-white']
    });
  }

  /**
   * Mostrar mensaje de error
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['bg-red-500', 'text-white']
    });
  }

  /**
   * Limpiar error actual
   */
  clearError(): void {
    this.jobsService.clearError();
  }
}

