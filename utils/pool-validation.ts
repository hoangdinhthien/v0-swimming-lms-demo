/**
 * Pool Validation Utility
 * Reusable logic for validating pool selection based on:
 * - Age type matching
 * - Instructor schedule conflicts
 * - Pool capacity
 */

import { Pool } from "@/api/manager/pools-api";
import { ClassItem } from "@/api/manager/class-api";
import { ScheduleEvent } from "@/api/manager/schedule-api";

export interface PoolValidationInfo {
  _id: string;
  title: string;
  capacity: number;
  capacity_remain: number;
  isAvailable: boolean;
  hasAgeWarning: boolean;
  hasInstructorConflict: boolean;
  hasCapacityWarning: boolean;
  score: number;
  type_of_age?: any;
  dimensions?: string;
  depth?: string;
}

export interface ValidatePoolsParams {
  allPools: Pool[];
  selectedClass: ClassItem;
  selectedDate: string; // YYYY-MM-DD
  selectedSlotId: string;
  instructorId: string;
  existingSchedules: ScheduleEvent[];
}

/**
 * Validate all pools for a given schedule
 */
export function validatePools(
  params: ValidatePoolsParams
): PoolValidationInfo[] {
  const {
    allPools,
    selectedClass,
    selectedDate,
    selectedSlotId,
    instructorId,
    existingSchedules,
  } = params;

  const classCapacity =
    (selectedClass?.course as any)?.capacity ||
    (selectedClass?.course as any)?.max_member ||
    0;

  return allPools.map((pool) => {
    let capacityUsed = 0;

    // Count from existing DB schedules
    existingSchedules.forEach((existingEvent: any) => {
      if (
        existingEvent.date === selectedDate &&
        existingEvent.slot?._id === selectedSlotId &&
        existingEvent.pool?._id === pool._id
      ) {
        capacityUsed += existingEvent.classroom?.capacity || 0;
      }
    });

    const capacityRemain = (pool.capacity || 0) - capacityUsed;
    const isAvailable = capacityRemain > 0;

    // Validation 1: Check age type matching
    const courseTypeOfAge = (selectedClass?.course as any)?.type_of_age;
    const poolTypeOfAge = (pool as any).type_of_age;

    let poolTypeIds: string[] = [];
    let poolTypeTitles: string[] = [];

    if (Array.isArray(poolTypeOfAge)) {
      poolTypeOfAge.forEach((t: any) => {
        if (typeof t === "object" && t?._id) {
          poolTypeIds.push(t._id);
          poolTypeTitles.push(t?.title?.toLowerCase() || "");
        } else if (typeof t === "string") {
          poolTypeIds.push(t);
        }
      });
    } else if (poolTypeOfAge) {
      const poolTypeId =
        typeof poolTypeOfAge === "object" ? poolTypeOfAge?._id : poolTypeOfAge;
      const poolTypeTitle =
        typeof poolTypeOfAge === "object"
          ? poolTypeOfAge?.title?.toLowerCase()
          : poolTypeOfAge?.toLowerCase();
      if (poolTypeId) poolTypeIds.push(poolTypeId);
      if (poolTypeTitle) poolTypeTitles.push(poolTypeTitle);
    }

    let courseTypeIds: string[] = [];
    if (Array.isArray(courseTypeOfAge)) {
      courseTypeOfAge.forEach((t: any) => {
        if (typeof t === "object" && t?._id) {
          courseTypeIds.push(t._id);
        } else if (typeof t === "string") {
          courseTypeIds.push(t);
        }
      });
    } else if (courseTypeOfAge) {
      const courseTypeId =
        typeof courseTypeOfAge === "object"
          ? courseTypeOfAge?._id
          : courseTypeOfAge;
      if (courseTypeId) courseTypeIds.push(courseTypeId);
    }

    const isMixedPool = poolTypeTitles.some(
      (t) => t === "mixed" || t === "hỗn hợp"
    );

    const hasAgeWarning =
      courseTypeIds.length > 0 &&
      poolTypeIds.length > 0 &&
      !isMixedPool &&
      !courseTypeIds.some((cId) => poolTypeIds.includes(cId));

    // Validation 2: Check instructor conflict
    const hasInstructorConflict = existingSchedules.some(
      (existingEvent: any) => {
        return (
          existingEvent.date === selectedDate &&
          existingEvent.slot?._id === selectedSlotId &&
          existingEvent.instructor?._id === instructorId
        );
      }
    );

    // Validation 3: Capacity warning (< 30%)
    const hasCapacityWarning =
      pool.capacity && pool.capacity > 0
        ? capacityRemain / pool.capacity < 0.3
        : false;

    // Scoring algorithm
    let score = 0;

    if (capacityRemain > 0) {
      score += 50;
    }

    if (!hasAgeWarning) {
      score += 100;
    } else {
      score += 20;
    }

    if (!hasInstructorConflict) {
      score += 50;
    }

    if (pool.capacity && pool.capacity > 0 && capacityRemain > 0) {
      const capacityRatio = capacityRemain / pool.capacity;
      score += capacityRatio * 30;
    }

    if (capacityRemain <= 0) {
      score -= 50;
    }

    return {
      _id: pool._id,
      title: pool.title,
      capacity: pool.capacity || 0,
      capacity_remain: capacityRemain,
      isAvailable,
      hasAgeWarning,
      hasInstructorConflict,
      hasCapacityWarning,
      score,
      type_of_age: poolTypeOfAge,
      dimensions: pool.dimensions,
      depth: pool.depth,
    };
  });
}

/**
 * Get best pool from validated pools (auto-select)
 */
export function getBestPool(
  pools: PoolValidationInfo[]
): PoolValidationInfo | null {
  const scoredPools = [...pools].sort((a, b) => b.score - a.score);
  const bestPool = scoredPools[0];

  if (bestPool && bestPool.score > 0) {
    return bestPool;
  }

  // Fallback: pick pool with most capacity
  const poolWithMostCapacity = [...pools].sort(
    (a, b) => b.capacity_remain - a.capacity_remain
  )[0];

  if (poolWithMostCapacity && poolWithMostCapacity.capacity_remain > 0) {
    return poolWithMostCapacity;
  }

  return null;
}

/**
 * Format age type for display
 */
export function formatAgeType(ageType: any): string {
  if (!ageType) return "Không xác định";

  if (Array.isArray(ageType)) {
    return ageType
      .map((t) => (typeof t === "object" ? t?.title || t?._id : t))
      .join(", ");
  }

  return typeof ageType === "object" ? ageType?.title || ageType?._id : ageType;
}
