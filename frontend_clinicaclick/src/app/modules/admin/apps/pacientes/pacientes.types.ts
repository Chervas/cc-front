// src/app/modules/admin/apps/pacientes/pacientes.types.ts
import { Clinica } from 'app/modules/admin/apps/clinicas/clinicas.types';

export interface Paciente {
  id_paciente: string;
  nombre: string;
  apellidos: string;
  dni?: string;
  telefono_movil: string;
  email?: string;
  telefono_secundario?: string;
  foto?: string;
  fecha_nacimiento?: Date;
  edad?: number;
  estatura?: number;
  peso?: number;
  sexo?: string;
  profesion?: string;
  fecha_alta: Date;
  fecha_baja?: Date;
  alergias?: string;
  antecedentes?: string;
  medicacion?: string;
  paciente_conocido: boolean;
  como_nos_conocio?: 'redes sociales' | 'buscadores' | 'recomendación' | 'otros';
  procedencia?: number;
  clinica_id: number;
  clinica?: Clinica;
}
