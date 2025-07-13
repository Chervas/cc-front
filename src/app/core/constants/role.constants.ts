import { UserRole } from '../services/role.service'; // ✅ ÚNICA CORRECCIÓN: Ruta correcta

// 🎯 CONFIGURACIÓN CENTRALIZADA CON SEGURIDAD
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
    
    // 🎨 COLORES POR ROL
    ROLE_COLORS: {
        [UserRole.ADMIN]: '#ff4444',
        [UserRole.PROPIETARIO]: '#4CAF50',
        [UserRole.DOCTOR]: '#2196F3',
        [UserRole.PERSONAL_CLINICA]: '#FF9800',
        [UserRole.PACIENTE]: '#9C27B0'
    },
    
    // 🎨 ICONOS POR ROL
    ROLE_ICONS: {
        [UserRole.ADMIN]: 'heroicons_outline:cog-6-tooth',
        [UserRole.PROPIETARIO]: 'heroicons_outline:building-office',
        [UserRole.DOCTOR]: 'heroicons_outline:user-plus',
        [UserRole.PERSONAL_CLINICA]: 'heroicons_outline:users',
        [UserRole.PACIENTE]: 'heroicons_outline:user'
    },
    
    // 🔐 PERMISOS POR ROL (granulares y seguros)
    ROLE_PERMISSIONS: {
        [UserRole.ADMIN]: [
            '*', // Todos los permisos
            'system.manage',
            'users.manage',
            'clinics.manage',
            'reports.view_all',
            'settings.manage'
        ],
        [UserRole.PROPIETARIO]: [
            'clinic.manage',
            'clinic.view_patients',
            'clinic.manage_staff',
            'clinic.view_reports',
            'clinic.manage_settings',
            'assets.map',
            'appointments.manage'
        ],
        [UserRole.DOCTOR]: [
            'clinic.view_patients',
            'clinic.manage_appointments',
            'clinic.view_medical_records',
            'clinic.create_prescriptions',
            'reports.view_own'
        ],
        [UserRole.PERSONAL_CLINICA]: [
            'clinic.view_patients',
            'clinic.basic_operations',
            'appointments.view',
            'appointments.create'
        ],
        [UserRole.PACIENTE]: [
            'profile.view_own',
            'profile.edit_own',
            'appointments.view_own',
            'medical_records.view_own'
        ]
    },

    // 🔐 ACCIONES SENSIBLES QUE REQUIEREN VALIDACIÓN ADICIONAL
    SENSITIVE_ACTIONS: {
        'assets.map': [UserRole.ADMIN, UserRole.PROPIETARIO],
        'clinic.manage_settings': [UserRole.ADMIN, UserRole.PROPIETARIO],
        'users.manage': [UserRole.ADMIN],
        'system.manage': [UserRole.ADMIN],
        'clinic.delete': [UserRole.ADMIN],
        'data.export': [UserRole.ADMIN, UserRole.PROPIETARIO]
    },

    // 🔐 CONFIGURACIÓN DE SEGURIDAD
    SECURITY: {
        // Tiempo máximo de inactividad antes de revalidar roles (minutos)
        MAX_IDLE_TIME: 30,
        
        // Intervalo de validación automática de roles (minutos)
        ROLE_VALIDATION_INTERVAL: 5,
        
        // Tiempo máximo de caché de roles (minutos)
        MAX_ROLE_CACHE_TIME: 10,
        
        // Número máximo de intentos de cambio de rol por minuto
        MAX_ROLE_CHANGES_PER_MINUTE: 10,
        
        // Roles que requieren autenticación adicional
        REQUIRE_2FA: [UserRole.ADMIN],
        
        // Logs de seguridad habilitados
        SECURITY_LOGGING: true
    }
};

// 🎯 JERARQUÍA DE ROLES (para validaciones de permisos)
export const ROLE_HIERARCHY = {
    [UserRole.ADMIN]: 5,
    [UserRole.PROPIETARIO]: 4,
    [UserRole.DOCTOR]: 3,
    [UserRole.PERSONAL_CLINICA]: 2,
    [UserRole.PACIENTE]: 1
};

// 🔐 VALIDACIONES DE SEGURIDAD
export const SECURITY_RULES = {
    // Roles que pueden ver otros usuarios
    CAN_VIEW_USERS: [UserRole.ADMIN, UserRole.PROPIETARIO],
    
    // Roles que pueden gestionar clínicas
    CAN_MANAGE_CLINICS: [UserRole.ADMIN, UserRole.PROPIETARIO],
    
    // Roles que pueden acceder a reportes
    CAN_VIEW_REPORTS: [UserRole.ADMIN, UserRole.PROPIETARIO, UserRole.DOCTOR],
    
    // Roles que pueden mapear activos
    CAN_MAP_ASSETS: [UserRole.ADMIN, UserRole.PROPIETARIO],
    
    // Roles que requieren validación periódica
    REQUIRE_PERIODIC_VALIDATION: [UserRole.ADMIN, UserRole.PROPIETARIO],
    
    // Roles que pueden cambiar configuraciones del sistema
    CAN_CHANGE_SYSTEM_SETTINGS: [UserRole.ADMIN]
};

// 🎨 CONFIGURACIÓN DE UI POR ROL
export const UI_CONFIG = {
    // Menús disponibles por rol
    AVAILABLE_MENUS: {
        [UserRole.ADMIN]: ['dashboard', 'users', 'clinics', 'reports', 'settings', 'system'],
        [UserRole.PROPIETARIO]: ['dashboard', 'patients', 'staff', 'reports', 'settings', 'assets'],
        [UserRole.DOCTOR]: ['dashboard', 'patients', 'appointments', 'medical-records'],
        [UserRole.PERSONAL_CLINICA]: ['dashboard', 'patients', 'appointments'],
        [UserRole.PACIENTE]: ['dashboard', 'profile', 'appointments', 'medical-records']
    },
    
    // Acciones rápidas por rol
    QUICK_ACTIONS: {
        [UserRole.ADMIN]: ['create-user', 'create-clinic', 'view-system-logs'],
        [UserRole.PROPIETARIO]: ['add-patient', 'add-staff', 'view-reports', 'map-assets'],
        [UserRole.DOCTOR]: ['add-patient', 'create-appointment', 'view-schedule'],
        [UserRole.PERSONAL_CLINICA]: ['add-patient', 'create-appointment'],
        [UserRole.PACIENTE]: ['book-appointment', 'view-history']
    }
};

// 🔐 MENSAJES DE SEGURIDAD
export const SECURITY_MESSAGES = {
    UNAUTHORIZED_ROLE_CHANGE: 'No tienes permisos para cambiar a este rol',
    TOKEN_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    INVALID_PERMISSIONS: 'No tienes permisos para realizar esta acción',
    ROLE_VALIDATION_FAILED: 'Error validando tus permisos. Contacta al administrador',
    SESSION_TIMEOUT: 'Sesión cerrada por inactividad',
    SUSPICIOUS_ACTIVITY: 'Actividad sospechosa detectada. Sesión cerrada por seguridad'
};

