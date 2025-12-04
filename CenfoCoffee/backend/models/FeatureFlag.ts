// Modelo de entidad Feature Flag
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  value: boolean; // Estado activo/inactivo del flag
  created_at: string;
  updated_at: string;
}

// Cuerpo de solicitud para crear nuevos feature flags
export interface CreateFeatureFlagRequest {
  name: string;
  description?: string;
  value?: boolean; // Por defecto false si no se proporciona
}

// Cuerpo de solicitud para actualizar feature flags (todos los campos opcionales)
export interface UpdateFeatureFlagRequest {
  name?: string;
  description?: string;
  value?: boolean;
}

// Respuesta de API para creación de feature flag
export interface CreateFeatureFlagResponse {
  message: string;
  featureFlag: FeatureFlag;
}

// Respuesta de API para actualización de feature flag
export interface UpdateFeatureFlagResponse {
  message: string;
  featureFlag: FeatureFlag;
}

// Respuesta de API para listar todos los feature flags
export interface GetFeatureFlagsResponse {
  featureFlags: FeatureFlag[];
}

// Respuesta de API para un solo feature flag
export interface GetFeatureFlagResponse {
  featureFlag: FeatureFlag;
}