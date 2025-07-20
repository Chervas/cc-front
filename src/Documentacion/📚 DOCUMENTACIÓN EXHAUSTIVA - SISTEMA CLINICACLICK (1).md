# 📚 DOCUMENTACIÓN EXHAUSTIVA - SISTEMA CLINICACLICK

## 🎯 INFORMACIÓN GENERAL

**Proyecto**: ClinicaClick - Sistema de gestión de clínicas con roles avanzados  
**Arquitectura**: Frontend Angular 19 + Backend Node.js/Express + Base de datos MySQL  
**Framework Frontend**: Fuse Angular (Material Design)  
**Estado Actual**: Fase 3 completada - Sistema de roles, OAuth Meta, mapeo de activos  

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **REPOSITORIOS**
- **Frontend**: https://github.com/Chervas/cc-front
- **Backend**: https://github.com/Chervas/cc-back
- **Demo**: https://github.com/Chervas/cc-demo

## Main Navigation

The application provides several main routes that can be accessed from the side menu:

- **Usuarios** – `/apps/contacts`
- **Clínicas** – `/apps/clinicas`
- **Pacientes** – `/pacientes`
- **Contabilidad** – `/apps/ventas/*` (services, invoices, etc.)
- **Marketing** – `/marketing`

These entries are configured in `src/app/mock-api/common/navigation/data.ts` and dynamically loaded by the `RoleInterceptor`.

### **TECNOLOGÍAS PRINCIPALES**
- **Frontend**: Angular 19, Fuse UI, TypeScript, RxJS, Transloco
- **Backend**: Node.js, Express, Sequelize ORM
- **Base de Datos**: MySQL
- **Autenticación**: JWT + OAuth Meta (Facebook)
- **Estilos**: Fuse Material Design (NO SCSS custom)

### **ARQUITECTURA DUAL DE USUARIOS**

El sistema implementa una arquitectura dual que separa claramente las responsabilidades entre la interfaz de usuario y la lógica de negocio. Esta separación permite mantener la compatibilidad con el framework FUSE mientras se implementa la lógica específica del dominio médico.

#### **Usuario FUSE (Interfaz)**
El usuario FUSE se utiliza exclusivamente para elementos visuales y de interfaz de usuario. Este modelo se encuentra implementado en `src/app/layout/common/user/user.component.ts` y maneja únicamente información superficial como el nombre mostrado, avatar, y estados de conexión (Online, Away, Busy, Invisible).

**Características del Usuario FUSE:**
- **ID:** String alfanumérico utilizado solo para identificación visual
- **Propósito:** Elementos de UI/UX del template FUSE
- **Campos principales:** `user.id`, `user.email`, `user.name`, `user.avatar`, `user.status`
- **Limitaciones:** No debe utilizarse para lógica de negocio o autenticación

#### **Usuario de Negocio (Lógica de Aplicación)**
El usuario de negocio contiene toda la información crítica para el funcionamiento de la aplicación médica. Este modelo se gestiona a través de `src/app/core/auth/auth.service.ts` y se conecta directamente con la base de datos a través del modelo `models/usuario.js` en el backend.

**Características del Usuario de Negocio:**
- **ID:** Número entero (`id_usuario`) que corresponde a la clave primaria en base de datos
- **Propósito:** Autenticación, autorización, gestión de clínicas, OAuth2
- **Campos principales:** `user.id_usuario`, `user.email_usuario`, `user.nombre`, `user.apellidos`
- **Funcionalidades:** Login, permisos, relaciones con clínicas, roles específicos

#### **⚠️ IMPORTANTE: Separación de Responsabilidades**
```typescript
// ❌ INCORRECTO - Mezclar usuarios FUSE con lógica de negocio
if (fuseUser.id === 'admin') { /* lógica de permisos */ }

// ✅ CORRECTO - Usar usuario de negocio para lógica
if (businessUser.id_usuario === 1 && this.roleService.isAdmin()) { /* lógica de permisos */ }

// ✅ CORRECTO - Usar usuario FUSE solo para UI
<div>Bienvenido, {{fuseUser.name}}</div>
<img [src]="fuseUser.avatar" alt="Avatar">
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### **TABLAS PRINCIPALES**
```sql
-- Tablas identificadas en la BD:
AdCaches, Campanas, ClinicMetaAssets, ClinicaServicio, Clinicas, 
Facturas, GruposClinicas, HistorialDeServicios, Leads, 
MetaConnections, Pacientes, SequelizeMeta, Servicios, 
UsuarioClinica, Usuarios
```

### **MODELO USUARIO** (`models/usuario.js`)
```javascript
// Campos principales:
- id_usuario (INTEGER, primaryKey, autoIncrement)
- nombre (STRING)
- apellidos (STRING) 
- email_usuario (STRING)
- email_factura (STRING)
- email_notificacion (STRING)
- password_usuario (STRING)
- fecha_creacion (DATE, defaultValue: NOW)
- id_gestor (INTEGER)
- notas_usuario (STRING)
- telefono (STRING)
- cargo_usuario (STRING)
- cumpleanos (DATE)
- isProfesional (BOOLEAN, allowNull: false, defaultValue: false)

// Configuración:
- modelName: 'Usuario'
- tableName: 'Usuarios'
- timestamps: true
```

### **MODELO USUARIOCLINICA** (`models/usuarioclinica.js`)
```javascript
// Campos principales:
- id_usuario (INTEGER, primaryKey)
- id_clinica (INTEGER, primaryKey)
- rol_clinica (ENUM: 'paciente', 'personaldeclinica', 'propietario', defaultValue: 'paciente')
- subrol_clinica (ENUM: 'Auxiliares y enfermeros', 'Doctores', 'Administrativos', allowNull: true, defaultValue: null)
- datos_fiscales_clinica (JSON, allowNull: true)

// Configuración:
- modelName: 'UsuarioClinica'
- tableName: 'UsuarioClinica'
- timestamps: true
```

### **RELACIONES**
```javascript
// Usuario -> UsuarioClinica -> Clinica (Many-to-Many)
Usuario.belongsToMany(models.Clinica, {
    through: models.UsuarioClinica,
    foreignKey: 'id_usuario',
    otherKey: 'id_clinica',
    as: 'Clinicas'
});
```

---

## 🎭 SISTEMA DE ROLES

### **MAPEO BACKEND ↔ FRONTEND**

**Backend (Base de Datos)**:
```javascript
rol_clinica: ENUM('paciente', 'personaldeclinica', 'propietario')
subrol_clinica: ENUM('Auxiliares y enfermeros', 'Doctores', 'Administrativos')
```

**Frontend (TypeScript)**:
```typescript
enum UserRole {
    ADMIN = 'ADMIN',
    PROPIETARIO = 'PROPIETARIO', 
    DOCTOR = 'DOCTOR',
    PERSONAL_CLINICA = 'PERSONAL_CLINICA',
    PACIENTE = 'PACIENTE'
}
```

### **CONFIGURACIÓN DE ROLES** (`src/app/core/constants/role.constants.ts`)

```typescript
export const ROLE_CONFIG = {
    // 👑 ADMINISTRADORES (centralizado y seguro)
    ADMIN_USER_IDS: [1],
    
    // 🎨 ETIQUETAS VISUALES
    ROLE_LABELS: {
        [UserRole.ADMIN]: 'Administrador',
        [UserRole.PROPIETARIO]: 'Propietario',
        [UserRole.DOCTOR]: 'Doctor',
        [UserRole.PERSONAL_CLINICA]: 'Personal de Clínica',
        [UserRole.PACIENTE]: 'Paciente'
    },
    
    // 🔐 PERMISOS POR ROL (granulares y seguros)
    ROLE_PERMISSIONS: {
        [UserRole.ADMIN]: ['*', 'system.manage', 'users.manage', 'clinics.manage'],
        [UserRole.PROPIETARIO]: ['clinic.manage', 'clinic.view_patients', 'assets.map'],
        [UserRole.DOCTOR]: ['clinic.view_patients', 'clinic.manage_appointments'],
        [UserRole.PERSONAL_CLINICA]: ['clinic.view_patients', 'appointments.view'],
        [UserRole.PACIENTE]: ['profile.view_own', 'appointments.view_own']
    },

    // 🔐 ACCIONES SENSIBLES
    SENSITIVE_ACTIONS: {
        'assets.map': [UserRole.ADMIN, UserRole.PROPIETARIO],
        'clinic.manage_settings': [UserRole.ADMIN, UserRole.PROPIETARIO],
        'users.manage': [UserRole.ADMIN]
    }
};
```

### **JERARQUÍA DE ROLES**
```typescript
export const ROLE_HIERARCHY = {
    [UserRole.ADMIN]: 5,
    [UserRole.PROPIETARIO]: 4,
    [UserRole.DOCTOR]: 3,
    [UserRole.PERSONAL_CLINICA]: 2,
    [UserRole.PACIENTE]: 1
};
```

---

## 🔧 SERVICIOS PRINCIPALES

### **ROLE SERVICE** (`src/app/core/services/role.service.ts`)

**Métodos Públicos Disponibles**:
```typescript
// Observables principales
currentUser$: Observable<UsuarioConRoles>
selectedRole$: Observable<UserRole>
availableRoles$: Observable<UserRole[]>

// Métodos de verificación
hasRole(role: UserRole): boolean
isAdmin(): boolean
hasPermission(permission: string): Observable<boolean>
hasAnyPermission(permissions: string[]): Observable<boolean>

// Métodos de gestión
loadUserRolesFromBackend(): Observable<any>
getClinicasByCurrentRole(): ClinicaConRol[]
getCurrentPermissions(): string[]
```

### **PERMISSION SERVICE** (`src/app/core/services/permission.service.ts`)

**Métodos Disponibles**:
```typescript
// Métodos de verificación de permisos
hasPermission(permission: string): Observable<boolean>
hasAnyPermission(permissions: string[]): Observable<boolean>
reloadPermissions(): void
```

---

## 🛡️ SISTEMA DE SEGURIDAD

### **GUARDS** (`src/app/core/auth/guards/`)
- **role.guard.ts**: Protege rutas basado en roles
- **auth.guard.ts**: Verifica autenticación
- **noAuth.guard.ts**: Redirige usuarios autenticados

### **INTERCEPTORS** (`src/app/core/auth/interceptors/`)
- **role.interceptor.ts**: Agrega headers de rol automáticamente
- **auth.interceptor.ts**: Maneja tokens JWT

### **DIRECTIVAS** (`src/app/modules/admin/apps/roles/shared/`)
- **has-role.directive.ts**: `*hasRole="'ADMIN'"` - Muestra/oculta por rol
- **has-permission.directive.ts**: `*hasPermission="'clinic.manage'"` - Muestra/oculta por permiso

---

## 🎨 ESTRUCTURA FRONTEND

### **RUTAS PRINCIPALES** (`src/app/app.routes.ts`)
```typescript
// Rutas principales identificadas:
/dashboard - Panel principal
/roles-test - Componente de testing de roles
/oauth - Configuración OAuth Meta
/assets - Mapeo de activos
```

### **COMPONENTES CLAVE**

**1. Role Test Component** (`src/app/modules/admin/apps/roles/components/`)
- **role-test-component.ts**: Lógica del componente
- **role-test-component.html**: Template con directivas *hasRole y *hasPermission
- **Propósito**: Testing y debugging del sistema de roles

**2. Clinic Selector** (`src/app/layout/`)
- **Propósito**: Selector de clínicas en el menú lateral
- **Estado**: Corregido según commits

### **CONFIGURACIÓN PRINCIPAL** (`src/app/app.config.ts`)

**Providers Configurados**:
```typescript
// Transloco (Internacionalización)
provideTransloco({
    config: {
        availableLangs: [
            { id: 'en', label: 'English' },
            { id: 'tr', label: 'Turkish' }
        ],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: true
    },
    loader: TranslocoHttpLoader
})

// HTTP Interceptors
provideHttpClient(
    withInterceptors([
        authInterceptor,
        roleInterceptor  // ⚠️ DEBE estar incluido
    ])
)

// Sistema de Roles
RoleService,
PermissionService,
RoleGuard
```

---

## 🔗 INTEGRACIÓN OAUTH META

### **CONFIGURACIÓN**
- **Propósito**: Autenticación con Facebook para clínicas
- **Estado**: Implementado pero puede interferir con interceptor de roles
- **Archivos**: `ClinicMetaAsset.js`, `MetaConecction.js`

### **CONSIDERACIÓN IMPORTANTE**
```typescript
// El roleInterceptor debe excluir dominios externos:
function shouldInterceptRequest(url: string): boolean {
    const excludedDomains = [
        'graph.facebook.com',
        'connect.facebook.net'
    ];
    return !excludedDomains.some(domain => url.includes(domain));
}
```

---

## 🎯 MAPEO DE ACTIVOS

### **FUNCIONALIDAD**
- **Propósito**: Mapear activos de clínicas con Meta (Facebook)
- **Permisos**: Solo ADMIN y PROPIETARIO
- **Estado**: Implementado en Fase 3

---

## 🐛 PROBLEMAS CONOCIDOS Y SOLUCIONES

### **1. ERROR toUpperCase()**
**Causa**: Configuración incorrecta de Transloco  
**Solución**: Usar `prodMode: true` y `TranslocoHttpLoader`

### **2. Directivas No Funcionan**
**Causa**: Directivas no importadas en componentes standalone  
**Solución**: 
```typescript
import { HasRoleDirective } from '../shared/has-role.directive';
import { HasPermissionDirective } from '../shared/has-permission.directive';

@Component({
    imports: [HasRoleDirective, HasPermissionDirective]
})
```

### **3. Usuario Sin Roles**
**Causa**: Tabla UsuarioClinica vacía para el usuario  
**Solución**: Insertar roles en BD:
```sql
INSERT INTO UsuarioClinica (id_usuario, id_clinica, rol_clinica, subrol_clinica) 
VALUES 
(1, 1, 'propietario', NULL),
(1, 2, 'personaldeclinica', 'Doctores');
```

### **4. Interceptor No Incluido**
**Causa**: `roleInterceptor` no está en `app.config.ts`  
**Solución**: Agregarlo a `withInterceptors([roleInterceptor])`

---

## 📋 ESTADO ACTUAL DEL PROYECTO

### **✅ COMPLETADO**
- ✅ Sistema de roles completo (Fase 3)
- ✅ OAuth Meta integrado
- ✅ Mapeo de activos
- ✅ Directivas *hasRole y *hasPermission
- ✅ Guards y interceptors
- ✅ Selector de clínicas
- ✅ Configuración Transloco

### **⚠️ PROBLEMAS IDENTIFICADOS**
- ❌ Directivas no importadas en componentes
- ❌ Usuario de prueba sin roles en BD
- ❌ Interceptor no incluido en configuración
- ❌ Posible interferencia OAuth con interceptor

### **🔧 TAREAS PENDIENTES**
1. **Restaurar directivas** en role-test-component
2. **Incluir roleInterceptor** en app.config.ts
3. **Asignar roles** al usuario de prueba en BD
4. **Configurar exclusiones** en interceptor para OAuth
5. **Testing completo** del sistema de roles

---

## 🚀 GUÍA DE IMPLEMENTACIÓN RÁPIDA

### **PASO 1: Corregir Componente Role-Test**
```bash
# Archivo: src/app/modules/admin/apps/roles/components/role-test-component.ts
# Agregar imports:
import { HasRoleDirective } from '../shared/has-role.directive';
import { HasPermissionDirective } from '../shared/has-permission.directive';

# En @Component decorator:
imports: [HasRoleDirective, HasPermissionDirective]
```

### **PASO 2: Incluir Interceptor**
```bash
# Archivo: src/app/app.config.ts
# Agregar import:
import { roleInterceptor } from './core/auth/interceptors/role.interceptor';

# En providers:
withInterceptors([authInterceptor, roleInterceptor])
```

### **PASO 3: Asignar Roles en BD**
```sql
-- Conectar a MySQL
mysql -u root -p clinicaclick

-- Insertar roles de prueba
INSERT INTO UsuarioClinica (id_usuario, id_clinica, rol_clinica, subrol_clinica) 
VALUES 
(1, 1, 'propietario', NULL),
(1, 2, 'personaldeclinica', 'Doctores'),
(1, 3, 'paciente', NULL);
```

### **PASO 4: Verificar Funcionamiento**
```bash
# Compilar
npm run build -- --configuration=production

# Ejecutar
npm start

# Navegar a /roles-test
# Verificar logs en consola del navegador
```

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
cc-front/
├── src/app/
│   ├── app.config.ts                    # Configuración principal
│   ├── app.routes.ts                    # Rutas de la aplicación
│   ├── core/
│   │   ├── constants/
│   │   │   └── role.constants.ts        # Constantes de roles
│   │   ├── services/
│   │   │   ├── role.service.ts          # Servicio principal de roles
│   │   │   └── permission.service.ts    # Servicio de permisos
│   │   ├── auth/
│   │   │   ├── guards/
│   │   │   │   └── role.guard.ts        # Guard de roles
│   │   │   └── interceptors/
│   │   │       └── role.interceptor.ts  # Interceptor de roles
│   │   └── transloco/
│   │       └── transloco.http-loader.ts # Loader de traducciones
│   └── modules/admin/apps/roles/
│       ├── components/
│       │   ├── role-test-component.ts   # Componente de testing
│       │   └── role-test-component.html # Template con directivas
│       └── shared/
│           ├── has-role.directive.ts    # Directiva *hasRole
│           └── has-permission.directive.ts # Directiva *hasPermission

cc-back/
├── models/
│   ├── usuario.js                       # Modelo Usuario
│   ├── usuarioclinica.js               # Modelo UsuarioClinica
│   └── clinica.js                      # Modelo Clinica
└── src/
    └── routes/                         # Rutas API
```

---

## 🔍 DEBUGGING Y LOGS

### **LOGS IMPORTANTES**
```javascript
// En RoleService:
console.log('[RoleService] Usuario cargado:', user);
console.log('[RoleService] Roles disponibles:', roles);

// En PermissionService:
console.log('[PermissionService] Permisos cargados:', permissions);

// En Directivas:
console.log('[HasRoleDirective] Evaluando rol:', role);
console.log('[HasPermissionDirective] Evaluando permiso:', permission);
```

### **VERIFICACIONES RÁPIDAS**
```bash
# 1. Verificar roles en BD
SELECT u.email_usuario, uc.rol_clinica, uc.subrol_clinica 
FROM Usuarios u 
JOIN UsuarioClinica uc ON u.id_usuario = uc.id_usuario 
WHERE u.id_usuario = 1;

# 2. Verificar API de roles
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/users/1/roles

# 3. Verificar compilación
npm run build -- --configuration=production
```

---

## 📞 CONTACTO Y SOPORTE

**Desarrollador**: Chervas  
**Repositorios**: 
- Frontend: https://github.com/Chervas/cc-front
- Backend: https://github.com/Chervas/cc-back
- Demo: https://github.com/Chervas/cc-demo

**Estado del Proyecto**: Fase 3 completada, sistema funcional con problemas menores de configuración

---

*Documentación generada el 15 de julio de 2025 - Versión 1.0*

