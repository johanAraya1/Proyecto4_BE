import { Request, Response } from 'express';
import {
  createFeatureFlag,
  getAllFeatureFlags,
  getFeatureFlagById,
  getFeatureFlagByName,
  updateFeatureFlag,
  deleteFeatureFlag,
  toggleFeatureFlag
} from '../services/featureFlagService';
import { telemetryService } from '../services/telemetryService';
import {
  CreateFeatureFlagRequest,
  CreateFeatureFlagResponse,
  UpdateFeatureFlagRequest,
  UpdateFeatureFlagResponse,
  GetFeatureFlagsResponse,
  GetFeatureFlagResponse
} from '../models/FeatureFlag';

// Manejador HTTP para POST /api/feature-flags - crea nuevo feature flag
export const createFeatureFlagController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, value }: CreateFeatureFlagRequest = req.body;

    if (!name || name.trim() === '') {
      telemetryService.incrementEvent('feature_flag_create_validation_failed');
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }

    const featureFlag = await createFeatureFlag({ name, description, value });
    telemetryService.incrementEvent('feature_flag_create_success');

    const response: CreateFeatureFlagResponse = {
      message: 'Feature flag creado exitosamente',
      featureFlag
    };

    res.status(201).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('feature_flag_create_failed');
    console.error('Error al crear feature flag:', error);
    res.status(500).json({ error: error.message });
  }
};

// Manejador HTTP para GET /api/feature-flags - obtiene todos los feature flags
export const getAllFeatureFlagsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const featureFlags = await getAllFeatureFlags();
    telemetryService.incrementEvent('feature_flags_list_success');

    const response: GetFeatureFlagsResponse = {
      featureFlags
    };

    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('feature_flags_list_failed');
    console.error('Error al obtener feature flags:', error);
    res.status(500).json({ error: error.message });
  }
};

// Manejador HTTP para GET /api/feature-flags/:id - obtiene feature flag por UUID
export const getFeatureFlagByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID es requerido' });
      return;
    }

    const featureFlag = await getFeatureFlagById(id);

    if (!featureFlag) {
      telemetryService.incrementEvent('feature_flag_get_not_found');
      res.status(404).json({ error: 'Feature flag no encontrado' });
      return;
    }

    telemetryService.incrementEvent('feature_flag_get_success');

    const response: GetFeatureFlagResponse = {
      featureFlag
    };

    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('feature_flag_get_failed');
    console.error('Error al obtener feature flag:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for GET /api/feature-flags/name/:name - retrieves feature flag by name
export const getFeatureFlagByNameController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;

    if (!name) {
      res.status(400).json({ error: 'Nombre es requerido' });
      return;
    }

    const featureFlag = await getFeatureFlagByName(name);

    if (!featureFlag) {
      telemetryService.incrementEvent('feature_flag_get_not_found');
      res.status(404).json({ error: 'Feature flag no encontrado' });
      return;
    }

    telemetryService.incrementEvent('feature_flag_get_success');

    const response: GetFeatureFlagResponse = {
      featureFlag
    };

    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('feature_flag_get_failed');
    console.error('Error al obtener feature flag por nombre:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for PUT /api/feature-flags/:id - updates existing feature flag
export const updateFeatureFlagController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, value }: UpdateFeatureFlagRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID es requerido' });
      return;
    }

    if (name === undefined && description === undefined && value === undefined) {
      res.status(400).json({ error: 'Al menos un campo debe ser proporcionado para actualizar' });
      return;
    }

    if (name !== undefined && name.trim() === '') {
      res.status(400).json({ error: 'El nombre no puede estar vacío' });
      return;
    }

    const featureFlag = await updateFeatureFlag(id, { name, description, value });
    telemetryService.incrementEvent('feature_flag_update_success');

    const response: UpdateFeatureFlagResponse = {
      message: 'Feature flag actualizado exitosamente',
      featureFlag
    };

    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('feature_flag_update_failed');
    console.error('Error al actualizar feature flag:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for DELETE /api/feature-flags/:id - removes feature flag
export const deleteFeatureFlagController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID es requerido' });
      return;
    }

    const existingFlag = await getFeatureFlagById(id);
    if (!existingFlag) {
      telemetryService.incrementEvent('feature_flag_delete_not_found');
      res.status(404).json({ error: 'Feature flag no encontrado' });
      return;
    }

    await deleteFeatureFlag(id);
    telemetryService.incrementEvent('feature_flag_delete_success');

    res.status(200).json({ message: 'Feature flag eliminado exitosamente' });
  } catch (error: any) {
    telemetryService.incrementEvent('feature_flag_delete_failed');
    console.error('Error al eliminar feature flag:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for PATCH /api/feature-flags/:id/toggle - toggles feature flag value
export const toggleFeatureFlagController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID es requerido' });
      return;
    }

    const featureFlag = await toggleFeatureFlag(id);
    telemetryService.incrementEvent('feature_flag_toggle_success');

    const response: UpdateFeatureFlagResponse = {
      message: `Feature flag ${featureFlag.value ? 'activado' : 'desactivado'} exitosamente`,
      featureFlag
    };

    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('feature_flag_toggle_failed');
    console.error('Error al alternar feature flag:', error);
    res.status(500).json({ error: error.message });
  }
};