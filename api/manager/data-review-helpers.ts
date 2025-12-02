import { getPoolDetail } from "./pools-api";
import { fetchCourseById } from "./courses-api";
import { fetchStudentDetail } from "./students-api";
import { fetchInstructorDetail } from "./instructors-api";
import { fetchStaffDetail } from "./staff-api";
import { getNewsById } from "./news-api";

/**
 * Helper function to fetch original data for comparison in data-review
 * Uses data_id from data-review record to fetch current state from database
 */
export async function fetchOriginalData(
  moduleType: string,
  dataId: string,
  tenantId: string,
  token: string
): Promise<any> {
  try {
    switch (moduleType) {
      case "Pool":
        return await getPoolDetail(dataId, tenantId, token);

      case "Course":
        return await fetchCourseById({
          courseId: dataId,
          tenantId,
          token,
        });

      case "User":
        // Check if it's a student or instructor - try student first
        try {
          return await fetchStudentDetail({
            studentId: dataId,
            tenantId,
            token,
          });
        } catch {
          // If student fetch fails, try instructor
          try {
            return await fetchInstructorDetail({
              instructorId: dataId,
              tenantId,
              token,
            });
          } catch {
            // If both fail, try staff
            return await fetchStaffDetail({
              staffId: dataId,
              tenantId,
              token,
            });
          }
        }

      case "News":
        return await getNewsById(dataId);

      case "Class":
      case "Schedule":
      case "Order":
      case "Application":
        // These modules don't have detail APIs yet, return null
        return null;

      default:
        console.warn(`Unknown module type: ${moduleType}`);
        return null;
    }
  } catch (error) {
    console.error(`Failed to fetch original data for ${moduleType}:`, error);
    return null;
  }
}
