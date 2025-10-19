"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFeatureFlag = exports.deleteFeatureFlag = exports.updateFeatureFlag = exports.getFeatureFlagByName = exports.getFeatureFlagById = exports.getAllFeatureFlags = exports.createFeatureFlag = void 0;
const supabaseClient_1 = require("../utils/supabaseClient");
// Crea un nuevo feature flag con validación de nombre único
const createFeatureFlag = async (createData) => {
    const { name, description, value = false } = createData;
    const featureFlagData = {
        name: name.trim(),
        description: description?.trim() || null,
        value,
        updated_at: new Date().toISOString()
    };
    const { data, error } = await supabaseClient_1.supabase
        .from('feature_flags')
        .insert([featureFlagData])
        .select()
        .single();
    if (error) {
        if (error.code === '23505') {
            throw new Error(`Ya existe un feature flag con el nombre '${name}'`);
        }
        throw new Error(`Error al crear el feature flag: ${error.message}`);
    }
    return data;
};
exports.createFeatureFlag = createFeatureFlag;
// Obtiene todos los feature flags ordenados por fecha de creación
const getAllFeatureFlags = async () => {
    const { data, error } = await supabaseClient_1.supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        throw new Error(`Error al obtener los feature flags: ${error.message}`);
    }
    return data;
};
exports.getAllFeatureFlags = getAllFeatureFlags;
// Finds a feature flag by its UUID
const getFeatureFlagById = async (id) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('feature_flags')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        throw new Error(`Error al obtener el feature flag: ${error.message}`);
    }
    return data;
};
exports.getFeatureFlagById = getFeatureFlagById;
// Finds a feature flag by its unique name
const getFeatureFlagByName = async (name) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('feature_flags')
        .select('*')
        .eq('name', name.trim())
        .single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        throw new Error(`Error al obtener el feature flag: ${error.message}`);
    }
    return data;
};
exports.getFeatureFlagByName = getFeatureFlagByName;
// Updates a feature flag with partial data and name uniqueness validation
const updateFeatureFlag = async (id, updateData) => {
    const updateFields = {
        updated_at: new Date().toISOString()
    };
    if (updateData.name !== undefined) {
        updateFields.name = updateData.name.trim();
    }
    if (updateData.description !== undefined) {
        updateFields.description = updateData.description?.trim() || null;
    }
    if (updateData.value !== undefined) {
        updateFields.value = updateData.value;
    }
    const { data, error } = await supabaseClient_1.supabase
        .from('feature_flags')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();
    if (error) {
        if (error.code === 'PGRST116') {
            throw new Error('Feature flag no encontrado');
        }
        if (error.code === '23505') {
            throw new Error(`Ya existe un feature flag con el nombre '${updateData.name}'`);
        }
        throw new Error(`Error al actualizar el feature flag: ${error.message}`);
    }
    return data;
};
exports.updateFeatureFlag = updateFeatureFlag;
// Permanently deletes a feature flag
const deleteFeatureFlag = async (id) => {
    const { error } = await supabaseClient_1.supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);
    if (error) {
        throw new Error(`Error al eliminar el feature flag: ${error.message}`);
    }
};
exports.deleteFeatureFlag = deleteFeatureFlag;
// Toggles a feature flag's value (true ↔ false)
const toggleFeatureFlag = async (id) => {
    const currentFlag = await (0, exports.getFeatureFlagById)(id);
    if (!currentFlag) {
        throw new Error('Feature flag no encontrado');
    }
    return await (0, exports.updateFeatureFlag)(id, { value: !currentFlag.value });
};
exports.toggleFeatureFlag = toggleFeatureFlag;
