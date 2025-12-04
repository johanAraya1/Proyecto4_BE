"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFeatureFlagController = exports.deleteFeatureFlagController = exports.updateFeatureFlagController = exports.getFeatureFlagByNameController = exports.getFeatureFlagByIdController = exports.getAllFeatureFlagsController = exports.createFeatureFlagController = void 0;
const featureFlagService_1 = require("../services/featureFlagService");
const telemetryService_1 = require("../services/telemetryService");
// Manejador HTTP para POST /api/feature-flags - crea nuevo feature flag
const createFeatureFlagController = async (req, res) => {
    try {
        const { name, description, value } = req.body;
        if (!name || name.trim() === '') {
            telemetryService_1.telemetryService.incrementEvent('feature_flag_create_validation_failed');
            res.status(400).json({ error: 'El nombre es requerido' });
            return;
        }
        const featureFlag = await (0, featureFlagService_1.createFeatureFlag)({ name, description, value });
        telemetryService_1.telemetryService.incrementEvent('feature_flag_create_success');
        const response = {
            message: 'Feature flag creado exitosamente',
            featureFlag
        };
        res.status(201).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('feature_flag_create_failed');
        console.error('Error al crear feature flag:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.createFeatureFlagController = createFeatureFlagController;
// Manejador HTTP para GET /api/feature-flags - obtiene todos los feature flags
const getAllFeatureFlagsController = async (req, res) => {
    try {
        const featureFlags = await (0, featureFlagService_1.getAllFeatureFlags)();
        telemetryService_1.telemetryService.incrementEvent('feature_flags_list_success');
        const response = {
            featureFlags
        };
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('feature_flags_list_failed');
        console.error('Error al obtener feature flags:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getAllFeatureFlagsController = getAllFeatureFlagsController;
// Manejador HTTP para GET /api/feature-flags/:id - obtiene feature flag por UUID
const getFeatureFlagByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'ID es requerido' });
            return;
        }
        const featureFlag = await (0, featureFlagService_1.getFeatureFlagById)(id);
        if (!featureFlag) {
            telemetryService_1.telemetryService.incrementEvent('feature_flag_get_not_found');
            res.status(404).json({ error: 'Feature flag no encontrado' });
            return;
        }
        telemetryService_1.telemetryService.incrementEvent('feature_flag_get_success');
        const response = {
            featureFlag
        };
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('feature_flag_get_failed');
        console.error('Error al obtener feature flag:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getFeatureFlagByIdController = getFeatureFlagByIdController;
// HTTP handler for GET /api/feature-flags/name/:name - retrieves feature flag by name
const getFeatureFlagByNameController = async (req, res) => {
    try {
        const { name } = req.params;
        if (!name) {
            res.status(400).json({ error: 'Nombre es requerido' });
            return;
        }
        const featureFlag = await (0, featureFlagService_1.getFeatureFlagByName)(name);
        if (!featureFlag) {
            telemetryService_1.telemetryService.incrementEvent('feature_flag_get_not_found');
            res.status(404).json({ error: 'Feature flag no encontrado' });
            return;
        }
        telemetryService_1.telemetryService.incrementEvent('feature_flag_get_success');
        const response = {
            featureFlag
        };
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('feature_flag_get_failed');
        console.error('Error al obtener feature flag por nombre:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getFeatureFlagByNameController = getFeatureFlagByNameController;
// HTTP handler for PUT /api/feature-flags/:id - updates existing feature flag
const updateFeatureFlagController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, value } = req.body;
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
        const featureFlag = await (0, featureFlagService_1.updateFeatureFlag)(id, { name, description, value });
        telemetryService_1.telemetryService.incrementEvent('feature_flag_update_success');
        const response = {
            message: 'Feature flag actualizado exitosamente',
            featureFlag
        };
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('feature_flag_update_failed');
        console.error('Error al actualizar feature flag:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.updateFeatureFlagController = updateFeatureFlagController;
// HTTP handler for DELETE /api/feature-flags/:id - removes feature flag
const deleteFeatureFlagController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'ID es requerido' });
            return;
        }
        const existingFlag = await (0, featureFlagService_1.getFeatureFlagById)(id);
        if (!existingFlag) {
            telemetryService_1.telemetryService.incrementEvent('feature_flag_delete_not_found');
            res.status(404).json({ error: 'Feature flag no encontrado' });
            return;
        }
        await (0, featureFlagService_1.deleteFeatureFlag)(id);
        telemetryService_1.telemetryService.incrementEvent('feature_flag_delete_success');
        res.status(200).json({ message: 'Feature flag eliminado exitosamente' });
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('feature_flag_delete_failed');
        console.error('Error al eliminar feature flag:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.deleteFeatureFlagController = deleteFeatureFlagController;
// HTTP handler for PATCH /api/feature-flags/:id/toggle - toggles feature flag value
const toggleFeatureFlagController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'ID es requerido' });
            return;
        }
        const featureFlag = await (0, featureFlagService_1.toggleFeatureFlag)(id);
        telemetryService_1.telemetryService.incrementEvent('feature_flag_toggle_success');
        const response = {
            message: `Feature flag ${featureFlag.value ? 'activado' : 'desactivado'} exitosamente`,
            featureFlag
        };
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('feature_flag_toggle_failed');
        console.error('Error al alternar feature flag:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.toggleFeatureFlagController = toggleFeatureFlagController;
