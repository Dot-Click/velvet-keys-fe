import type { DataScope } from "@/types/common";
import type { Property, Unit } from "@/types/property";
import { db } from "./store";

export function isPropertyInScope(property: Property, scope: DataScope) {
  return (
    property.accountId === scope.accountId && (!scope.ownerId || property.ownerId === scope.ownerId)
  );
}

export function scopedProperties(scope: DataScope, options: { includeDelisted?: boolean } = {}) {
  return db.properties.filter(
    (property) =>
      isPropertyInScope(property, scope) &&
      (options.includeDelisted || property.status === "active"),
  );
}

export function scopedUnits(scope: DataScope, options: { includeDelisted?: boolean } = {}): Unit[] {
  const propertyIds = new Set(scopedProperties(scope, options).map((property) => property.id));
  return db.units.filter((unit) => propertyIds.has(unit.propertyId));
}

export function scopedUnitIds(scope: DataScope) {
  return new Set(scopedUnits(scope).map((unit) => unit.id));
}

export function scopedPropertyIds(scope: DataScope) {
  return new Set(scopedProperties(scope).map((property) => property.id));
}

export function unitWithProperty(unitId: string) {
  const unit = db.units.find((item) => item.id === unitId);
  const property = unit ? db.properties.find((item) => item.id === unit.propertyId) : undefined;
  return { unit, property };
}
