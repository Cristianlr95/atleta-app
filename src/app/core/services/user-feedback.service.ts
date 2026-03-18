import { Injectable } from '@angular/core';
import { ApiError } from '../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class UserFeedbackService {
  registerError(error: ApiError): string {
    const rawMessage = (error.message ?? '').toLowerCase();

    if (error.status === 409) {
      return 'Usuario ya creado. Ya existe una cuenta con ese correo.';
    }

    if (error.status === 400) {
      return 'Datos invalidos. Revisa nombre, correo y contrasena.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar al servidor. Verifica que el backend este activo.';
    }

    if (rawMessage.includes('email') && (rawMessage.includes('exists') || rawMessage.includes('existe'))) {
      return 'Usuario ya creado. Ya existe una cuenta con ese correo.';
    }

    if (rawMessage.includes('conflict') || rawMessage.includes('duplicate') || rawMessage.includes('duplicado')) {
      return 'No se pudo crear la cuenta porque ya existe un usuario similar.';
    }

    return 'No fue posible crear la cuenta. Intenta nuevamente.';
  }

  loginError(error: ApiError): string {
    const rawMessage = (error.message ?? '').toLowerCase();

    if (error.status === 401) {
      return 'Correo o contrasena incorrectos.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para ingresar en este momento.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar al servidor. Verifica que el backend este activo.';
    }

    if (rawMessage.includes('access token') || rawMessage.includes('token')) {
      return 'La respuesta de autenticacion no fue valida. Intenta nuevamente.';
    }

    return 'No fue posible iniciar sesion. Intenta nuevamente.';
  }

  onboardingError(error: ApiError): string {
    const rawMessage = (error.message ?? '').toLowerCase();

    if (error.status === 409) {
      if (rawMessage.includes('alias')) {
        return 'Ese alias ya esta en uso. Elige otro.';
      }
      return 'Tu perfil de jugador ya fue creado anteriormente.';
    }

    if (error.status === 404) {
      return 'No se encontraron datos necesarios para completar el perfil.';
    }

    if (error.status === 400) {
      if (rawMessage.includes('prioridad') || rawMessage.includes('posicion')) {
        return 'Revisa las posiciones seleccionadas. Deben ser validas y sin repetir.';
      }
      return 'Datos invalidos para completar el perfil.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar al servidor. Verifica que el backend este activo.';
    }

    return 'No fue posible completar tu configuracion. Intenta nuevamente.';
  }
}
