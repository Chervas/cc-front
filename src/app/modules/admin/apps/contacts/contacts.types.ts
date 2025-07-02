import { Clinica } from '../clinicas/clinicas.types'; // Importa Clinica desde el archivo correcto

export interface Contact {
    id_usuario: string;
    avatar?: string | null;
    subrol?: string;   // nuevo campo
    nombre: string;
    apellidos?: string;
    email_usuario: string;
    email_factura?: string;
    email_notificacion?: string;
    fecha_creacion: Date;
    id_gestor?: number;
    password_usuario: string;
    notas_usuario?: string;
    telefono?: string;
    cargo_usuario?: string | null;
    cumpleanos?: string | null;
    // Nuevo campo global para determinar si el usuario es profesional de la salud
    isProfesional?: boolean;
    clinicas?: Clinica[]; // Relaciones con clínicas
  }  

export interface CreateUserResponse {
    message: string;
    user: Contact;
}

// Exporta Clinica
export { Clinica };
