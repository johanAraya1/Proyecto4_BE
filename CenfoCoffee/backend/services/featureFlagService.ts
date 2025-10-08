import { supabase } from '../utils/supabaseClient';
import { FeatureFlag, CreateFeatureFlagRequest, UpdateFeatureFlagRequest } from '../models/FeatureFlag';

// Crea un nuevo feature flag con validación de nombre único
export const createFeatureFlag = async (createData: CreateFeatureFlagRequest): Promise<FeatureFlag> => {
  const { name, description, value = false } = createData;

  const featureFlagData = {
    name: name.trim(),
    description: description?.trim() || null,
    value,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
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

  return data as FeatureFlag;
};

// Obtiene todos los feature flags ordenados por fecha de creación
export const getAllFeatureFlags = async (): Promise<FeatureFlag[]> => {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener los feature flags: ${error.message}`);
  }

  return data as FeatureFlag[];
};

// Finds a feature flag by its UUID
export const getFeatureFlagById = async (id: string): Promise<FeatureFlag | null> => {
  const { data, error } = await supabase
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

  return data as FeatureFlag;
};

// Finds a feature flag by its unique name
export const getFeatureFlagByName = async (name: string): Promise<FeatureFlag | null> => {
  const { data, error } = await supabase
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

  return data as FeatureFlag;
};

// Updates a feature flag with partial data and name uniqueness validation
export const updateFeatureFlag = async (id: string, updateData: UpdateFeatureFlagRequest): Promise<FeatureFlag> => {
  const updateFields: any = {
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

  const { data, error } = await supabase
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

  return data as FeatureFlag;
};

// Permanently deletes a feature flag
export const deleteFeatureFlag = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar el feature flag: ${error.message}`);
  }
};

// Toggles a feature flag's value (true ↔ false)
export const toggleFeatureFlag = async (id: string): Promise<FeatureFlag> => {
  const currentFlag = await getFeatureFlagById(id);
  
  if (!currentFlag) {
    throw new Error('Feature flag no encontrado');
  }

  return await updateFeatureFlag(id, { value: !currentFlag.value });
};