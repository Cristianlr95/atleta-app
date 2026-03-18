import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { ApiService } from 'src/app/core/services/api.service';
import {
  CreateFieldLocationRequest,
  FieldLocation,
  UpdateFieldLocationRequest,
} from '../models/field-location.models';

@Injectable({ providedIn: 'root' })
export class FieldLocationsApiService extends ApiService {
  getFieldLocations(ciudad?: string, soloActivas = true) {
    return this.get<FieldLocation[]>(API_ENDPOINTS.fields.base, {
      params: {
        ciudad: ciudad?.trim() || undefined,
        soloActivas,
      },
    });
  }

  createFieldLocation(payload: CreateFieldLocationRequest) {
    return this.post<FieldLocation, CreateFieldLocationRequest>(API_ENDPOINTS.fields.base, payload);
  }

  updateFieldLocation(id: number, payload: UpdateFieldLocationRequest) {
    return this.put<FieldLocation, UpdateFieldLocationRequest>(`${API_ENDPOINTS.fields.base}/${id}`, payload);
  }
}
