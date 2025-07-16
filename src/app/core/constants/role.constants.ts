/**
 * 📋 Constantes del Sistema de Roles - ClinicaClick
 * 
 * Definiciones centralizadas de roles, permisos, colores e iconos
 * para mantener consistencia en toda la aplicación.
 */

// 🎭 Tipos de roles disponibles en el sistema
export type RolClinica = 'paciente' | 'personaldeclinica' | 'propietario';

// 🔐 Permisos disponibles en el sistema
export type Permission = 
    | 'clinic.manage'
    | 'users.manage'
    | 'patients.manage'
    | 'patients.view'
    | 'patients.edit'
    | 'appointments.manage'
    | 'appointments.view'
    | 'appointments.view.own'
    | 'appointments.create'
    | 'reports.view'
    | 'settings.modify'
    | 'profile.edit.own';

// 🎨 Colores para cada rol
export const ROL_COLORS: Record<RolClinica, string> = {
    'propietario': '#e91e63',      // Rosa/Magenta - Autoridad máxima
    'personaldeclinica': '#2196f3', // Azul - Profesional médico
    'paciente': '#4caf50'          // Verde - Usuario final
};

// 🏷️ Etiquetas legibles para cada rol
export const ROL_LABELS: Record<RolClinica, string> = {
    'propietario': 'Propietario',
    'personaldeclinica': 'Personal de Clínica',
    'paciente': 'Paciente'
};

// 🎯 Iconos para cada rol (usando Material Icons disponibles)
export const ROL_ICONS: Record<RolClinica, string> = {
    'propietario': 'business',           // ✅ Icono de negocio/empresa
    'personaldeclinica': 'medical_services', // ✅ Icono de servicios médicos
    'paciente': 'person'                 // ✅ Icono de persona
};

// 📊 Niveles jerárquicos de roles (para comparaciones)
export const ROL_LEVELS: Record<RolClinica, number> = {
    'propietario': 4,        // Nivel más alto
    'personaldeclinica': 2,  // Nivel medio
    'paciente': 1            // Nivel básico
};

// 🔐 Permisos por rol
export const ROL_PERMISSIONS: Record<RolClinica, Permission[]> = {
    'propietario': [
        'clinic.manage',
        'users.manage',
        'patients.manage',
        'patients.view',
        'patients.edit',
        'appointments.manage',
        'appointments.view',
        'appointments.create',
        'reports.view',
        'settings.modify',
        'profile.edit.own'
    ],
    'personaldeclinica': [
        'patients.view',
        'patients.edit',
        'appointments.view',
        'appointments.create',
        'profile.edit.own'
    ],
    'paciente': [
        'appointments.view.own',
        'profile.edit.own'
    ]
};

// 🎨 Configuración de iconos adicionales para la aplicación
export const ADDITIONAL_ICONS = {
    // Iconos de redes sociales (para evitar errores)
    social: {
        facebook: 'facebook',      // ✅ Registrado en app.config.ts
        google: 'google',          // ✅ Registrado en app.config.ts
        instagram: 'camera_alt',   // ✅ Material Icon disponible
        twitter: 'alternate_email', // ✅ Material Icon disponible
        linkedin: 'work'           // ✅ Material Icon disponible
    },
    
    // Iconos de funcionalidades
    features: {
        dashboard: 'dashboard',
        patients: 'people',
        appointments: 'event',
        reports: 'assessment',
        settings: 'settings',
        logout: 'exit_to_app',
        profile: 'account_circle',
        clinic: 'local_hospital',
        calendar: 'calendar_today',
        notifications: 'notifications'
    },
    
    // Iconos de estados
    status: {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info',
        loading: 'hourglass_empty'
    }
};

// 🔧 Configuración global del sistema de roles
export const ROLE_CONFIG = {
    ROL_COLORS,
    ROL_LABELS,
    ROL_ICONS,
    ROL_LEVELS,
    ROL_PERMISSIONS,
    ADDITIONAL_ICONS,
    
    // Configuración adicional
    DEFAULT_ROLE: 'paciente' as RolClinica,
    ADMIN_ROLES: ['propietario'] as RolClinica[],
    MEDICAL_ROLES: ['propietario', 'personaldeclinica'] as RolClinica[],
    
    // Configuración de UI
    UI: {
        SHOW_ROLE_BADGES: true,
        SHOW_PERMISSION_TOOLTIPS: true,
        ANIMATE_ROLE_CHANGES: true,
        DEFAULT_AVATAR_COLOR: '#9e9e9e'
    }
};

// 📋 Exportaciones para compatibilidad
export {
    ROL_COLORS as ROLE_COLORS,
    ROL_LABELS as ROLE_LABELS,
    ROL_ICONS as ROLE_ICONS,
    ROL_LEVELS as ROLE_LEVELS,
    ROL_PERMISSIONS as ROLE_PERMISSIONS
};

