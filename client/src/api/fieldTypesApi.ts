import { getFieldTypes } from '../lib/localStore';
import type { FieldType } from '../types/shelf';

export async function fetchFieldTypes(): Promise<FieldType[]> {
  return getFieldTypes();
}
