import { apiGet } from './httpClient';
import type { FieldType } from '../types/shelf';

export async function fetchFieldTypes(): Promise<FieldType[]> {
  const { fieldTypes } = await apiGet<{ fieldTypes: FieldType[] }>('/api/field-types');
  return fieldTypes;
}
