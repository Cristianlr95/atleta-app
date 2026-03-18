import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError } from '../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class HttpErrorService {
  map(error: HttpErrorResponse): ApiError {
    const fallbackMessage = 'An unexpected error occurred. Please try again.';
    const payload = error.error as Record<string, unknown> | null;

    return {
      status: error.status,
      message: this.extractMessage(payload) ?? error.message ?? fallbackMessage,
      details: payload ?? undefined,
      code: this.extractCode(payload),
    };
  }

  private extractMessage(payload: Record<string, unknown> | null): string | null {
    if (!payload) {
      return null;
    }

    const raw = payload['message'] ?? payload['error'] ?? payload['detail'];
    return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
  }

  private extractCode(payload: Record<string, unknown> | null): string | undefined {
    if (!payload) {
      return undefined;
    }

    const raw = payload['code'];
    return typeof raw === 'string' && raw.trim().length > 0 ? raw : undefined;
  }
}
