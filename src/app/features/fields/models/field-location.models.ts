export interface FieldLocation {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateFieldLocationRequest {
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  activo?: boolean;
}

export interface UpdateFieldLocationRequest extends CreateFieldLocationRequest {
  activo: boolean;
}
