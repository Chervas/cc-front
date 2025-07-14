import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';

// ✅ IMPORTACIONES CORREGIDAS (rutas que Visual Studio sugiere)
import { PermissionService } from '../../../../../core/services/permission.service';
import { RoleService } from '../../../../../core/services/role.service';
import { HasRoleDirective } from '../shared/has-role.directive';
import { HasPermissionDirective } from '../shared/has-permission.directive';

@Component({
  selector: 'app-role-test',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    HasRoleDirective,
    HasPermissionDirective
  ],
  templateUrl: './role-test-component.html', // ✅ USAR ARCHIVO HTML EXTERNO
  styleUrls: ['./role-test-component.scss'] // ✅ AGREGAR ESTILOS SI EXISTEN
})
export class RoleTestComponent implements OnInit {
  
  testResults: any = {};

  constructor(
    public roleService: RoleService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    console.log('🧪 Componente de testing de roles inicializado');
  }

  async testPermissions(): Promise<void> {
    this.testResults = {
      canManageClinics: await this.permissionService.canManageClinics().toPromise(),
      canViewPatients: await this.permissionService.canViewPatients().toPromise(),
      canAccessReports: await this.permissionService.canAccessReports().toPromise(),
      hasAdminAccess: await this.permissionService.hasPermission('admin.access').toPromise()
    };
  }

  async testRoles(): Promise<void> {
    this.testResults = {
      isAdmin: await this.permissionService.hasRole('admin').toPromise(),
      isPropietario: await this.permissionService.hasRole('propietario').toPromise(),
      isDoctor: await this.permissionService.hasRole('doctor').toPromise(),
      isPaciente: await this.permissionService.hasRole('paciente').toPromise()
    };
  }
}

