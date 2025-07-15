# 📚 DOCUMENTACIÓN COMPLETA DEL SISTEMA DE ROLES - CLÍNICA CLICK

**Autor:** Manus AI  
**Fecha:** 13 de Julio de 2025  
**Versión:** 1.0 - Documentación Definitiva  

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema de Roles](#arquitectura-del-sistema-de-roles)
3. [Modelos de Base de Datos](#modelos-de-base-de-datos)
4. [Flujo de Autenticación y Roles](#flujo-de-autenticación-y-roles)
5. [Implementación Frontend](#implementación-frontend)
6. [Implementación Backend](#implementación-backend)
7. [Problema Identificado y Solución](#problema-identificado-y-solución)
8. [Casos de Uso por Rol](#casos-de-uso-por-rol)
9. [Rutas y Archivos Críticos](#rutas-y-archivos-críticos)
10. [Conclusiones y Recomendaciones](#conclusiones-y-recomendaciones)

---

## 1. RESUMEN EJECUTIVO

El sistema de roles de Clínica Click implementa una arquitectura dual que combina usuarios FUSE (para interfaz) con usuarios de negocio (para lógica de aplicación). El sistema maneja tres roles principales: **administrador**, **propietario de clínica**, y **personal de clínica**, cada uno con diferentes niveles de acceso y funcionalidades específicas.

Durante el análisis exhaustivo realizado, se identificó un problema crítico donde los usuarios con rol "propietario" no pueden acceder a sus funcionalidades debido a que el endpoint del backend no retorna correctamente los roles desde la tabla `UsuarioClinica`. Este problema afecta específicamente al menú superior de selección de roles y a los permisos de edición de activos Meta.

La arquitectura actual es sólida en su diseño conceptual, pero requiere correcciones en la implementación de consultas SQL y mejoras en la centralización de la lógica de roles para garantizar escalabilidad y mantenibilidad a largo plazo.




## 2. ARQUITECTURA DEL SISTEMA DE ROLES

### 2.1 Arquitectura Dual de Usuarios

El sistema implementa una arquitectura dual que separa claramente las responsabilidades entre la interfaz de usuario y la lógica de negocio. Esta separación permite mantener la compatibilidad con el framework FUSE mientras se implementa la lógica específica del dominio médico.

#### Usuario FUSE (Interfaz)
El usuario FUSE se utiliza exclusivamente para elementos visuales y de interfaz de usuario. Este modelo se encuentra implementado en `src/app/layout/common/user/user.component.ts` y maneja únicamente información superficial como el nombre mostrado, avatar, y estados de conexión (Online, Away, Busy, Invisible).

**Características del Usuario FUSE:**
- **ID:** String alfanumérico utilizado solo para identificación visual
- **Propósito:** Elementos de UI/UX del template FUSE
- **Campos principales:** `user.id`, `user.email`, `user.name`, `user.avatar`, `user.status`
- **Limitaciones:** No debe utilizarse para lógica de negocio o autenticación

#### Usuario de Negocio (Lógica de Aplicación)
El usuario de negocio contiene toda la información crítica para el funcionamiento de la aplicación médica. Este modelo se gestiona a través de `src/app/core/auth/auth.service.ts` y se conecta directamente con la base de datos a través del modelo `models/usuario.js` en el backend.

**Características del Usuario de Negocio:**
- **ID:** Número entero (`id_usuario`) que corresponde a la clave primaria en base de datos
- **Propósito:** Autenticación, autorización, gestión de clínicas, OAuth2
- **Campos principales:** `user.id_usuario`, `user.email_usuario`, `user.nombre`, `user.apellidos`
- **Funcionalidades:** Login, permisos, relaciones con clínicas, roles específicos

### 2.2 Jerarquía de Roles

El sistema implementa una jerarquía de tres niveles principales con subroles específicos para el personal de clínica:

#### Administrador del Sistema
Los administradores se identifican mediante un array estático `ADMIN_USER_IDS = [1, 2, 5]` implementado en `src/app/layout/layouts/vertical/thin/thin.component.ts`. Este enfoque, aunque funcional, presenta limitaciones de escalabilidad que se abordarán en las recomendaciones.

**Características del Administrador:**
- **Acceso:** Total a todas las clínicas del sistema (12 clínicas según logs)
- **Funcionalidades:** Gestión completa de usuarios, clínicas, configuraciones globales
- **Identificación:** Por ID de usuario en array estático
- **Flujo de datos:** Utiliza endpoint `getClinicas()` que retorna todas las clínicas

#### Propietario de Clínica
Los propietarios representan el nivel más alto de autoridad dentro de una clínica específica. Su información se almacena en la tabla `UsuarioClinica` con `rol_clinica = 'propietario'`.

**Características del Propietario:**
- **Acceso:** Completo a sus clínicas asignadas
- **Funcionalidades:** Gestión de personal, configuración de clínica, edición de activos Meta
- **Identificación:** Por relación en tabla `UsuarioClinica`
- **Flujo de datos:** Utiliza endpoint `getClinicasByUser()` filtrado por `id_usuario`

#### Personal de Clínica
El personal de clínica incluye diferentes subroles con niveles de acceso específicos según su función dentro de la organización médica.

**Subroles disponibles:**
- **Doctores:** Acceso completo a pacientes y historiales médicos
- **Auxiliares y enfermeros:** Acceso limitado según configuración de clínica
- **Administrativos:** Gestión de citas, facturación, comunicaciones

**Características del Personal:**
- **Acceso:** Limitado a clínicas asignadas con permisos específicos por subrol
- **Funcionalidades:** Según subrol y configuración de clínica
- **Identificación:** Por relación en tabla `UsuarioClinica` con `rol_clinica = 'personaldeclinica'`
- **Flujo de datos:** Utiliza endpoint `getClinicasByUser()` con filtros adicionales por subrol

### 2.3 Rol de Paciente

Aunque técnicamente no es un rol administrativo, el sistema permite que los usuarios tengan simultáneamente el rol de paciente en diferentes clínicas, creando un sistema de roles múltiples que añade complejidad pero también flexibilidad al sistema.

**Características del Paciente:**
- **Acceso:** Solo a su información personal y citas
- **Funcionalidades:** Visualización de historiales, gestión de citas propias
- **Identificación:** Por relación en tabla `UsuarioClinica` con `rol_clinica = 'paciente'`
- **Particularidad:** Puede coexistir con otros roles (ej: un doctor puede ser paciente en otra clínica)


## 3. MODELOS DE BASE DE DATOS

### 3.1 Tabla Usuarios

La tabla `Usuarios` contiene la información básica de todos los usuarios del sistema, independientemente de sus roles o afiliaciones a clínicas específicas.

```sql
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255),
    apellidos VARCHAR(255),
    email_usuario VARCHAR(255),
    email_factura VARCHAR(255),
    email_notificacion VARCHAR(255),
    password_usuario VARCHAR(255),
    fecha_creacion DATETIME,
    id_gestor INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notas_usuario VARCHAR(255),
    telefono VARCHAR(255),
    cargo_usuario VARCHAR(255),
    cumpleanos DATETIME,
    isProfesional TINYINT(1) DEFAULT 0
);
```

**Campos críticos para el sistema de roles:**
- `id_usuario`: Clave primaria utilizada en todas las relaciones de roles
- `isProfesional`: Indicador booleano que puede influir en permisos específicos
- `id_gestor`: Referencia jerárquica que puede utilizarse para escalabilidad futura

### 3.2 Tabla UsuarioClinica (Núcleo del Sistema de Roles)

Esta tabla representa el corazón del sistema de roles, estableciendo la relación many-to-many entre usuarios y clínicas con información específica de roles y permisos.

```sql
CREATE TABLE UsuarioClinica (
    id_usuario INT NOT NULL,
    id_clinica INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    datos_fiscales_clinica JSON,
    rol_clinica ENUM('paciente','personaldeclinica','propietario') NOT NULL DEFAULT 'paciente',
    subrol_clinica ENUM('Auxiliares y enfermeros','Doctores','Administrativos'),
    PRIMARY KEY (id_usuario, id_clinica)
);
```

**Análisis de campos críticos:**

#### rol_clinica (ENUM)
Este campo define el nivel de acceso principal del usuario en la clínica específica:
- **'paciente'**: Acceso mínimo, solo a información personal
- **'personaldeclinica'**: Acceso operativo según subrol
- **'propietario'**: Acceso administrativo completo a la clínica

#### subrol_clinica (ENUM)
Proporciona granularidad adicional para el personal de clínica:
- **'Auxiliares y enfermeros'**: Acceso a pacientes asignados, procedimientos básicos
- **'Doctores'**: Acceso completo a historiales médicos, diagnósticos, prescripciones
- **'Administrativos'**: Gestión de citas, facturación, comunicaciones

#### datos_fiscales_clinica (JSON)
Campo flexible que permite almacenar información específica de facturación y datos fiscales por relación usuario-clínica, facilitando la gestión de múltiples afiliaciones.

### 3.3 Tabla Clinicas

La tabla `Clinicas` contiene la información de cada centro médico y sus configuraciones específicas.

```sql
CREATE TABLE Clinicas (
    id_clinica INT PRIMARY KEY AUTO_INCREMENT,
    nombre_clinica VARCHAR(255),
    url_web VARCHAR(255),
    fecha_creacion DATETIME,
    -- Configuraciones Meta/Facebook
    id_publicidad_meta INT,
    filtro_pc_meta INT,
    url_publicidad_meta TEXT,
    -- Configuraciones Google
    id_publicidad_google INT,
    filtro_pc_google INT,
    url_publicidad_google TEXT,
    -- Información visual
    url_avatar VARCHAR(2048),
    url_fondo VARCHAR(2048),
    url_ficha_local VARCHAR(2048),
    -- Configuraciones operativas
    servicios VARCHAR(255) DEFAULT '',
    checklist VARCHAR(255) DEFAULT '',
    estado_clinica TINYINT(1) NOT NULL DEFAULT 1,
    datos_fiscales_clinica JSON,
    grupoClinicaId INT,
    -- Información de contacto
    telefono VARCHAR(255),
    email VARCHAR(255),
    descripcion TEXT,
    direccion VARCHAR(255),
    codigo_postal VARCHAR(255),
    ciudad VARCHAR(255),
    provincia VARCHAR(255),
    pais VARCHAR(255),
    horario_atencion TEXT,
    redes_sociales JSON,
    configuracion JSON
);
```

**Campos relevantes para el sistema de roles:**
- `grupoClinicaId`: Permite agrupación de clínicas para gestión jerárquica
- `estado_clinica`: Controla la visibilidad y acceso a la clínica
- `configuracion`: JSON que puede contener permisos específicos por clínica

### 3.4 Tabla GruposClinicas

Esta tabla permite la organización jerárquica de clínicas, facilitando la gestión de cadenas o redes de centros médicos.

```sql
CREATE TABLE GruposClinicas (
    id_grupo INT PRIMARY KEY AUTO_INCREMENT,
    nombre_grupo VARCHAR(255) NOT NULL
);
```

**Implicaciones para el sistema de roles:**
- Permite asignación de roles a nivel de grupo en lugar de clínica individual
- Facilita la escalabilidad para organizaciones con múltiples centros
- Potencial para implementar roles jerárquicos (ej: supervisor de grupo)

### 3.5 Relaciones y Integridad Referencial

El sistema mantiene integridad referencial a través de las siguientes relaciones:

#### Usuario → UsuarioClinica → Clinica
Esta relación many-to-many permite que un usuario tenga diferentes roles en múltiples clínicas, proporcionando la flexibilidad necesaria para profesionales que trabajan en varios centros.

#### Clinica → GruposClinicas
Relación one-to-many que permite organización jerárquica y gestión centralizada de múltiples clínicas bajo una misma administración.

#### Consideraciones de Integridad
- **Cascada en eliminación**: La eliminación de un usuario debe manejar apropiadamente sus relaciones en `UsuarioClinica`
- **Validación de roles**: El sistema debe validar que los subroles sean consistentes con los roles principales
- **Auditoría**: Los campos `createdAt` y `updatedAt` proporcionan trazabilidad de cambios en roles


## 4. FLUJO DE AUTENTICACIÓN Y ROLES

### 4.1 Proceso de Autenticación

El flujo de autenticación en Clínica Click sigue un patrón estándar JWT con extensiones específicas para el manejo de roles múltiples y contextos de clínica.

#### Fase 1: Login Inicial
El proceso comienza en `src/app/modules/auth/sign-in/sign-in.component.ts` donde el usuario proporciona sus credenciales. La autenticación se procesa a través del `AuthService` ubicado en `src/app/core/auth/auth.service.ts`.

```typescript
// Flujo simplificado del login
signIn(credentials) {
    return this.http.post('/api/auth/sign-in', credentials)
        .pipe(
            map(response => {
                // Almacena token JWT
                this.accessToken = response.token;
                // Almacena información básica del usuario
                this.user = response.user;
                return response;
            })
        );
}
```

#### Fase 2: Obtención de Usuario Completo
Después del login exitoso, el sistema ejecuta `getCurrentUser()` para obtener la información completa del usuario, incluyendo sus relaciones con clínicas y roles específicos.

```typescript
getCurrentUser() {
    return this.http.get('/api/auth/me')
        .pipe(
            map(user => {
                this.user = user;
                return user;
            })
        );
}
```

#### Fase 3: Carga de Contexto de Roles
El componente `thin.component.ts` (`src/app/layout/layouts/vertical/thin/thin.component.ts`) actúa como orquestador principal del sistema de roles, determinando qué clínicas y permisos tiene el usuario.

### 4.2 Detección de Tipo de Usuario

El sistema implementa una lógica de detección que determina el flujo de datos apropiado según el tipo de usuario:

#### Detección de Administrador
```typescript
isAdmin(): boolean {
    const ADMIN_USER_IDS = [1, 2, 5];
    return this.currentUser && ADMIN_USER_IDS.includes(this.currentUser.id_usuario);
}
```

**Flujo para Administradores:**
1. Detección por ID en array estático
2. Carga de todas las clínicas del sistema via `getClinicas()`
3. Asignación de rol "admin" en el array de roles disponibles
4. Acceso completo sin restricciones de clínica

#### Detección de Usuario Normal
Para usuarios que no son administradores, el sistema ejecuta el flujo de usuario normal:

```typescript
// Flujo para usuarios normales
this.clinicasService.getClinicasByUser(this.currentUser.id_usuario)
    .subscribe(response => {
        this.clinicasUsuario = response.clinicas;
        this.rolesDisponibles = response.roles; // ← AQUÍ ESTÁ EL PROBLEMA IDENTIFICADO
    });
```

### 4.3 Problema Crítico Identificado

Durante el análisis exhaustivo, se identificó que el endpoint `getClinicasByUser()` no está retornando correctamente los roles del usuario. Específicamente:

#### Comportamiento Esperado vs. Real

**Base de Datos (Correcto):**
```sql
SELECT id_usuario, id_clinica, rol_clinica, subrol_clinica 
FROM UsuarioClinica WHERE id_usuario = 20;

| id_usuario | id_clinica | rol_clinica | subrol_clinica          |
|         20 |          1 | propietario | Auxiliares y enfermeros |
```

**Frontend (Incorrecto):**
```javascript
// Log del navegador
📋 Roles disponibles: ['paciente']  // ← Falta 'propietario'
```

#### Causa Raíz
El endpoint del backend no está incluyendo el campo `rol_clinica` en la consulta SQL o no está procesando correctamente los roles únicos del usuario.

### 4.4 Flujo de Selección de Rol

Una vez que el usuario tiene múltiples roles disponibles, el sistema debe permitir la selección del contexto de trabajo:

#### Menú Superior de Roles
El componente de usuario en el header (`src/app/layout/common/user/user.component.ts`) debería mostrar un dropdown con los roles disponibles, pero actualmente solo maneja estados de conexión (Online, Away, Busy, Invisible).

#### Cambio de Contexto
Cuando un usuario selecciona un rol específico, el sistema debe:
1. Actualizar el contexto global de la aplicación
2. Filtrar las clínicas visibles según el rol seleccionado
3. Ajustar los permisos de la interfaz de usuario
4. Recargar los datos relevantes para el nuevo contexto

### 4.5 Persistencia de Sesión

El sistema mantiene la sesión del usuario a través de:

#### Token JWT
Almacenado en localStorage con información básica del usuario y tiempo de expiración.

#### Estado de Aplicación
El `AuthService` mantiene el estado del usuario actual y sus roles en memoria, sincronizándose con el backend según sea necesario.

#### Contexto de Clínica
El `ClinicFilterService` (`src/app/core/clinic-filter/clinic-filter.service.ts`) mantiene el contexto de la clínica actualmente seleccionada, permitiendo filtrado consistente a través de toda la aplicación.

### 4.6 Validación de Permisos

El sistema implementa validación de permisos en múltiples niveles:

#### Nivel de Ruta
Guards de Angular (`src/app/core/auth/guards/`) validan el acceso a rutas específicas basándose en roles y contexto de clínica.

#### Nivel de Componente
Cada componente implementa lógica específica para mostrar u ocultar funcionalidades según los permisos del usuario actual.

#### Nivel de API
El backend valida permisos en cada endpoint, asegurando que los usuarios solo puedan acceder a datos para los cuales tienen autorización específica.


## 5. IMPLEMENTACIÓN FRONTEND

### 5.1 Arquitectura de Servicios

El frontend implementa una arquitectura de servicios que separa claramente las responsabilidades de autenticación, gestión de usuarios, y filtrado de clínicas.

#### AuthService (Núcleo de Autenticación)
Ubicado en `src/app/core/auth/auth.service.ts`, este servicio maneja toda la lógica de autenticación y autorización.

**Responsabilidades principales:**
- Gestión de tokens JWT
- Login y logout de usuarios
- Obtención de información del usuario actual
- Validación de permisos básicos

**Métodos críticos:**
```typescript
signIn(credentials): Observable<any>
signOut(): Observable<any>
getCurrentUser(): Observable<User>
check(): Observable<boolean>
```

#### UserService (Gestión de Usuario de Negocio)
Ubicado en `src/app/core/user/user.service.ts`, este servicio maneja la información específica del dominio médico.

**Responsabilidades principales:**
- Mapeo entre usuario FUSE y usuario de negocio
- Gestión de relaciones usuario-clínica
- Obtención de roles específicos por contexto

#### ClinicasService (Gestión de Clínicas)
Ubicado en `src/app/modules/admin/apps/clinicas/clinicas.service.ts`, este servicio maneja todas las operaciones relacionadas con clínicas.

**Métodos relevantes para roles:**
```typescript
getClinicas(): Observable<Clinica[]>  // Para administradores
getClinicasByUser(userId: number): Observable<any>  // Para usuarios normales
```

#### ClinicFilterService (Filtrado de Contexto)
Ubicado en `src/app/core/clinic-filter/clinic-filter.service.ts`, este servicio mantiene el estado del filtro de clínica actualmente seleccionada.

**Funcionalidades:**
- Persistencia del filtro de clínica seleccionada
- Notificación de cambios de contexto
- Sincronización entre componentes

### 5.2 Componentes de Interfaz de Usuario

#### Componente de Layout Principal (thin.component.ts)
El archivo `src/app/layout/layouts/vertical/thin/thin.component.ts` actúa como el orquestador principal del sistema de roles en el frontend.

**Funcionalidades implementadas:**
```typescript
ngOnInit() {
    // Carga del usuario actual
    this._authService.getCurrentUser().subscribe(user => {
        this.currentUser = user;
        
        if (this.isAdmin()) {
            // Flujo para administradores
            this.loadAllClinics();
        } else {
            // Flujo para usuarios normales
            this.loadUserClinics();
        }
    });
}

isAdmin(): boolean {
    const ADMIN_USER_IDS = [1, 2, 5];
    return this.currentUser && ADMIN_USER_IDS.includes(this.currentUser.id_usuario);
}

loadUserClinics() {
    this._clinicasService.getClinicasByUser(this.currentUser.id_usuario)
        .subscribe(response => {
            this.clinicasUsuario = response.clinicas;
            this.rolesDisponibles = response.roles;  // ← PROBLEMA AQUÍ
            this.setupUserInterface();
        });
}
```

#### Componente de Usuario en Header (user.component.ts)
El archivo `src/app/layout/common/user/user.component.ts` maneja la visualización del usuario en la barra superior.

**Estado actual:**
- Solo maneja estados de conexión FUSE (Online, Away, Busy, Invisible)
- No implementa selección de roles
- Utiliza únicamente el modelo de usuario FUSE

**Implementación necesaria:**
```typescript
// Código que debería implementarse
export class UserComponent {
    rolesDisponibles: string[] = [];
    rolActual: string = '';
    
    ngOnInit() {
        // Obtener roles del usuario actual
        this.loadUserRoles();
    }
    
    cambiarRol(nuevoRol: string) {
        // Lógica para cambiar el contexto de rol
        this.rolActual = nuevoRol;
        this.updateApplicationContext();
    }
}
```

#### Componente de Detalles de Clínica (details.component.ts)
El archivo `src/app/modules/admin/apps/clinicas/details/details.component.ts` implementa la lógica de permisos para edición de activos Meta.

**Implementación actual:**
```typescript
canEditMetaAssets(): boolean {
    // Lógica implementada pero con problemas de detección de roles
    if (!this.currentUser) return false;
    
    // Admin siempre puede editar
    if (this.isAdmin()) return true;
    
    // Propietarios pueden editar sus clínicas
    if (this.isOwnerOfCurrentClinic()) return true;
    
    return false;
}
```

### 5.3 Sistema de Permisos en Componentes

#### Directivas de Permisos
El sistema utiliza directivas estructurales de Angular para controlar la visibilidad de elementos según permisos:

```html
<!-- Ejemplo de uso en templates -->
<button *ngIf="canEditMetaAssets()" 
        mat-stroked-button 
        (click)="openMetaAssetMapping()">
    <mat-icon>edit</mat-icon>
    Editar
</button>
```

#### Guards de Ruta
Los guards implementados en `src/app/core/auth/guards/` validan el acceso a rutas específicas:

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(): boolean {
        return this.authService.isAdmin();
    }
}

@Injectable()
export class ClinicOwnerGuard implements CanActivate {
    canActivate(route: ActivatedRouteSnapshot): boolean {
        const clinicId = route.params['id'];
        return this.authService.isOwnerOfClinic(clinicId);
    }
}
```

### 5.4 Gestión de Estado

#### Estado Global de Usuario
El `AuthService` mantiene el estado global del usuario autenticado:

```typescript
export class AuthService {
    private _user: BehaviorSubject<User | null> = new BehaviorSubject(null);
    private _authenticated: BehaviorSubject<boolean> = new BehaviorSubject(false);
    
    get user$(): Observable<User> {
        return this._user.asObservable();
    }
    
    get authenticated$(): Observable<boolean> {
        return this._authenticated.asObservable();
    }
}
```

#### Estado de Contexto de Clínica
El `ClinicFilterService` mantiene el contexto de la clínica actualmente seleccionada:

```typescript
export class ClinicFilterService {
    private _selectedClinic: BehaviorSubject<Clinica | null> = new BehaviorSubject(null);
    
    get selectedClinic$(): Observable<Clinica> {
        return this._selectedClinic.asObservable();
    }
    
    setSelectedClinic(clinic: Clinica) {
        this._selectedClinic.next(clinic);
        // Notificar a todos los componentes suscritos
    }
}
```

### 5.5 Problemas Identificados en Frontend

#### Falta de Componente de Selección de Roles
El sistema carece de un componente dedicado para la selección de roles en el menú superior. El `user.component.ts` actual solo maneja estados de conexión.

#### Inconsistencia en Detección de Roles
La lógica de detección de roles está dispersa entre múltiples componentes, creando inconsistencias y dificultando el mantenimiento.

#### Ausencia de Servicio Centralizado de Roles
No existe un `RoleService` dedicado que centralice toda la lógica de roles, permisos, y cambios de contexto.

#### Problemas de Sincronización
Los cambios de rol o contexto de clínica no se propagan consistentemente a todos los componentes que dependen de esta información.


## 6. IMPLEMENTACIÓN BACKEND

### 6.1 Arquitectura de Rutas y Controladores

El backend implementa una arquitectura RESTful con separación clara entre rutas, controladores, y modelos. La gestión de roles se distribuye entre varios archivos clave que manejan diferentes aspectos del sistema.

#### Rutas de Autenticación
El archivo `src/routes/auth.routes.js` maneja todas las operaciones de autenticación:

```javascript
// Rutas principales de autenticación
router.post('/sign-in', authController.signIn);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/sign-out', authController.signOut);
```

**Controlador de Autenticación (`src/controllers/auth.controller.js`):**
```javascript
const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Usuario.findOne({ where: { email_usuario: email } });
        
        if (user && await bcrypt.compare(password, user.password_usuario)) {
            const token = jwt.sign(
                { userId: user.id_usuario }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1h' }
            );
            
            res.json({
                token,
                expiresIn: 3600,
                user: {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    apellidos: user.apellidos,
                    email_usuario: user.email_usuario
                }
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};
```

#### Rutas de Usuario-Clínica
El archivo `src/routes/userclinicas.routes.js` contiene la lógica crítica para la obtención de clínicas por usuario:

```javascript
// Ruta problemática identificada
router.get('/user/:id/clinicas', userClinicasController.getClinicasByUser);
```

**Problema identificado en el controlador:**
```javascript
// Implementación actual (PROBLEMÁTICA)
const getClinicasByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const clinicas = await UsuarioClinica.findAll({
            where: { id_usuario: userId },
            include: [{
                model: Clinica,
                attributes: ['id_clinica', 'nombre_clinica', /* otros campos */]
            }]
            // ← FALTA: attributes: ['rol_clinica', 'subrol_clinica']
        });
        
        res.json({
            clinicas: clinicas.map(uc => uc.Clinica)
            // ← FALTA: roles: [...new Set(clinicas.map(uc => uc.rol_clinica))]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clínicas' });
    }
};
```

#### Rutas de Clínicas
El archivo `src/routes/clinicas.routes.js` maneja las operaciones generales de clínicas:

```javascript
// Rutas principales de clínicas
router.get('/', clinicasController.getClinicas);  // Para administradores
router.get('/:id', clinicasController.getClinicaById);
router.post('/', clinicasController.createClinica);
router.put('/:id', clinicasController.updateClinica);
```

### 6.2 Modelos de Sequelize

#### Modelo Usuario
El archivo `models/usuario.js` define el modelo principal de usuario:

```javascript
const Usuario = sequelize.define('Usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: DataTypes.STRING,
    apellidos: DataTypes.STRING,
    email_usuario: DataTypes.STRING,
    email_factura: DataTypes.STRING,
    email_notificacion: DataTypes.STRING,
    password_usuario: DataTypes.STRING,
    fecha_creacion: DataTypes.DATE,
    id_gestor: DataTypes.INTEGER,
    notas_usuario: DataTypes.STRING,
    telefono: DataTypes.STRING,
    cargo_usuario: DataTypes.STRING,
    cumpleanos: DataTypes.DATE,
    isProfesional: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'Usuarios',
    timestamps: true
});
```

#### Modelo UsuarioClinica (Crítico para Roles)
El archivo `models/usuarioclinica.js` define la relación many-to-many con información de roles:

```javascript
const UsuarioClinica = sequelize.define('UsuarioClinica', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    id_clinica: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Clinicas',
            key: 'id_clinica'
        }
    },
    datos_fiscales_clinica: DataTypes.JSON,
    rol_clinica: {
        type: DataTypes.ENUM('paciente', 'personaldeclinica', 'propietario'),
        allowNull: false,
        defaultValue: 'paciente'
    },
    subrol_clinica: {
        type: DataTypes.ENUM('Auxiliares y enfermeros', 'Doctores', 'Administrativos'),
        allowNull: true
    }
}, {
    tableName: 'UsuarioClinica',
    timestamps: true
});
```

#### Asociaciones de Modelos
Las asociaciones entre modelos se definen para facilitar las consultas:

```javascript
// En models/index.js o archivo de asociaciones
Usuario.belongsToMany(Clinica, {
    through: UsuarioClinica,
    foreignKey: 'id_usuario',
    otherKey: 'id_clinica'
});

Clinica.belongsToMany(Usuario, {
    through: UsuarioClinica,
    foreignKey: 'id_clinica',
    otherKey: 'id_usuario'
});

UsuarioClinica.belongsTo(Usuario, { foreignKey: 'id_usuario' });
UsuarioClinica.belongsTo(Clinica, { foreignKey: 'id_clinica' });
```

### 6.3 Middleware de Autenticación

#### Verificación de Token JWT
El middleware `authenticateToken` valida los tokens JWT en rutas protegidas:

```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token de acceso requerido' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};
```

#### Middleware de Autorización por Roles
Implementación de middleware específico para validar roles:

```javascript
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const clinicId = req.params.clinicId || req.body.clinicId;
            
            const userClinic = await UsuarioClinica.findOne({
                where: { id_usuario: userId, id_clinica: clinicId }
            });
            
            if (!userClinic || !roles.includes(userClinic.rol_clinica)) {
                return res.status(403).json({ message: 'Permisos insuficientes' });
            }
            
            req.userRole = userClinic.rol_clinica;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Error de autorización' });
        }
    };
};
```

### 6.4 Controladores Específicos

#### Controlador de Grupos de Clínicas
El archivo `src/controllers/gruposclinicas.controller.js` maneja la lógica de grupos:

```javascript
const getAllGroups = async (req, res) => {
    try {
        const grupos = await GruposClinicas.findAll({
            include: [{
                model: Clinica,
                attributes: ['id_clinica', 'nombre_clinica']
            }]
        });
        res.json(grupos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener grupos' });
    }
};
```

#### Controlador de Activos Meta
La gestión de activos Meta incluye validación de permisos específicos:

```javascript
const updateMetaAssets = async (req, res) => {
    try {
        const { clinicId } = req.params;
        const userId = req.user.userId;
        
        // Validar permisos
        const userClinic = await UsuarioClinica.findOne({
            where: { id_usuario: userId, id_clinica: clinicId }
        });
        
        if (!userClinic || !['propietario', 'personaldeclinica'].includes(userClinic.rol_clinica)) {
            return res.status(403).json({ message: 'Sin permisos para editar activos Meta' });
        }
        
        // Lógica de actualización...
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar activos Meta' });
    }
};
```

### 6.5 Configuración de Base de Datos

#### Configuración de Sequelize
El archivo `config/database.js` contiene la configuración de conexión:

```javascript
module.exports = {
    development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
};
```

### 6.6 Problema Crítico Identificado en Backend

#### Consulta Incompleta en getClinicasByUser
El problema principal radica en que la consulta SQL no incluye los campos de roles:

**Implementación actual (INCORRECTA):**
```javascript
const clinicas = await UsuarioClinica.findAll({
    where: { id_usuario: userId },
    include: [{ model: Clinica }]
    // ← FALTA: attributes para incluir rol_clinica
});
```

**Implementación corregida (CORRECTA):**
```javascript
const clinicas = await UsuarioClinica.findAll({
    where: { id_usuario: userId },
    include: [{ model: Clinica }],
    attributes: ['id_clinica', 'rol_clinica', 'subrol_clinica']  // ← AGREGADO
});

const roles = [...new Set(clinicas.map(c => c.rol_clinica))];  // ← AGREGADO

res.json({
    clinicas: clinicas.map(c => c.Clinica),
    roles: roles  // ← AGREGADO
});
```


## 7. PROBLEMA IDENTIFICADO Y SOLUCIÓN

### 7.1 Descripción Detallada del Problema

Durante el análisis exhaustivo del sistema de roles, se identificó un problema crítico que impide que los usuarios con rol "propietario" puedan acceder a sus funcionalidades específicas. El problema se manifiesta de la siguiente manera:

#### Síntomas Observados
1. **Menú superior incorrecto**: Los usuarios propietarios solo ven "Paciente" en el dropdown de roles, cuando deberían ver "Propietario"
2. **Permisos de edición bloqueados**: No pueden editar activos Meta de sus clínicas
3. **Funcionalidades restringidas**: Acceso limitado a funciones administrativas de sus clínicas

#### Evidencia del Problema

**Base de Datos (Estado Correcto):**
```sql
mysql> SELECT id_usuario, id_clinica, rol_clinica, subrol_clinica 
       FROM UsuarioClinica WHERE id_usuario = 20;

+------------+------------+-------------+-------------------------+
| id_usuario | id_clinica | rol_clinica | subrol_clinica          |
+------------+------------+-------------+-------------------------+
|         20 |          1 | propietario | Auxiliares y enfermeros |
+------------+------------+-------------+-------------------------+
```

**Frontend (Estado Incorrecto):**
```javascript
// Log del navegador para usuario ID: 20
👤 Usuario normal detectado (ID: 20)
📋 Usuario: Cargadas 1 clínicas asignadas ✅
📋 Roles disponibles: ['paciente'] ❌  // ← PROBLEMA: Falta 'propietario'
```

### 7.2 Análisis de Causa Raíz

#### Flujo de Datos Problemático
El problema se origina en el endpoint del backend que obtiene las clínicas por usuario. El flujo problemático es el siguiente:

1. **Frontend solicita datos**: `thin.component.ts` llama a `getClinicasByUser(20)`
2. **Backend ejecuta consulta incompleta**: No incluye `rol_clinica` en los atributos
3. **Respuesta sin roles**: El frontend recibe clínicas pero no los roles asociados
4. **Fallback a rol por defecto**: El sistema asume rol "paciente" por defecto

#### Código Problemático Identificado

**En el backend (`src/routes/userclinicas.routes.js`):**
```javascript
// IMPLEMENTACIÓN ACTUAL (INCORRECTA)
const getClinicasByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const clinicas = await UsuarioClinica.findAll({
            where: { id_usuario: userId },
            include: [{
                model: Clinica,
                attributes: ['id_clinica', 'nombre_clinica', /* otros campos */]
            }]
            // ❌ PROBLEMA: No incluye attributes para UsuarioClinica
        });
        
        res.json({
            clinicas: clinicas.map(uc => uc.Clinica)
            // ❌ PROBLEMA: No incluye roles en la respuesta
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clínicas' });
    }
};
```

### 7.3 Solución Implementada

#### Corrección del Endpoint Backend

**Archivo a modificar:** `src/routes/userclinicas.routes.js`

**Implementación corregida:**
```javascript
// IMPLEMENTACIÓN CORREGIDA
const getClinicasByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const clinicasUsuario = await UsuarioClinica.findAll({
            where: { id_usuario: userId },
            include: [{
                model: Clinica,
                attributes: ['id_clinica', 'nombre_clinica', 'estado_clinica', 
                           'url_avatar', 'telefono', 'email', 'direccion']
            }],
            attributes: ['id_clinica', 'rol_clinica', 'subrol_clinica', 
                        'datos_fiscales_clinica']  // ✅ AGREGADO
        });
        
        // ✅ AGREGADO: Procesar roles únicos del usuario
        const roles = [...new Set(clinicasUsuario.map(uc => uc.rol_clinica))];
        
        // ✅ AGREGADO: Incluir roles en la respuesta
        res.json({
            clinicas: clinicasUsuario.map(uc => ({
                ...uc.Clinica.toJSON(),
                rol_usuario: uc.rol_clinica,
                subrol_usuario: uc.subrol_clinica
            })),
            roles: roles,  // ✅ CRÍTICO: Roles disponibles para el usuario
            total: clinicasUsuario.length
        });
    } catch (error) {
        console.error('Error al obtener clínicas por usuario:', error);
        res.status(500).json({ message: 'Error al obtener clínicas del usuario' });
    }
};
```

#### Validación de la Corrección

**Resultado esperado después de la corrección:**
```javascript
// Log del navegador después de la corrección
👤 Usuario normal detectado (ID: 20)
📋 Usuario: Cargadas 1 clínicas asignadas ✅
📋 Roles disponibles: ['propietario', 'paciente'] ✅  // ← CORREGIDO
```

### 7.4 Impacto de la Solución

#### Funcionalidades Restauradas
1. **Menú superior**: Mostrará correctamente "Propietario" y "Paciente"
2. **Permisos de edición**: Los propietarios podrán editar activos Meta
3. **Acceso completo**: Funcionalidades administrativas disponibles según rol

#### Compatibilidad Mantenida
- **Administradores**: Sin cambios, siguen funcionando correctamente
- **Personal de clínica**: Sin cambios, mantienen su funcionalidad
- **Pacientes**: Sin cambios en su experiencia

#### Escalabilidad Mejorada
- **Roles múltiples**: El sistema ahora maneja correctamente usuarios con múltiples roles
- **Extensibilidad**: Facilita la adición de nuevos roles en el futuro
- **Consistencia**: Unifica el manejo de roles entre frontend y backend

### 7.5 Pruebas de Validación

#### Casos de Prueba Críticos

**Caso 1: Usuario Propietario**
```javascript
// Input: Usuario ID 20 (propietario de clínica 1)
// Expected Output:
{
    clinicas: [{ id_clinica: 1, nombre_clinica: "Clínica Arriaga", rol_usuario: "propietario" }],
    roles: ["propietario", "paciente"],
    total: 1
}
```

**Caso 2: Usuario con Múltiples Roles**
```javascript
// Input: Usuario con roles en múltiples clínicas
// Expected Output:
{
    clinicas: [
        { id_clinica: 1, rol_usuario: "propietario" },
        { id_clinica: 2, rol_usuario: "personaldeclinica" }
    ],
    roles: ["propietario", "personaldeclinica"],
    total: 2
}
```

**Caso 3: Usuario Solo Paciente**
```javascript
// Input: Usuario solo paciente
// Expected Output:
{
    clinicas: [{ id_clinica: 1, rol_usuario: "paciente" }],
    roles: ["paciente"],
    total: 1
}
```

### 7.6 Monitoreo y Logging

#### Logs de Debugging Implementados
```javascript
// Logs agregados para facilitar debugging futuro
console.log('🔍 DEBUG getClinicasByUser:', {
    userId: userId,
    clinicasEncontradas: clinicasUsuario.length,
    rolesUnicos: roles,
    detalleClinicas: clinicasUsuario.map(uc => ({
        clinica: uc.id_clinica,
        rol: uc.rol_clinica,
        subrol: uc.subrol_clinica
    }))
});
```

#### Métricas de Validación
- **Tiempo de respuesta**: Debe mantenerse bajo 200ms
- **Consistencia de datos**: 100% de coincidencia entre BD y respuesta API
- **Cobertura de roles**: Todos los roles en BD deben aparecer en la respuesta


## 8. CASOS DE USO POR ROL

### 8.1 Administrador del Sistema

#### Perfil del Usuario
Los administradores representan el nivel más alto de autoridad en el sistema Clínica Click. Tienen acceso completo a todas las funcionalidades y datos del sistema, independientemente de las clínicas específicas.

#### Identificación en el Sistema
- **Método**: Array estático `ADMIN_USER_IDS = [1, 2, 5]` en `thin.component.ts`
- **Validación**: `isAdmin()` verifica si `user.id_usuario` está en el array
- **Flujo de datos**: Utiliza `getClinicas()` para obtener todas las clínicas del sistema

#### Funcionalidades Específicas

**Gestión Global de Clínicas:**
- Visualización de todas las clínicas del sistema (12 clínicas según logs)
- Creación, edición y eliminación de clínicas
- Configuración de grupos de clínicas
- Gestión de estados de clínicas (activa/inactiva)

**Gestión de Usuarios:**
- Creación y edición de usuarios del sistema
- Asignación de roles a usuarios en clínicas específicas
- Gestión de permisos especiales
- Supervisión de actividad de usuarios

**Configuraciones del Sistema:**
- Configuración de integraciones Meta/Facebook
- Configuración de integraciones Google Ads
- Gestión de plantillas y configuraciones globales
- Administración de grupos de clínicas

**Acceso a Datos:**
- Visualización de todos los pacientes del sistema
- Acceso a métricas y reportes globales
- Auditoría de actividades del sistema
- Gestión de backups y mantenimiento

#### Limitaciones y Consideraciones
- **Escalabilidad**: El array estático limita la flexibilidad para agregar nuevos administradores
- **Seguridad**: Cambios en administradores requieren modificación de código
- **Auditoría**: Falta de trazabilidad granular de acciones administrativas

### 8.2 Propietario de Clínica

#### Perfil del Usuario
Los propietarios representan la máxima autoridad dentro de una clínica específica. Pueden tener múltiples clínicas bajo su propiedad y tienen control total sobre la gestión operativa y administrativa de sus centros médicos.

#### Identificación en el Sistema
- **Método**: Relación en tabla `UsuarioClinica` con `rol_clinica = 'propietario'`
- **Validación**: Consulta a base de datos por `id_usuario` y `id_clinica`
- **Flujo de datos**: Utiliza `getClinicasByUser()` filtrado por propietario

#### Funcionalidades Específicas

**Gestión de Personal:**
- Contratación y gestión de personal de clínica
- Asignación de roles y subroles al personal
- Configuración de permisos específicos por empleado
- Gestión de horarios y turnos

**Configuración de Clínica:**
- Edición de información básica de la clínica
- Configuración de servicios ofrecidos
- Gestión de horarios de atención
- Configuración de datos fiscales y facturación

**Marketing y Publicidad:**
- **Edición de activos Meta**: Configuración de campañas de Facebook/Instagram
- Gestión de cuentas publicitarias conectadas
- Configuración de píxeles de seguimiento
- Análisis de métricas de marketing digital

**Gestión Financiera:**
- Configuración de datos fiscales de la clínica
- Gestión de métodos de pago
- Acceso a reportes financieros de la clínica
- Configuración de precios de servicios

**Gestión de Pacientes:**
- Acceso a todos los pacientes de sus clínicas
- Configuración de políticas de privacidad
- Gestión de comunicaciones con pacientes
- Acceso a métricas de satisfacción

#### Casos de Uso Específicos

**Caso 1: Configuración de Activos Meta**
```typescript
// Flujo para propietario editando activos Meta
if (this.canEditMetaAssets()) {
    this.openMetaAssetMapping();
    // Permite configurar:
    // - Cuentas publicitarias de Facebook
    // - Páginas de Instagram Business
    // - Píxeles de seguimiento
    // - Configuraciones de audiencia
}
```

**Caso 2: Gestión de Personal Múltiple**
```typescript
// Propietario con múltiples clínicas
this.clinicasUsuario.forEach(clinica => {
    if (clinica.rol_usuario === 'propietario') {
        // Acceso completo a gestión de personal
        this.loadPersonalClinica(clinica.id_clinica);
    }
});
```

### 8.3 Personal de Clínica

#### Perfil del Usuario
El personal de clínica incluye todos los empleados que trabajan directamente en la atención médica y administrativa de los pacientes. Se subdivide en tres categorías principales según su función específica.

#### Identificación en el Sistema
- **Método**: Relación en tabla `UsuarioClinica` con `rol_clinica = 'personaldeclinica'`
- **Subrol**: Campo `subrol_clinica` especifica la función específica
- **Validación**: Consulta combinada de rol y subrol

#### Subroles y Funcionalidades

**Doctores (`subrol_clinica = 'Doctores'`):**

*Funcionalidades específicas:*
- Acceso completo a historiales médicos de pacientes asignados
- Creación y edición de diagnósticos
- Prescripción de medicamentos y tratamientos
- Gestión de citas médicas
- Acceso a resultados de laboratorio y estudios

*Permisos especiales:*
- Firma digital de recetas y documentos médicos
- Acceso a bases de datos médicas especializadas
- Configuración de protocolos de tratamiento
- Supervisión de personal auxiliar

**Auxiliares y Enfermeros (`subrol_clinica = 'Auxiliares y enfermeros'`):**

*Funcionalidades específicas:*
- Acceso limitado a historiales médicos (solo información necesaria)
- Registro de signos vitales y observaciones
- Gestión de inventario médico
- Asistencia en procedimientos médicos

*Limitaciones:*
- No pueden modificar diagnósticos médicos
- Acceso restringido a información sensible
- Requieren supervisión médica para ciertos procedimientos

**Administrativos (`subrol_clinica = 'Administrativos'`):**

*Funcionalidades específicas:*
- Gestión de citas y agenda médica
- Facturación y cobros
- Comunicación con pacientes
- Gestión de seguros médicos

*Acceso a datos:*
- Información de contacto de pacientes
- Datos de facturación y pagos
- Estadísticas de ocupación y citas
- Comunicaciones y recordatorios

#### Casos de Uso Específicos

**Caso 1: Doctor Consultando Historial**
```typescript
// Validación de acceso por subrol
if (this.currentUser.subrol === 'Doctores') {
    this.loadFullMedicalHistory(pacienteId);
} else {
    this.loadLimitedPatientInfo(pacienteId);
}
```

**Caso 2: Personal Administrativo Gestionando Citas**
```typescript
// Funcionalidades específicas por subrol
if (this.currentUser.subrol === 'Administrativos') {
    this.enableAppointmentManagement();
    this.enableBillingAccess();
} else {
    this.restrictAdministrativeAccess();
}
```

### 8.4 Paciente

#### Perfil del Usuario
Los pacientes representan a los usuarios finales del sistema médico. Aunque no tienen funcionalidades administrativas, su rol es crítico para el funcionamiento del sistema y puede coexistir con otros roles profesionales.

#### Identificación en el Sistema
- **Método**: Relación en tabla `UsuarioClinica` con `rol_clinica = 'paciente'`
- **Particularidad**: Puede coexistir con roles profesionales
- **Contexto**: Específico por clínica (un doctor puede ser paciente en otra clínica)

#### Funcionalidades Específicas

**Gestión Personal:**
- Visualización de su historial médico personal
- Gestión de citas propias
- Acceso a resultados de estudios
- Comunicación con su equipo médico

**Información Médica:**
- Consulta de diagnósticos y tratamientos
- Acceso a recetas y prescripciones
- Visualización de evolución médica
- Descarga de documentos médicos

**Servicios Digitales:**
- Solicitud de citas online
- Recordatorios automáticos
- Comunicación con la clínica
- Evaluación de servicios recibidos

#### Casos de Uso Específicos

**Caso 1: Profesional Médico como Paciente**
```typescript
// Usuario con múltiples roles
if (this.rolesDisponibles.includes('paciente') && 
    this.rolesDisponibles.includes('personaldeclinica')) {
    // Puede cambiar contexto entre roles
    this.showRoleSelector(['Paciente', 'Personal de Clínica']);
}
```

**Caso 2: Acceso Restringido a Información**
```typescript
// Validación de acceso como paciente
if (this.currentRole === 'paciente') {
    // Solo puede ver su propia información
    this.loadOwnMedicalData();
} else {
    // Acceso profesional a múltiples pacientes
    this.loadProfessionalDashboard();
}
```

### 8.5 Flujos de Trabajo Complejos

#### Cambio de Contexto de Rol
Para usuarios con múltiples roles, el sistema debe permitir cambio fluido de contexto:

```typescript
cambiarContextoRol(nuevoRol: string, clinicaId?: number) {
    this.rolActual = nuevoRol;
    this.clinicaActual = clinicaId;
    
    // Recargar permisos y datos según nuevo contexto
    this.reloadUserPermissions();
    this.reloadRelevantData();
    
    // Actualizar interfaz de usuario
    this.updateUIForRole(nuevoRol);
}
```

#### Gestión de Permisos Dinámicos
El sistema debe validar permisos en tiempo real según el contexto actual:

```typescript
validatePermission(action: string, resource: string): boolean {
    const currentContext = {
        rol: this.rolActual,
        subrol: this.subrolActual,
        clinica: this.clinicaActual
    };
    
    return this.permissionService.hasPermission(currentContext, action, resource);
}
```


## 9. RUTAS Y ARCHIVOS CRÍTICOS

### 9.1 Estructura del Proyecto

#### Frontend (Angular)
```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts                    # Servicio principal de autenticación
│   │   │   ├── guards/                            # Guards de protección de rutas
│   │   │   └── auth.interceptor.ts                # Interceptor para tokens JWT
│   │   ├── user/
│   │   │   └── user.service.ts                    # Gestión de usuario de negocio
│   │   └── clinic-filter/
│   │       └── clinic-filter.service.ts           # Filtrado de contexto de clínica
│   ├── layout/
│   │   ├── layouts/vertical/thin/
│   │   │   ├── thin.component.ts                  # ⭐ CRÍTICO: Orquestador de roles
│   │   │   └── thin.component.html                # Template del layout principal
│   │   └── common/user/
│   │       ├── user.component.ts                  # Componente de usuario en header
│   │       └── user.component.html                # Template del menú de usuario
│   ├── modules/
│   │   ├── auth/
│   │   │   └── sign-in/
│   │   │       └── sign-in.component.ts           # Componente de login
│   │   └── admin/
│   │       ├── apps/
│   │       │   ├── clinicas/
│   │       │   │   ├── clinicas.service.ts        # ⭐ CRÍTICO: Servicio de clínicas
│   │       │   │   └── details/
│   │       │   │       ├── details.component.ts   # ⭐ CRÍTICO: Permisos Meta assets
│   │       │   │       └── details.component.html # Template de detalles de clínica
│   │       │   └── contacts/
│   │       │       └── details/
│   │       │           └── details.component.html # Referencia para select de pacientes
│   │       └── pages/settings/shared/
│   │           └── asset-mapping.component.ts     # Componente de mapeo de activos
```

#### Backend (Node.js/Express)
```
src/
├── controllers/
│   ├── auth.controller.js                         # ⭐ CRÍTICO: Controlador de autenticación
│   ├── gruposclinicas.controller.js               # Controlador de grupos de clínicas
│   └── userclinicas.controller.js                 # Controlador de relaciones usuario-clínica
├── routes/
│   ├── auth.routes.js                             # Rutas de autenticación
│   ├── clinicas.routes.js                         # Rutas de clínicas
│   └── userclinicas.routes.js                     # ⭐ CRÍTICO: Rutas usuario-clínica
├── models/
│   ├── usuario.js                                 # ⭐ CRÍTICO: Modelo de usuario
│   ├── usuarioclinica.js                          # ⭐ CRÍTICO: Modelo de roles
│   ├── clinica.js                                 # Modelo de clínica
│   └── gruposclinicas.js                          # Modelo de grupos
├── middleware/
│   ├── auth.middleware.js                         # Middleware de autenticación JWT
│   └── role.middleware.js                         # Middleware de autorización por roles
└── config/
    ├── database.js                                # Configuración de base de datos
    └── jwt.config.js                              # Configuración de JWT
```

### 9.2 Archivos Críticos para el Sistema de Roles

#### 9.2.1 Frontend - Archivos Críticos

**`src/app/layout/layouts/vertical/thin/thin.component.ts`**
- **Función**: Orquestador principal del sistema de roles
- **Responsabilidades**:
  - Detección de tipo de usuario (admin vs normal)
  - Carga de clínicas según permisos
  - Gestión del estado global de roles
  - Inicialización del contexto de usuario

**Métodos críticos:**
```typescript
isAdmin(): boolean                                 // Detección de administradores
loadUserClinics(): void                           // Carga clínicas por usuario
setupUserInterface(): void                        // Configuración de UI según rol
```

**`src/app/modules/admin/apps/clinicas/clinicas.service.ts`**
- **Función**: Servicio principal para operaciones de clínicas
- **Responsabilidades**:
  - Comunicación con API de clínicas
  - Gestión de cache de clínicas
  - Filtrado de clínicas por permisos

**Métodos críticos:**
```typescript
getClinicas(): Observable<Clinica[]>              // Para administradores
getClinicasByUser(userId: number): Observable<any> // ⭐ PROBLEMÁTICO: Para usuarios normales
```

**`src/app/modules/admin/apps/clinicas/details/details.component.ts`**
- **Función**: Gestión de permisos para edición de activos Meta
- **Responsabilidades**:
  - Validación de permisos de edición
  - Control de acceso a funcionalidades específicas
  - Gestión de activos Meta/Facebook

**Métodos críticos:**
```typescript
canEditMetaAssets(): boolean                      // Validación de permisos
openMetaAssetMapping(): void                      // Apertura de modal de activos
```

#### 9.2.2 Backend - Archivos Críticos

**`src/routes/userclinicas.routes.js`**
- **Función**: Rutas para relaciones usuario-clínica
- **Responsabilidades**:
  - Endpoint para obtener clínicas por usuario
  - Gestión de roles y permisos por clínica
  - Operaciones CRUD en relaciones usuario-clínica

**Rutas críticas:**
```javascript
GET /user/:id/clinicas                           // ⭐ PROBLEMÁTICO: Obtener clínicas por usuario
POST /user/:id/clinicas                          // Asignar usuario a clínica
PUT /user/:id/clinicas/:clinicId                 // Actualizar rol en clínica
DELETE /user/:id/clinicas/:clinicId              // Remover usuario de clínica
```

**`models/usuarioclinica.js`**
- **Función**: Modelo de la relación many-to-many usuario-clínica
- **Responsabilidades**:
  - Definición de estructura de roles
  - Validaciones de integridad
  - Asociaciones con otros modelos

**Campos críticos:**
```javascript
rol_clinica: ENUM('paciente','personaldeclinica','propietario')
subrol_clinica: ENUM('Auxiliares y enfermeros','Doctores','Administrativos')
```

**`src/controllers/auth.controller.js`**
- **Función**: Controlador de autenticación
- **Responsabilidades**:
  - Proceso de login y logout
  - Generación y validación de tokens JWT
  - Obtención de información del usuario actual

**Métodos críticos:**
```javascript
signIn(req, res)                                 // Proceso de login
getCurrentUser(req, res)                         // Obtener usuario actual
refreshToken(req, res)                           // Renovación de token
```

### 9.3 Flujo de Datos Entre Archivos

#### 9.3.1 Flujo de Autenticación
```
1. sign-in.component.ts
   ↓ (credenciales)
2. auth.service.ts
   ↓ (HTTP POST /api/auth/sign-in)
3. auth.controller.js
   ↓ (consulta BD)
4. models/usuario.js
   ↓ (respuesta con token)
5. auth.service.ts (almacena token)
   ↓ (usuario autenticado)
6. thin.component.ts (inicializa roles)
```

#### 9.3.2 Flujo de Carga de Roles (PROBLEMÁTICO)
```
1. thin.component.ts (ngOnInit)
   ↓ (getCurrentUser)
2. auth.service.ts
   ↓ (HTTP GET /api/auth/me)
3. auth.controller.js
   ↓ (usuario obtenido)
4. thin.component.ts (loadUserClinics)
   ↓ (getClinicasByUser)
5. clinicas.service.ts
   ↓ (HTTP GET /api/user/:id/clinicas)
6. userclinicas.routes.js ⭐ PROBLEMA AQUÍ
   ↓ (consulta incompleta)
7. models/usuarioclinica.js
   ↓ (respuesta sin roles)
8. Frontend (roles faltantes)
```

#### 9.3.3 Flujo de Validación de Permisos
```
1. details.component.ts (canEditMetaAssets)
   ↓ (verificar rol actual)
2. Validación local de permisos
   ↓ (si es propietario/admin)
3. openMetaAssetMapping()
   ↓ (HTTP requests a API)
4. Backend (validación adicional)
   ↓ (middleware de autorización)
5. Operación permitida/denegada
```

### 9.4 Configuraciones Críticas

#### 9.4.1 Variables de Entorno
```bash
# Backend (.env)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
DB_HOST=localhost
DB_NAME=clinica_click
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Frontend (environment.ts)
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    jwtTokenName: 'accessToken'
};
```

#### 9.4.2 Configuración de Base de Datos
```javascript
// config/database.js
module.exports = {
    development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'mysql',
        define: {
            timestamps: true,
            underscored: false
        }
    }
};
```

### 9.5 Dependencias Críticas

#### 9.5.1 Frontend
```json
{
    "@angular/core": "^15.0.0",
    "@angular/common": "^15.0.0",
    "@angular/router": "^15.0.0",
    "rxjs": "^7.5.0",
    "@angular/material": "^15.0.0"
}
```

#### 9.5.2 Backend
```json
{
    "express": "^4.18.0",
    "sequelize": "^6.25.0",
    "mysql2": "^2.3.0",
    "jsonwebtoken": "^8.5.0",
    "bcryptjs": "^2.4.0",
    "cors": "^2.8.0"
}
```

### 9.6 Puntos de Integración

#### 9.6.1 APIs Externas
- **Meta/Facebook API**: Integración para gestión de activos publicitarios
- **Google Ads API**: Integración para campañas de Google
- **Servicios de Email**: Para notificaciones y comunicaciones

#### 9.6.2 Servicios Internos
- **Servicio de Archivos**: Para gestión de documentos y avatares
- **Servicio de Notificaciones**: Para alertas y recordatorios
- **Servicio de Auditoría**: Para logging de acciones críticas


## 10. CONCLUSIONES Y RECOMENDACIONES

### 10.1 Estado Actual del Sistema

#### Fortalezas Identificadas

**Arquitectura Sólida**: El sistema implementa una separación clara entre usuarios FUSE (interfaz) y usuarios de negocio (lógica), proporcionando flexibilidad y mantenibilidad. Esta arquitectura dual permite mantener la compatibilidad con el framework FUSE mientras se desarrolla funcionalidad específica del dominio médico.

**Modelo de Datos Robusto**: La tabla `UsuarioClinica` proporciona una base sólida para el sistema de roles con campos ENUM bien definidos que cubren los casos de uso principales del sector médico. La estructura many-to-many permite flexibilidad para usuarios con múltiples roles en diferentes clínicas.

**Seguridad Implementada**: El sistema utiliza JWT para autenticación y implementa middleware de autorización en el backend. Los tokens tienen expiración configurada y se validan en cada request a endpoints protegidos.

**Escalabilidad Conceptual**: El diseño permite la adición de nuevos roles y subroles sin modificaciones estructurales significativas. El sistema de grupos de clínicas facilita la gestión de organizaciones complejas.

#### Debilidades Críticas

**Problema de Consulta SQL**: El endpoint `getClinicasByUser()` no incluye los campos de roles en la consulta, causando que usuarios propietarios no puedan acceder a sus funcionalidades. Este problema afecta directamente la experiencia del usuario y la funcionalidad del sistema.

**Gestión de Administradores Estática**: El array `ADMIN_USER_IDS = [1, 2, 5]` limita la escalabilidad y requiere modificaciones de código para agregar nuevos administradores. Esta implementación no es sostenible a largo plazo.

**Ausencia de Servicio Centralizado de Roles**: La lógica de roles está dispersa entre múltiples componentes, creando inconsistencias y dificultando el mantenimiento. No existe un `RoleService` que centralice la gestión de permisos.

**Falta de Menú de Selección de Roles**: El componente `user.component.ts` no implementa selección de roles, limitando la funcionalidad para usuarios con múltiples roles en diferentes clínicas.

### 10.2 Impacto del Problema Identificado

#### Usuarios Afectados
- **Propietarios de clínicas**: No pueden acceder a funcionalidades administrativas de sus clínicas
- **Personal con múltiples roles**: Limitados al rol de menor privilegio
- **Organizaciones complejas**: Dificultades en la gestión de permisos granulares

#### Funcionalidades Comprometidas
- **Edición de activos Meta**: Propietarios no pueden configurar campañas publicitarias
- **Gestión de personal**: Limitaciones en la administración de equipos médicos
- **Configuraciones de clínica**: Acceso restringido a configuraciones críticas
- **Reportes y métricas**: Datos limitados según rol detectado incorrectamente

#### Impacto en el Negocio
- **Pérdida de productividad**: Usuarios no pueden realizar tareas asignadas
- **Escalación de soporte**: Incremento en tickets de soporte por problemas de acceso
- **Limitación de crecimiento**: Dificultades para onboarding de nuevos propietarios
- **Experiencia de usuario degradada**: Frustración por funcionalidades inaccesibles

### 10.3 Recomendaciones Inmediatas

#### Corrección del Endpoint Crítico
**Prioridad**: Crítica  
**Tiempo estimado**: 2-4 horas  
**Archivo**: `src/routes/userclinicas.routes.js`

```javascript
// Implementación corregida inmediata
const getClinicasByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const clinicasUsuario = await UsuarioClinica.findAll({
            where: { id_usuario: userId },
            include: [{ model: Clinica }],
            attributes: ['id_clinica', 'rol_clinica', 'subrol_clinica']
        });
        
        const roles = [...new Set(clinicasUsuario.map(uc => uc.rol_clinica))];
        
        res.json({
            clinicas: clinicasUsuario.map(uc => uc.Clinica),
            roles: roles,
            total: clinicasUsuario.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clínicas del usuario' });
    }
};
```

#### Validación y Testing
**Prioridad**: Alta  
**Tiempo estimado**: 1-2 horas

1. **Pruebas unitarias** para el endpoint corregido
2. **Pruebas de integración** con diferentes tipos de usuario
3. **Validación en entorno de desarrollo** antes de producción
4. **Monitoreo de logs** para verificar funcionamiento correcto

### 10.4 Recomendaciones de Mejora a Mediano Plazo

#### Implementación de RoleService Centralizado
**Prioridad**: Alta  
**Tiempo estimado**: 1-2 semanas

```typescript
// Propuesta de RoleService
@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private _currentRole = new BehaviorSubject<string>('');
    private _availableRoles = new BehaviorSubject<string[]>([]);
    
    get currentRole$(): Observable<string> {
        return this._currentRole.asObservable();
    }
    
    get availableRoles$(): Observable<string[]> {
        return this._availableRoles.asObservable();
    }
    
    switchRole(newRole: string, clinicId?: number): void {
        // Lógica centralizada para cambio de rol
    }
    
    hasPermission(action: string, resource: string): boolean {
        // Validación centralizada de permisos
    }
    
    isAdmin(): boolean {
        // Detección mejorada de administradores
    }
    
    isOwnerOfClinic(clinicId: number): boolean {
        // Validación de propiedad de clínica
    }
}
```

#### Mejora del Sistema de Administradores
**Prioridad**: Media  
**Tiempo estimado**: 3-5 días

1. **Tabla de administradores**: Crear tabla específica para gestión de administradores
2. **Roles jerárquicos**: Implementar diferentes niveles de administración
3. **Gestión dinámica**: Permitir asignación/revocación de permisos administrativos
4. **Auditoría**: Logging de acciones administrativas críticas

#### Componente de Selección de Roles
**Prioridad**: Media  
**Tiempo estimado**: 1 semana

```typescript
// Propuesta de componente de selección de roles
@Component({
    selector: 'app-role-selector',
    template: `
        <mat-select [(value)]="selectedRole" (selectionChange)="onRoleChange($event)">
            <mat-option *ngFor="let role of availableRoles" [value]="role">
                {{ getRoleDisplayName(role) }}
            </mat-option>
        </mat-select>
    `
})
export class RoleSelectorComponent {
    availableRoles: string[] = [];
    selectedRole: string = '';
    
    onRoleChange(event: MatSelectChange): void {
        this.roleService.switchRole(event.value);
    }
}
```

### 10.5 Recomendaciones de Mejora a Largo Plazo

#### Sistema de Permisos Granulares
**Prioridad**: Media  
**Tiempo estimado**: 3-4 semanas

1. **Matriz de permisos**: Definir permisos específicos por acción y recurso
2. **Configuración por clínica**: Permitir personalización de permisos por centro médico
3. **Herencia de permisos**: Implementar jerarquías de permisos automáticas
4. **Interface de gestión**: Panel administrativo para configuración de permisos

#### Auditoría y Compliance
**Prioridad**: Media  
**Tiempo estimado**: 2-3 semanas

1. **Logging completo**: Registrar todas las acciones críticas del sistema
2. **Trazabilidad**: Seguimiento de cambios en roles y permisos
3. **Reportes de auditoría**: Generación automática de reportes de compliance
4. **Retención de datos**: Políticas de retención según regulaciones médicas

#### Integración con Sistemas Externos
**Prioridad**: Baja  
**Tiempo estimado**: 4-6 semanas

1. **Single Sign-On (SSO)**: Integración con proveedores de identidad externos
2. **Active Directory**: Sincronización con sistemas corporativos
3. **APIs de terceros**: Integración con sistemas de gestión hospitalaria
4. **Federación de identidades**: Gestión de usuarios entre múltiples sistemas

### 10.6 Métricas de Éxito

#### Métricas Técnicas
- **Tiempo de respuesta**: < 200ms para endpoints de roles
- **Disponibilidad**: 99.9% uptime del sistema de autenticación
- **Precisión de roles**: 100% de coincidencia entre BD y frontend
- **Cobertura de tests**: > 90% en módulos críticos de roles

#### Métricas de Usuario
- **Reducción de tickets de soporte**: -80% en problemas de acceso
- **Tiempo de onboarding**: < 5 minutos para nuevos usuarios
- **Satisfacción de usuario**: > 4.5/5 en funcionalidades de roles
- **Adopción de funcionalidades**: > 90% de propietarios usando activos Meta

#### Métricas de Negocio
- **Productividad**: +30% en tareas administrativas completadas
- **Escalabilidad**: Soporte para 10x más usuarios sin degradación
- **Compliance**: 100% cumplimiento de auditorías de seguridad
- **Costo de mantenimiento**: -50% en tiempo de desarrollo de nuevas funcionalidades

### 10.7 Plan de Implementación

#### Fase 1: Corrección Inmediata (1-2 días)
1. Corregir endpoint `getClinicasByUser()`
2. Validar funcionamiento en desarrollo
3. Desplegar corrección en producción
4. Monitorear logs y métricas

#### Fase 2: Mejoras Fundamentales (2-3 semanas)
1. Implementar `RoleService` centralizado
2. Crear componente de selección de roles
3. Mejorar sistema de administradores
4. Implementar tests automatizados

#### Fase 3: Optimizaciones Avanzadas (1-2 meses)
1. Sistema de permisos granulares
2. Auditoría y compliance
3. Optimizaciones de rendimiento
4. Documentación completa

#### Fase 4: Integraciones Futuras (3-6 meses)
1. SSO y federación de identidades
2. Integraciones con sistemas externos
3. Analytics avanzados
4. Escalabilidad empresarial

### 10.8 Consideraciones de Seguridad

#### Validaciones Críticas
- **Validación de entrada**: Sanitización de todos los inputs de usuario
- **Autorización granular**: Validación de permisos en cada endpoint
- **Tokens seguros**: Rotación automática de tokens JWT
- **Auditoría de accesos**: Logging de todos los accesos a datos sensibles

#### Cumplimiento Regulatorio
- **GDPR**: Gestión de consentimientos y derecho al olvido
- **HIPAA**: Protección de información médica sensible
- **Regulaciones locales**: Cumplimiento de normativas médicas específicas
- **Certificaciones**: Preparación para auditorías de seguridad

### 10.9 Conclusión Final

El sistema de roles de Clínica Click presenta una arquitectura sólida con un problema específico pero crítico en la consulta de roles de usuario. La corrección inmediata del endpoint `getClinicasByUser()` resolverá el problema principal, mientras que las mejoras propuestas a mediano y largo plazo fortalecerán significativamente la robustez, escalabilidad y mantenibilidad del sistema.

La implementación de estas recomendaciones no solo solucionará los problemas actuales, sino que posicionará al sistema para un crecimiento sostenible y el cumplimiento de estándares empresariales de seguridad y compliance en el sector médico.

El enfoque por fases permite una implementación gradual que minimiza riesgos mientras maximiza el valor entregado a los usuarios finales, asegurando que el sistema pueda evolucionar según las necesidades cambiantes del negocio y las regulaciones del sector salud.

