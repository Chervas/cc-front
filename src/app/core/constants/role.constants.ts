// 🎭 CONSTANTES DE ROLES - VALORES CORRECTOS DEL SISTEMA
// Basado en la estructura real: admin, propietario, personal_clinica, paciente

export enum UserRole {
    ADMIN = 'admin',
    PROPIETARIO = 'propietario', 
    PERSONAL_CLINICA = 'personal_clinica',
    PACIENTE = 'paciente'
}

// Subroles para PERSONAL_CLINICA
export enum SubRolPersonalClinica {
    DOCTOR = 'doctor',
    AUXILIAR = 'auxiliar'
}

// Configuración de roles con sus permisos
export const ROLE_CONFIG = {
    [UserRole.ADMIN]: {
        label: 'Administrador',
        permissions: [
            'READ_ALL',
            'WRITE_ALL', 
            'DELETE_ALL',
            'ADMIN_ACCESS',
            'MANAGE_USERS',
            'MANAGE_CLINICS',
            'MANAGE_ROLES',
            'VIEW_REPORTS',
            'SYSTEM_CONFIG'
        ],
        color: 'warn',
        icon: 'admin_panel_settings',
        priority: 1
    },
    [UserRole.PROPIETARIO]: {
        label: 'Propietario',
        permissions: [
            'READ_CLINIC',
            'WRITE_CLINIC',
            'MANAGE_STAFF',
            'VIEW_CLINIC_REPORTS',
            'MANAGE_SERVICES',
            'MANAGE_APPOINTMENTS',
            'VIEW_FINANCES'
        ],
        color: 'accent',
        icon: 'business',
        priority: 2
    },
    [UserRole.PERSONAL_CLINICA]: {
        label: 'Personal de Clínica',
        permissions: [
            'READ_PATIENTS',
            'WRITE_PATIENTS',
            'READ_APPOINTMENTS',
            'WRITE_APPOINTMENTS',
            'VIEW_SCHEDULES'
        ],
        color: 'primary',
        icon: 'medical_services',
        priority: 3,
        subRoles: {
            [SubRolPersonalClinica.DOCTOR]: {
                label: 'Doctor',
                additionalPermissions: [
                    'WRITE_PRESCRIPTIONS',
                    'VIEW_MEDICAL_HISTORY',
                    'MANAGE_TREATMENTS',
                    'APPROVE_PROCEDURES'
                ],
                icon: 'local_hospital'
            },
            [SubRolPersonalClinica.AUXILIAR]: {
                label: 'Auxiliar',
                additionalPermissions: [
                    'SCHEDULE_APPOINTMENTS',
                    'UPDATE_PATIENT_INFO',
                    'MANAGE_INVENTORY'
                ],
                icon: 'support_agent'
            }
        }
    },
    [UserRole.PACIENTE]: {
        label: 'Paciente',
        permissions: [
            'VIEW_OWN_PROFILE',
            'UPDATE_OWN_PROFILE',
            'VIEW_OWN_APPOINTMENTS',
            'REQUEST_APPOINTMENTS',
            'VIEW_OWN_HISTORY'
        ],
        color: 'accent',
        icon: 'person',
        priority: 4
    }
};

// Permisos por defecto para cada rol
export const DEFAULT_PERMISSIONS = {
    [UserRole.ADMIN]: ROLE_CONFIG[UserRole.ADMIN].permissions,
    [UserRole.PROPIETARIO]: ROLE_CONFIG[UserRole.PROPIETARIO].permissions,
    [UserRole.PERSONAL_CLINICA]: ROLE_CONFIG[UserRole.PERSONAL_CLINICA].permissions,
    [UserRole.PACIENTE]: ROLE_CONFIG[UserRole.PACIENTE].permissions
};

// Función para obtener permisos de personal de clínica con subrol
export function getPersonalClinicaPermissions(subRol?: SubRolPersonalClinica): string[] {
    const basePermissions = ROLE_CONFIG[UserRole.PERSONAL_CLINICA].permissions;
    
    if (!subRol) return basePermissions;
    
    const subRoleConfig = ROLE_CONFIG[UserRole.PERSONAL_CLINICA].subRoles?.[subRol];
    if (!subRoleConfig) return basePermissions;
    
    return [...basePermissions, ...subRoleConfig.additionalPermissions];
}

// Función para verificar si un rol es válido
export function isValidRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
}

// Función para verificar si un subrol es válido
export function isValidSubRole(subRole: string): subRole is SubRolPersonalClinica {
    return Object.values(SubRolPersonalClinica).includes(subRole as SubRolPersonalClinica);
}

// Jerarquía de roles (para comparaciones de autoridad)
export const ROLE_HIERARCHY = {
    [UserRole.ADMIN]: 1,
    [UserRole.PROPIETARIO]: 2,
    [UserRole.PERSONAL_CLINICA]: 3,
    [UserRole.PACIENTE]: 4
};

// Función para comparar autoridad entre roles
export function hasHigherAuthority(role1: UserRole, role2: UserRole): boolean {
    return ROLE_HIERARCHY[role1] < ROLE_HIERARCHY[role2];
}

// Roles que pueden gestionar otros roles
export const MANAGEMENT_ROLES = [UserRole.ADMIN, UserRole.PROPIETARIO];

// Roles que requieren verificación profesional
export const PROFESSIONAL_ROLES = [UserRole.PERSONAL_CLINICA];

// Configuración de colores para UI
export const ROLE_COLORS = {
    [UserRole.ADMIN]: '#f44336',        // Rojo
    [UserRole.PROPIETARIO]: '#9c27b0',  // Púrpura
    [UserRole.PERSONAL_CLINICA]: '#2196f3', // Azul
    [UserRole.PACIENTE]: '#4caf50'      // Verde
};

// 🎭 AÑADIR AL FINAL DE role.constants.ts

// Mensajes de seguridad para el sistema
export const SECURITY_MESSAGES = {
    ACCESS_DENIED: 'Acceso denegado. No tienes permisos suficientes.',
    ROLE_REQUIRED: 'Se requiere un rol específico para acceder a esta función.',
    PERMISSION_REQUIRED: 'Se requieren permisos específicos para realizar esta acción.',
    INVALID_ROLE: 'El rol especificado no es válido.',
    INVALID_PERMISSION: 'El permiso especificado no es válido.',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    UNAUTHORIZED: 'No estás autorizado para realizar esta acción.'
};

// Etiquetas legibles para roles
export const ROLE_LABELS = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.PROPIETARIO]: 'Propietario',
    [UserRole.PERSONAL_CLINICA]: 'Personal de Clínica',
    [UserRole.PACIENTE]: 'Paciente'
};

// Iconos para cada rol
export const ROLE_ICONS = {
    [UserRole.ADMIN]: 'admin_panel_settings',
    [UserRole.PROPIETARIO]: 'business',
    [UserRole.PERSONAL_CLINICA]: 'medical_services',
    [UserRole.PACIENTE]: 'person'
};

// ACTUALIZAR EL EXPORT DEFAULT PARA INCLUIR LOS NUEVOS EXPORTS:
export default {
    UserRole,
    SubRolPersonalClinica,
    ROLE_CONFIG,
    DEFAULT_PERMISSIONS,
    getPersonalClinicaPermissions,
    isValidRole,
    isValidSubRole,
    ROLE_HIERARCHY,
    hasHigherAuthority,
    MANAGEMENT_ROLES,
    PROFESSIONAL_ROLES,
    ROLE_COLORS,
    SECURITY_MESSAGES,    // ← NUEVO
    ROLE_LABELS,         // ← NUEVO
    ROLE_ICONS          // ← NUEVO
};



