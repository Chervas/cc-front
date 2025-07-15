# 📚 Documentación Completa: Sistema de Roles, Filtros y Grupos de Clínicas + OAuth Meta
## ClinicaClick - Sistema Integral de Gestión
## 📅 **Última Actualización:** Enero 2025 - Estado: OAuth Meta Funcionando + Sistema de Roles Completo

---

## 🎯 **OBJETIVO DE ESTA DOCUMENTACIÓN**

Esta documentación explica de manera exhaustiva cómo funciona el sistema completo de ClinicaClick, incluyendo:
- Sistema de roles, filtros y grupos de clínicas
- Sistema OAuth Meta completamente funcional
- Mapeo de activos Meta a clínicas
- Arquitectura de usuarios dual (Fuse vs Backend)
- Flujos completos de autenticación y autorización

---

## 📋 **ÍNDICE**

1. [Sistema de Usuarios y Roles](#sistema-usuarios-roles)
2. [Sistema OAuth Meta - FUNCIONANDO](#sistema-oauth-meta)
3. [Detección de Administradores](#deteccion-administradores)
4. [Sistema de Grupos de Clínicas](#sistema-grupos-clinicas)
5. [Selector de Clínicas (Menú de Iniciales)](#selector-clinicas)
6. [Filtros por Clínica en Vistas](#filtros-vistas)
7. [Mapeo de Activos Meta](#mapeo-activos-meta)
8. [Implementación en Pacientes](#implementacion-pacientes)
9. [Flujo Completo del Sistema](#flujo-completo)
10. [Endpoints y APIs](#endpoints-apis)
11. [Archivos y Ubicaciones](#archivos-ubicaciones)

---

## 🔐 **1. SISTEMA DE USUARIOS Y ROLES** {#sistema-usuarios-roles}

### **1.1 Arquitectura Dual de Usuarios**

El sistema maneja **DOS modelos de usuario diferentes**:

#### **A) Usuario de FUSE (UI/UX)**
- **📍 Ubicación:** `src/app/layout/common/user/user.component.ts`
- **🎯 Propósito:** Solo para elementos visuales del template
- **📊 Campos:**
  - `user.id` (string) - ID interno de Fuse
  - `user.email` - Email para mostrar en UI
  - `user.name` - Nombre para mostrar en header
  - `user.avatar` - Avatar para mostrar
  - `user.status` - Estado visual

#### **B) Usuario Real (Lógica de Negocio)**
- **📍 Ubicación:** `src/app/core/user/user.service.ts`
- **🎯 Propósito:** Autenticación, OAuth2, permisos, clínicas
- **📊 Campos:**
  - `user.id_usuario` (number) - ID real de base de datos
  - `user.email_usuario` - Email real del usuario
  - `user.nombre` - Nombre real
  - `user.apellidos` - Apellidos
  - **Relaciones:** Clínicas, roles, permisos

### **1.2 Mapeo Automático**

**📍 Ubicación:** `src/app/core/user/user.service.ts`

El `UserService` mapea automáticamente entre ambos modelos:
```typescript
// Mapeo de campos para compatibilidad
user.name = usuario.nombre + ' ' + usuario.apellidos;
user.email = usuario.email_usuario;
user.id = usuario.id_usuario.toString(); // String para Fuse
```

### **1.3 Reglas Críticas**

⚠️ **IMPORTANTE:**
- **Para UI:** Usar `user.name`, `user.email` del modelo Fuse
- **Para OAuth2/Backend:** Usar `user.id_usuario` del UserService
- **NUNCA** usar `user.id` (string) para lógica de negocio
- **OAuth2** usa `getUserIdForOAuth()` que devuelve `user.id_usuario` real

---

## 🔗 **2. SISTEMA OAUTH META - FUNCIONANDO** {#sistema-oauth-meta}

### **2.1 Estado Actual: ✅ COMPLETAMENTE FUNCIONAL**

**Fecha de Resolución:** Enero 2025

#### **🎉 Características Funcionando:**

1. **✅ Conexión OAuth2 Meta**
   - Autorización completa con Meta
   - Intercambio de tokens de larga duración
   - Almacenamiento seguro en base de datos

2. **✅ Obtención de Activos**
   - 107 páginas de Facebook
   - 50 cuentas de Instagram Business
   - 65 cuentas publicitarias
   - Paginación completa de API Meta

3. **✅ Mapeo de Activos**
   - Stepper de 3 pasos funcional
   - Selección múltiple de activos
   - Asignación a múltiples clínicas
   - Inserción exitosa en base de datos

4. **✅ Validación y Seguridad**
   - Verificación de tokens JWT
   - Validación de permisos por usuario
   - Manejo de errores completo

### **2.2 Arquitectura OAuth Meta**

#### **🔹 Modelos de Base de Datos:**

**MetaConnection:**
```javascript
// cc-back/models/MetaConnection.js
{
    id: INTEGER (PK),
    userId: INTEGER,        // ID del usuario en ClinicaClick
    metaUserId: STRING,     // ID del usuario en Meta
    accessToken: TEXT,      // Token de larga duración (60 días)
    expiresAt: DATE,        // Fecha de expiración
    userName: STRING,       // Nombre del usuario Meta
    userEmail: STRING       // Email del usuario Meta
}
```

**ClinicMetaAsset:**
```javascript
// cc-back/models/ClinicMetaAsset.js
{
    id: INTEGER (PK),
    clinicaId: INTEGER,           // ID de la clínica
    metaConnectionId: INTEGER,    // Referencia a MetaConnection
    assetType: ENUM([             // ✅ ENUM CORRECTO
        'facebook_page',
        'instagram_business',     // ✅ NO 'instagram_business_account'
        'ad_account'
    ]),
    metaAssetId: STRING,          // ID del activo en Meta
    metaAssetName: STRING,        // Nombre del activo
    pageAccessToken: TEXT,        // Token específico de página
    isActive: BOOLEAN,            // Estado del mapeo
    additionalData: JSON          // Datos extra (followers, etc.)
}
```

#### **🔹 Flujo OAuth2:**

```
1. Usuario → Settings → "Conectar Meta"
2. Redirección a Meta con state=userId
3. Usuario autoriza en Meta
4. Callback con código de autorización
5. Backend intercambia código por token
6. Almacenamiento en MetaConnection
7. Redirección con éxito/error
8. Frontend muestra estado actualizado
```

### **2.3 Componente de Mapeo**

**📍 Ubicación:** `src/app/modules/admin/pages/settings/shared/asset-mapping.component.ts`

#### **🔹 Stepper de 3 Pasos:**

**Paso 1: Selección de Activos**
- Expansión por tipo (Facebook, Instagram, Ad Accounts)
- Información rica (avatares, métricas, verificación)
- Selección múltiple con checkboxes
- Búsqueda y filtrado

**Paso 2: Asignación a Clínicas**
- Lista de clínicas con permisos del usuario
- Selección múltiple de clínicas destino
- Resumen de activos seleccionados
- Validación de selecciones

**Paso 3: Confirmación**
- Resumen visual completo
- Cálculo de mapeos a crear
- Confirmación final
- Envío al backend

#### **🔹 Mapeo de Tipos (CRÍTICO):**

```typescript
/**
 * ✅ MÉTODO CRÍTICO: Mapear tipo de activo para el backend
 * IMPORTANTE: El backend espera 'instagram_business', NO 'instagram_business_account'
 */
private mapAssetTypeForBackend(frontendType: string): string {
    switch (frontendType) {
        case 'facebook_page': return 'facebook_page';
        case 'instagram_business': return 'instagram_business'; // ✅ CORREGIDO
        case 'ad_account': return 'ad_account';
        default: return frontendType;
    }
}
```

### **2.4 Endpoints OAuth Meta**

#### **🔹 Endpoints Funcionando:**

1. **GET `/oauth/meta/callback`** - Callback de autorización
2. **GET `/oauth/meta/connection-status`** - Estado de conexión
3. **GET `/oauth/meta/assets`** - Obtener activos Meta
4. **POST `/oauth/meta/map-assets`** - ✅ **FUNCIONANDO** - Mapear activos
5. **DELETE `/oauth/meta/disconnect`** - Desconectar Meta

#### **🔹 Respuesta de Mapeo Exitoso:**

```json
{
    "message": "Activos de Meta mapeados correctamente.",
    "assets": [
        {
            "id": 43,
            "clinicaId": 1,
            "metaConnectionId": 67,
            "assetType": "facebook_page",
            "metaAssetId": "733324556521013",
            "metaAssetName": "Gemini S.L.",
            "pageAccessToken": null,
            "isActive": true,
            "updatedAt": "2025-01-11T15:52:42.192Z",
            "createdAt": "2025-01-11T15:52:42.192Z"
        }
    ]
}
```

---

## 🔧 **3. DETECCIÓN DE ADMINISTRADORES** {#deteccion-administradores}

### **3.1 Método Principal**

**📍 Ubicación:** `src/app/layout/layouts/vertical/thin/thin.component.ts` (línea 101)

```typescript
private isAdmin(): boolean {
    if (!this.currentUser?.id_usuario) {
        return false;
    }
    return this.ADMIN_USER_IDS.includes(this.currentUser.id_usuario);
}
```

### **3.2 Array de Administradores**

```typescript
// Array que define qué usuarios son administradores
ADMIN_USER_IDS = [1, 2, 5]; // IDs de usuarios administradores
```

### **3.3 Lógica Diferenciada por Rol**

**📍 Ubicación:** `thin.component.ts` (líneas 124-152)

```typescript
if (this.isAdmin()) {
    console.log('🔧 Usuario administrador detectado (ID:', user.id_usuario, ')');
    // Para el admin, obtener TODAS las clínicas del sistema
    this.contactsService.getClinicas().subscribe((allClinicas: any[]) => {
        // Procesar todas las clínicas
    });
} else {
    console.log('👤 Usuario regular detectado (ID:', user.id_usuario, ')');
    // Para usuarios regulares, solo sus clínicas asignadas
    this.contactsService.getClinicasByUser(user.id_usuario).subscribe((userClinicas: any[]) => {
        // Procesar solo clínicas del usuario
    });
}
```

### **3.4 Diferencias por Rol**

#### **👑 Administradores (IDs: 1, 2, 5):**
- ✅ **Acceso completo:** Todas las clínicas del sistema
- ✅ **Sin restricciones:** Pueden ver/editar cualquier clínica
- ✅ **Gestión OAuth:** Pueden mapear activos Meta a cualquier clínica
- ✅ **Vista global:** Selector muestra todas las clínicas

#### **👤 Usuarios Regulares:**
- ⚠️ **Acceso limitado:** Solo clínicas asignadas en `UsuarioClinica`
- ⚠️ **Restricciones:** No pueden acceder a clínicas no asignadas
- ⚠️ **OAuth limitado:** Solo pueden mapear a sus clínicas
- ⚠️ **Vista filtrada:** Selector muestra solo sus clínicas

---

## 🏥 **4. SISTEMA DE GRUPOS DE CLÍNICAS** {#sistema-grupos-clinicas}

### **4.1 Modelo GrupoClinica**

**📍 Ubicación:** `cc-back/models/grupoclinica.js`

```javascript
// Modelo para agrupar clínicas relacionadas
GrupoClinica.init({
    id_grupo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_grupo: DataTypes.STRING,
    descripcion_grupo: DataTypes.TEXT,
    fecha_creacion: DataTypes.DATE,
    configuracion_grupo: DataTypes.JSON,
    estado_grupo: DataTypes.ENUM(['activo', 'inactivo'])
});
```

### **4.2 Relación Clínica-Grupo**

**📍 Ubicación:** `cc-back/models/clinica.js`

```javascript
// Cada clínica puede pertenecer a un grupo
Clinica.init({
    // ... otros campos
    grupoClinicaId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'GrupoClinicas',
            key: 'id_grupo'
        }
    }
});
```

### **4.3 Uso en el Frontend**

**📍 Ubicación:** `src/app/layout/layouts/vertical/thin/thin.component.ts`

```typescript
// Agrupación automática por grupo
private groupClinicasByGroup(clinicas: any[]): any {
    const grouped = {};
    
    clinicas.forEach(clinica => {
        const groupName = clinica.grupoNombre || 'Sin Grupo';
        if (!grouped[groupName]) {
            grouped[groupName] = [];
        }
        grouped[groupName].push(clinica);
    });
    
    return grouped;
}
```

---

## 🎯 **5. SELECTOR DE CLÍNICAS (MENÚ DE INICIALES)** {#selector-clinicas}

### **5.1 Componente Principal**

**📍 Ubicación:** `src/app/layout/layouts/vertical/thin/thin.component.ts`

#### **🔹 Estructura del Selector:**

```html
<!-- Botón principal con inicial de clínica actual -->
<button class="clinic-selector-button">
    <div class="clinic-initial">{{ getCurrentClinicInitial() }}</div>
    <span class="clinic-name">{{ currentClinica?.nombre || 'Seleccionar' }}</span>
</button>

<!-- Menú desplegable con todas las clínicas -->
<div class="clinic-dropdown">
    <div *ngFor="let group of groupedClinicas | keyvalue" class="clinic-group">
        <div class="group-header">{{ group.key }}</div>
        <div *ngFor="let clinica of group.value" class="clinic-item">
            <div class="clinic-initial">{{ getClinicInitial(clinica.nombre) }}</div>
            <span class="clinic-name">{{ clinica.nombre }}</span>
        </div>
    </div>
</div>
```

#### **🔹 Lógica de Iniciales:**

```typescript
// Generar inicial de clínica
getClinicInitial(nombre: string): string {
    if (!nombre) return '?';
    
    // Tomar primera letra de cada palabra significativa
    const words = nombre.split(' ').filter(word => 
        word.length > 2 && !['de', 'del', 'la', 'el', 'y'].includes(word.toLowerCase())
    );
    
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else {
        return nombre.substring(0, 2).toUpperCase();
    }
}
```

### **5.2 Estados del Selector**

#### **🔹 Estado Inicial (Sin Clínica):**
```
┌─────────────────────┐
│  ?   Seleccionar    │
└─────────────────────┘
```

#### **🔹 Estado con Clínica Seleccionada:**
```
┌─────────────────────┐
│  CD  Clínica Dental │
└─────────────────────┘
```

#### **🔹 Menú Desplegable:**
```
┌─────────────────────────────────┐
│ Grupo Madrid                    │
│  CD  Clínica Dental Centro      │
│  DN  Dental Norte               │
│                                 │
│ Grupo Barcelona                 │
│  DB  Dental Barcelona           │
│  CB  Centro Bucal               │
│                                 │
│ Sin Grupo                       │
│  CM  Clínica Móstoles          │
└─────────────────────────────────┘
```

### **5.3 Persistencia de Selección**

**📍 Ubicación:** `thin.component.ts`

```typescript
// Guardar selección en localStorage
selectClinica(clinica: any): void {
    this.currentClinica = clinica;
    localStorage.setItem('selectedClinica', JSON.stringify(clinica));
    
    // Emitir evento para actualizar filtros
    this.clinicaSelectionService.setSelectedClinica(clinica);
    
    // Actualizar rutas y filtros
    this.updateFiltersForSelectedClinica();
}

// Recuperar selección al cargar
ngOnInit(): void {
    const saved = localStorage.getItem('selectedClinica');
    if (saved) {
        this.currentClinica = JSON.parse(saved);
    }
}
```

---

## 🔍 **6. FILTROS POR CLÍNICA EN VISTAS** {#filtros-vistas}

### **6.1 Servicio de Filtros**

**📍 Ubicación:** `src/app/core/services/clinica-selection.service.ts`

```typescript
@Injectable({
    providedIn: 'root'
})
export class ClinicaSelectionService {
    private selectedClinicaSubject = new BehaviorSubject<any>(null);
    public selectedClinica$ = this.selectedClinicaSubject.asObservable();
    
    setSelectedClinica(clinica: any): void {
        this.selectedClinicaSubject.next(clinica);
    }
    
    getSelectedClinica(): any {
        return this.selectedClinicaSubject.value;
    }
}
```

### **6.2 Implementación en Componentes**

**📍 Ejemplo:** `src/app/modules/admin/pages/pacientes/pacientes.component.ts`

```typescript
export class PacientesComponent implements OnInit {
    selectedClinica: any = null;
    filteredPacientes: any[] = [];
    
    ngOnInit(): void {
        // Suscribirse a cambios de clínica
        this.clinicaSelectionService.selectedClinica$.subscribe(clinica => {
            this.selectedClinica = clinica;
            this.applyClinicaFilter();
        });
        
        // Cargar datos iniciales
        this.loadPacientes();
    }
    
    private applyClinicaFilter(): void {
        if (!this.selectedClinica) {
            this.filteredPacientes = this.allPacientes;
            return;
        }
        
        this.filteredPacientes = this.allPacientes.filter(paciente => 
            paciente.clinicaId === this.selectedClinica.id
        );
    }
}
```

### **6.3 Filtros Automáticos**

#### **🔹 Tipos de Filtros:**

1. **Filtro por ID de Clínica:**
   ```typescript
   // Para datos con campo clinicaId directo
   data.filter(item => item.clinicaId === selectedClinica.id)
   ```

2. **Filtro por Relación:**
   ```typescript
   // Para datos con relaciones complejas
   data.filter(item => item.clinica?.id === selectedClinica.id)
   ```

3. **Filtro por Array:**
   ```typescript
   // Para usuarios con múltiples clínicas
   data.filter(item => item.clinicaIds?.includes(selectedClinica.id))
   ```

#### **🔹 Aplicación Automática:**

```typescript
// Interceptor que aplica filtros automáticamente
@Injectable()
export class ClinicaFilterInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const selectedClinica = this.clinicaSelectionService.getSelectedClinica();
        
        if (selectedClinica && this.shouldApplyFilter(req.url)) {
            const filteredReq = req.clone({
                setParams: { clinicaId: selectedClinica.id.toString() }
            });
            return next.handle(filteredReq);
        }
        
        return next.handle(req);
    }
}
```

---

## 🎯 **7. MAPEO DE ACTIVOS META** {#mapeo-activos-meta}

### **7.1 Integración con Sistema de Clínicas**

El mapeo de activos Meta se integra perfectamente con el sistema de clínicas:

#### **🔹 Para Administradores:**
```typescript
// En asset-mapping.component.ts
async loadAvailableClinics(): Promise<void> {
    if (this.isAdmin()) {
        // Administradores ven TODAS las clínicas
        this.availableClinics = await this.clinicaService.getAllClinics();
    } else {
        // Usuarios regulares solo ven sus clínicas
        this.availableClinics = await this.clinicaService.getUserClinics(this.currentUser.id_usuario);
    }
}
```

#### **🔹 Validación de Permisos:**
```typescript
// Verificar que el usuario puede mapear a la clínica seleccionada
private validateClinicaPermissions(clinicaId: number): boolean {
    if (this.isAdmin()) {
        return true; // Administradores pueden mapear a cualquier clínica
    }
    
    // Usuarios regulares solo a sus clínicas asignadas
    return this.availableClinics.some(clinica => clinica.id === clinicaId);
}
```

### **7.2 Flujo de Mapeo Completo**

```
1. Usuario conecta Meta → OAuth2 → MetaConnection creada
2. Usuario accede a "Mapear Activos" → Carga activos de Meta
3. Paso 1: Selecciona activos (Facebook, Instagram, Ad Accounts)
4. Paso 2: Selecciona clínicas (filtradas por permisos)
5. Paso 3: Confirma mapeo → Envío al backend
6. Backend: Validación + Inserción en ClinicMetaAsset
7. Frontend: Confirmación de éxito
```

### **7.3 Uso en Campañas**

```typescript
// Futuro: Selector de activos en creación de campañas
export class CampaignCreationComponent {
    async loadAvailableAssets(): Promise<void> {
        const selectedClinica = this.clinicaSelectionService.getSelectedClinica();
        
        if (selectedClinica) {
            // Cargar solo activos mapeados a la clínica actual
            this.availableAssets = await this.oauthService.getAssetsByClinica(selectedClinica.id);
        }
    }
}
```

---

## 👥 **8. IMPLEMENTACIÓN EN PACIENTES** {#implementacion-pacientes}

### **8.1 Componente Pacientes**

**📍 Ubicación:** `src/app/modules/admin/pages/pacientes/pacientes.component.ts`

#### **🔹 Filtrado Automático:**

```typescript
export class PacientesComponent implements OnInit, OnDestroy {
    // Datos
    allPacientes: any[] = [];
    filteredPacientes: any[] = [];
    selectedClinica: any = null;
    
    // Suscripciones
    private destroy$ = new Subject<void>();
    
    ngOnInit(): void {
        // Suscribirse a cambios de clínica seleccionada
        this.clinicaSelectionService.selectedClinica$
            .pipe(takeUntil(this.destroy$))
            .subscribe(clinica => {
                this.selectedClinica = clinica;
                this.applyFilters();
            });
        
        // Cargar datos iniciales
        this.loadPacientes();
    }
    
    private applyFilters(): void {
        if (!this.selectedClinica) {
            // Sin clínica seleccionada: mostrar todos (solo para admin)
            this.filteredPacientes = this.allPacientes;
        } else {
            // Con clínica seleccionada: filtrar por clínica
            this.filteredPacientes = this.allPacientes.filter(paciente => 
                paciente.clinicaId === this.selectedClinica.id
            );
        }
        
        console.log(`📊 Pacientes filtrados: ${this.filteredPacientes.length} de ${this.allPacientes.length}`);
    }
}
```

#### **🔹 Indicadores Visuales:**

```html
<!-- Header con información de filtro -->
<div class="filter-info" *ngIf="selectedClinica">
    <mat-chip color="primary">
        <mat-icon>business</mat-icon>
        {{ selectedClinica.nombre }}
    </mat-chip>
    <span class="patient-count">{{ filteredPacientes.length }} pacientes</span>
</div>

<!-- Lista de pacientes filtrada -->
<mat-table [dataSource]="filteredPacientes">
    <!-- Columnas de la tabla -->
</mat-table>
```

### **8.2 Creación de Pacientes**

```typescript
// Al crear un paciente, asignar automáticamente a clínica seleccionada
createPaciente(pacienteData: any): void {
    const selectedClinica = this.clinicaSelectionService.getSelectedClinica();
    
    if (selectedClinica) {
        pacienteData.clinicaId = selectedClinica.id;
    }
    
    this.pacientesService.createPaciente(pacienteData).subscribe(response => {
        this.loadPacientes(); // Recargar lista
    });
}
```

---

## 🔄 **9. FLUJO COMPLETO DEL SISTEMA** {#flujo-completo}

### **9.1 Flujo de Autenticación**

```
1. Usuario hace login → AuthService valida credenciales
2. Backend devuelve JWT + datos de usuario
3. UserService mapea usuario real ↔ usuario Fuse
4. Layout detecta si es admin o usuario regular
5. Carga clínicas según permisos (todas vs asignadas)
6. Genera selector de clínicas con iniciales
7. Usuario selecciona clínica → Filtros se aplican automáticamente
```

### **9.2 Flujo de OAuth Meta**

```
1. Usuario va a Settings → Connected Accounts
2. Click "Conectar Meta" → OAuth2 flow
3. Meta autoriza → Callback con código
4. Backend intercambia código por token → MetaConnection
5. Frontend muestra "Meta Conectado"
6. Click "Mapear Activos" → Asset Mapping Component
7. Stepper: Seleccionar activos → Asignar clínicas → Confirmar
8. Backend crea registros en ClinicMetaAsset
9. Activos disponibles para uso en campañas
```

### **9.3 Flujo de Filtros**

```
1. Usuario selecciona clínica en selector
2. ClinicaSelectionService emite evento
3. Todos los componentes suscritos reciben la clínica
4. Cada componente aplica su filtro específico
5. Datos se actualizan automáticamente
6. Selección se persiste en localStorage
```

---

## 🔗 **10. ENDPOINTS Y APIS** {#endpoints-apis}

### **10.1 Endpoints de Clínicas**

#### **🔹 Backend (cc-back):**

```javascript
// Obtener todas las clínicas (solo admin)
GET /api/clinicas
// Respuesta: Array de todas las clínicas del sistema

// Obtener clínicas de un usuario específico
GET /api/clinicas/user/:userId
// Respuesta: Array de clínicas asignadas al usuario

// Obtener clínica específica
GET /api/clinicas/:id
// Respuesta: Datos completos de la clínica
```

#### **🔹 Frontend Services:**

```typescript
// src/app/core/services/clinica.service.ts
@Injectable()
export class ClinicaService {
    getAllClinics(): Observable<any[]> {
        return this.http.get<any[]>('/api/clinicas');
    }
    
    getUserClinics(userId: number): Observable<any[]> {
        return this.http.get<any[]>(`/api/clinicas/user/${userId}`);
    }
    
    getClinicById(id: number): Observable<any> {
        return this.http.get<any>(`/api/clinicas/${id}`);
    }
}
```

### **10.2 Endpoints OAuth Meta**

#### **🔹 Endpoints Funcionando:**

```javascript
// Conexión y estado
GET  /oauth/meta/connection-status  // Estado de conexión del usuario
GET  /oauth/meta/callback          // Callback de autorización Meta
DELETE /oauth/meta/disconnect      // Desconectar Meta

// Gestión de activos
GET  /oauth/meta/assets           // ✅ Obtener activos Meta (paginación completa)
POST /oauth/meta/map-assets       // ✅ Mapear activos a clínicas (FUNCIONANDO)

// Gestión de mapeos (pendientes)
GET  /oauth/meta/mappings         // 🔄 Obtener mapeos existentes
DELETE /oauth/meta/unmap-asset    // 🔄 Desmapear activo específico
```

#### **🔹 Estructura de Respuestas:**

**Obtener Activos:**
```json
{
    "success": true,
    "user_info": { "id": "123", "name": "Usuario" },
    "assets": {
        "facebook_pages": [...],
        "instagram_business_accounts": [...],
        "ad_accounts": [...]
    },
    "total_assets": 222
}
```

**Mapear Activos:**
```json
{
    "message": "Activos de Meta mapeados correctamente.",
    "assets": [
        {
            "id": 43,
            "clinicaId": 1,
            "metaConnectionId": 67,
            "assetType": "facebook_page",
            "metaAssetId": "733324556521013",
            "metaAssetName": "Gemini S.L.",
            "isActive": true
        }
    ]
}
```

---

## 📁 **11. ARCHIVOS Y UBICACIONES** {#archivos-ubicaciones}

### **11.1 Backend (cc-back)**

```
models/
├── usuario.js                    ← Modelo de usuarios
├── clinica.js                   ← Modelo de clínicas
├── grupoclinica.js              ← Modelo de grupos
├── usuarioclinica.js            ← Relación usuario-clínica
├── MetaConnection.js            ← ✅ Conexiones OAuth Meta
└── ClinicMetaAsset.js           ← ✅ Mapeos activos-clínicas

src/routes/
├── clinicas.routes.js           ← Endpoints de clínicas
├── usuarios.routes.js           ← Endpoints de usuarios
└── oauth.routes.js              ← ✅ Endpoints OAuth Meta (FUNCIONANDO)

src/controllers/
├── auth.controllers.js          ← Autenticación y JWT
└── clinicas.controllers.js      ← Lógica de clínicas
```

### **11.2 Frontend (cc-front)**

```
src/app/core/
├── user/
│   ├── user.service.ts          ← ✅ Servicio de usuarios (mapeo dual)
│   └── user.types.ts            ← Tipos de usuario
├── services/
│   ├── clinica-selection.service.ts  ← Servicio de selección de clínicas
│   ├── clinica.service.ts       ← Servicio de clínicas
│   └── oauth.service.ts         ← ✅ Servicio OAuth Meta
└── auth/
    └── auth.service.ts          ← Autenticación

src/app/layout/layouts/vertical/thin/
├── thin.component.ts            ← ✅ Layout principal con selector de clínicas
├── thin.component.html          ← Template del layout
└── thin.component.scss          ← Estilos del selector

src/app/modules/admin/pages/
├── settings/
│   ├── connected-accounts/
│   │   ├── connected-accounts.component.ts    ← ✅ Gestión OAuth Meta
│   │   └── connected-accounts.component.html  ← Template OAuth
│   └── shared/
│       ├── asset-mapping.component.ts         ← ✅ Componente de mapeo (FUNCIONANDO)
│       └── asset-mapping.component.html       ← ✅ Stepper de 3 pasos
├── pacientes/
│   ├── pacientes.component.ts   ← Ejemplo de filtros por clínica
│   └── pacientes.component.html ← Template con filtros
└── [otros módulos]/
    └── *.component.ts           ← Implementan filtros similares
```

### **11.3 Archivos de Configuración**

```
cc-back/
├── .env                         ← Variables de entorno (JWT_SECRET pendiente)
├── config/database.js           ← Configuración de base de datos
└── package.json                 ← Dependencias backend

cc-front/
├── src/environments/
│   ├── environment.ts           ← Configuración desarrollo
│   └── environment.prod.ts      ← Configuración producción
├── angular.json                 ← Configuración Angular
└── package.json                 ← Dependencias frontend
```

---

## 🚀 **PRÓXIMOS DESARROLLOS**

### **Fase Actual: OAuth Meta Funcionando ✅**
- ✅ Conexión OAuth2 completa
- ✅ Mapeo de activos funcionando
- ✅ Integración con sistema de clínicas
- ✅ Validación de permisos

### **Fase 2: Visualización y Gestión**
- 🔄 **Endpoint GET `/oauth/meta/mappings`** - Obtener mapeos existentes
- 🔄 **Mostrar mapeos en interfaz** - Lista de activos mapeados por clínica
- 🔄 **Recarga automática** - Actualizar vista después de mapeo exitoso
- 🔄 **Gestión de mapeos** - Editar/eliminar mapeos existentes

### **Fase 3: Integración Avanzada**
- 🔄 **Vista de clínica individual** - Mostrar activos Meta en dashboard de clínica
- 🔄 **Selector en campañas** - Usar activos mapeados en creación de campañas
- 🔄 **Sincronización automática** - Actualizar métricas de activos Meta

### **Fase 4: Optimización y Seguridad**
- 🔄 **Cache de activos Meta** - Evitar llamadas repetidas a API
- 🔄 **Renovación automática de tokens** - Gestión proactiva de expiración
- 🔄 **Migración JWT a variables de entorno** - Mejorar seguridad
- 🔄 **Roles granulares** - Permisos específicos por tipo de activo

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Seguridad**
- ✅ Tokens Meta de larga duración (60 días)
- ✅ Validación de permisos por usuario y clínica
- ⚠️ JWT hardcodeado (migración pendiente)
- ✅ Soft delete para auditoría

### **Rendimiento**
- ✅ Paginación completa de API Meta (hasta 50 páginas)
- ✅ Filtros automáticos en frontend
- 🔄 Cache de activos (pendiente)
- 🔄 Lazy loading de componentes (pendiente)

### **Escalabilidad**
- ✅ Arquitectura modular y extensible
- ✅ Servicios reutilizables
- ✅ Componentes standalone
- ✅ Separación clara de responsabilidades

---

**Documentación actualizada:** 11 de Enero, 2025  
**Versión:** 4.0 - Sistema Completo Integrado  
**Estado:** ✅ OAuth Meta funcionando + Sistema de roles y clínicas completo

**Próximo objetivo:** Implementar visualización de mapeos existentes y gestión completa de activos Meta por clínica.

