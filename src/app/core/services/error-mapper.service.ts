import { Injectable } from '@angular/core';
import { ApiError } from '../models/api-error.model';

export type ErrorContext = 'default' | 'social' | 'matches' | 'invitations';

@Injectable({ providedIn: 'root' })
export class ErrorMapperService {
  toUserMessage(error: unknown, context: ErrorContext = 'default'): string {
    const apiError = this.asApiError(error);
    const status = apiError?.status ?? 0;
    const raw = this.extractRawMessage(error, apiError).toLowerCase();

    if (context === 'matches') {
      if (raw.includes('sin genero definido')) {
        return 'Hay jugadores sin genero definido. Completa su perfil antes de armar equipos.';
      }
      if (raw.includes('solo mujeres')) {
        return 'Convocatoria solo mujeres: no puedes asignar hombres.';
      }
      if (raw.includes('solo hombres')) {
        return 'Convocatoria solo hombres: no puedes asignar mujeres.';
      }
      if (
        raw.includes('balance por genero') ||
        raw.includes('diferencia maxima de 1') ||
        raw.includes('convocatoria mixta')
      ) {
        return 'En mixto, cada equipo debe quedar equilibrado por genero (misma cantidad o diferencia maxima de 1).';
      }
    }

    if ((status === 0 && !raw) || raw.includes('timeout') || raw.includes('failed to fetch')) {
      return 'No se pudo conectar al servidor. Intenta nuevamente.';
    }

    if (status === 401) {
      return 'Tu sesion expiro. Vuelve a iniciar sesion.';
    }

    if (status === 403) {
      return context === 'matches'
        ? 'No tienes permisos para esta accion del partido.'
        : 'No tienes permisos para esta accion.';
    }

    if (status === 404) {
      return context === 'matches'
        ? 'No encontramos este partido.'
        : 'No se encontro la informacion solicitada.';
    }

    if (context === 'matches') {
      if (raw.includes('ventana de 3 horas') || raw.includes('se supero la ventana')) {
        return 'Ya pasaron mas de 3 horas desde el inicio. No se pueden cargar o cerrar eventos.';
      }
      if (raw.includes('solo el creador o capitanes')) {
        return 'Solo el creador o capitanes pueden realizar esta accion.';
      }
      if (raw.includes('eventos pendientes de confirmacion')) {
        return 'Aun hay eventos por confirmar antes de finalizar el partido.';
      }
      if (raw.includes('partido iniciado')) {
        return 'El partido debe estar iniciado para registrar o confirmar eventos.';
      }
    }

    if (status >= 500) {
      return 'Tuvimos un problema en el servidor. Reintenta en unos segundos.';
    }

    if (context === 'invitations') {
      return 'No se pudo procesar la invitacion. Intenta nuevamente.';
    }

    if (context === 'social') {
      return 'No se pudo completar la accion social. Intenta nuevamente.';
    }

    if (context === 'matches') {
      return 'No se pudo completar la accion del partido. Intenta nuevamente.';
    }

    return 'No se pudo completar la accion. Intenta nuevamente.';
  }

  private asApiError(error: unknown): ApiError | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const candidate = error as Partial<ApiError>;
    if (typeof candidate.status === 'number' || typeof candidate.message === 'string') {
      return {
        status: typeof candidate.status === 'number' ? candidate.status : 0,
        message: typeof candidate.message === 'string' ? candidate.message : '',
        details: candidate.details,
        code: candidate.code,
      };
    }

    return null;
  }

  private extractRawMessage(error: unknown, apiError: ApiError | null): string {
    if (apiError?.message) {
      return apiError.message;
    }

    if (error instanceof Error && typeof error.message === 'string') {
      return error.message;
    }

    if (error && typeof error === 'object') {
      const candidate = error as Record<string, unknown>;
      const message = candidate['message'];
      if (typeof message === 'string') {
        return message;
      }
    }

    return '';
  }
}
