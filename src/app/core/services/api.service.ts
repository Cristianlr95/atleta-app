import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { APP_CONFIG } from '../config/app-config.token';
import { HttpErrorService } from './http-error.service';

export type ApiQueryParams =
  | HttpParams
  | Record<string, string | number | boolean | null | undefined>;

export interface ApiRequestOptions {
  params?: ApiQueryParams;
  headers?: HttpHeaders | Record<string, string | string[]>;
}

export abstract class ApiService {
  protected readonly http = inject(HttpClient);

  private readonly appConfig = inject(APP_CONFIG);
  private readonly httpErrorService = inject(HttpErrorService);

  protected get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .get<T>(this.url(path), this.httpOptions(options))
      .pipe(catchError((error) => throwError(() => this.normalizeError(error))));
  }

  protected post<TResponse, TPayload>(
    path: string,
    payload: TPayload,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    return this.http
      .post<TResponse>(this.url(path), payload, this.httpOptions(options))
      .pipe(catchError((error) => throwError(() => this.normalizeError(error))));
  }

  protected put<TResponse, TPayload>(
    path: string,
    payload: TPayload,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    return this.http
      .put<TResponse>(this.url(path), payload, this.httpOptions(options))
      .pipe(catchError((error) => throwError(() => this.normalizeError(error))));
  }

  protected patch<TResponse, TPayload>(
    path: string,
    payload: TPayload,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    return this.http
      .patch<TResponse>(this.url(path), payload, this.httpOptions(options))
      .pipe(catchError((error) => throwError(() => this.normalizeError(error))));
  }

  protected delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .delete<T>(this.url(path), this.httpOptions(options))
      .pipe(catchError((error) => throwError(() => this.normalizeError(error))));
  }

  protected url(path: string): string {
    if (!path.startsWith('/')) {
      throw new Error(`API path must start with '/'. Received: ${path}`);
    }

    return `${this.appConfig.apiBaseUrl}${path}`;
  }

  private httpOptions(options?: ApiRequestOptions): {
    params?: HttpParams;
    headers?: HttpHeaders | Record<string, string | string[]>;
  } {
    if (!options) {
      return {};
    }

    return {
      headers: options.headers,
      params: this.normalizeParams(options.params),
    };
  }

  private normalizeParams(params?: ApiQueryParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    if (params instanceof HttpParams) {
      return params;
    }

    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }

  private normalizeError(error: unknown): unknown {
    return error instanceof HttpErrorResponse ? this.httpErrorService.map(error) : error;
  }
}
