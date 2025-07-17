import type { ClassIdentifier, ClassOfferingIdentifier } from '@/types';

export function createClassKey(id: ClassIdentifier): string {
  return `${id.courseCode}|${id.classCode}`;
}

export function createOfferingKey(id: ClassOfferingIdentifier): string {
  return `${id.courseCode}|${id.classCode}|${id.destCode}`;
}
