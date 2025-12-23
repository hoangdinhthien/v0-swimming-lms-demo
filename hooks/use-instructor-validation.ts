import { useState, useEffect, useCallback } from "react";
import { fetchInstructorSpecialist } from "@/api/manager/instructors-api";
import { fetchAllCourseCategories } from "@/api/manager/course-categories";
import { fetchAgeRules } from "@/api/manager/age-types";

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  type: "category" | "age_type" | "schedule_conflict" | "specialist_missing";
  message: string;
  details: string;
}

export interface ValidationError {
  type: "schedule_conflict" | "system_error";
  message: string;
  details: string;
}

interface UseInstructorValidationProps {
  instructorId: string;
  course: any; // Using any for flexibility with different Course interfaces
  tenantId: string;
  token: string;
  skip?: boolean;
}

export function useInstructorValidation({
  instructorId,
  course,
  tenantId,
  token,
  skip = false,
}: UseInstructorValidationProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult>({
    isValid: true,
    warnings: [],
    errors: [],
  });

  // Cache for mappings
  const [categoryTitles, setCategoryTitles] = useState<Map<string, string>>(
    new Map()
  );
  const [ageTypeTitles, setAgeTypeTitles] = useState<Map<string, string>>(
    new Map()
  );
  const [mappingsLoaded, setMappingsLoaded] = useState(false);

  // Load mappings only once
  useEffect(() => {
    const loadMappings = async () => {
      if (!tenantId || !token) return;

      try {
        const [categories, ageTypes] = await Promise.all([
          fetchAllCourseCategories({ tenantId, token }),
          fetchAgeRules(),
        ]);

        const catMap = new Map(categories.map((c) => [c._id, c.title]));
        const ageMap = new Map(ageTypes.map((a) => [a._id, a.title]));

        setCategoryTitles(catMap);
        setAgeTypeTitles(ageMap);
        setMappingsLoaded(true);
      } catch (error) {
        console.error("Failed to load validation mappings:", error);
      }
    };

    if (!mappingsLoaded) {
      loadMappings();
    }
  }, [tenantId, token, mappingsLoaded]);

  const validate = useCallback(async () => {
    if (
      skip ||
      !instructorId ||
      !course ||
      !tenantId ||
      !token ||
      !mappingsLoaded
    ) {
      setResult({ isValid: true, warnings: [], errors: [] });
      return;
    }

    setLoading(true);
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    try {
      // Fetch specialist info
      const specialistsResponse = await fetchInstructorSpecialist({
        searchParams: {
          "search[user._id:in]": instructorId,
        },
        tenantId,
        token,
      });

      const specialist = specialistsResponse[0];

      // 1. Check if specialist exists
      if (!specialist) {
        warnings.push({
          type: "specialist_missing",
          message: "Huấn luyện viên chưa có thông tin chuyên môn",
          details:
            "Cần cập nhật Danh mục và Loại độ tuổi cho Huấn luyện viên này",
        });
        // Blocking validation logic usually treats missing specialist as a warning/block depending on strictness.
        // Based on user request "validate instructor suitable", this could be critical.
        // For now we treat it as a blocking warning (will return isValid: false if we consider warnings blocking).
        // Let's decide validation passes only if no warnings?
        // Or specific blocking categories.
      } else {
        // Parse specialist data
        const specialistCategories = Array.isArray(specialist.category)
          ? specialist.category.map((cat: any) =>
              typeof cat === "object" ? cat._id : cat
            )
          : [];
        const specialistAgeTypes = Array.isArray(specialist.age_types)
          ? specialist.age_types.map((age: any) =>
              typeof age === "object" ? age._id : age
            )
          : [];

        // Parse course data
        const courseCategories: string[] = Array.isArray(course.category)
          ? course.category.map((c: any) => (typeof c === "object" ? c._id : c))
          : course.category
          ? [course.category]
          : [];

        const courseAgeTypes: string[] = Array.isArray(course.type_of_age)
          ? course.type_of_age.map((a: any) =>
              typeof a === "object" ? a._id : a
            )
          : course.type_of_age
          ? [course.type_of_age]
          : [];

        // 2. Validate Category Match
        // Instructor needs to have AT LEAST ONE of the course's categories? Or ALL?
        // Usually: Instructor must cover the category of the course.
        // If course has multiple categories, instructor should match at least one relevant one?
        // Logic from add-class-form:
        // const categoryMatch = courseCategories.some((catId) => specialistCategories.includes(catId));

        const categoryMatch = courseCategories.some((catId) =>
          specialistCategories.includes(catId)
        );

        if (!categoryMatch && courseCategories.length > 0) {
          const courseCategoryTitles = courseCategories
            .map((catId) => categoryTitles.get(catId) || "Unknown")
            .join(", ");
          const specialistCategoryTitles = specialist.category
            .map((cat: any) => (typeof cat === "object" ? cat.title : ""))
            .filter(Boolean)
            .join(", ");

          warnings.push({
            type: "category",
            message: "Chuyên môn không phù hợp (Danh mục)",
            details: `Khóa học yêu cầu: [${courseCategoryTitles}] - HLV có: [${
              specialistCategoryTitles || "Không"
            }]`,
          });
        }

        // 3. Validate Age Type Match
        const ageTypeMatch = courseAgeTypes.some((ageId) =>
          specialistAgeTypes.includes(ageId)
        );

        if (!ageTypeMatch && courseAgeTypes.length > 0) {
          const courseAgeTypeTitles = courseAgeTypes
            .map((ageId) => ageTypeTitles.get(ageId) || "Unknown")
            .join(", ");
          const specialistAgeTypeTitles = specialist.age_types
            .map((age: any) => (typeof age === "object" ? age.title : ""))
            .filter(Boolean)
            .join(", ");

          warnings.push({
            type: "age_type",
            message: "Chuyên môn không phù hợp (Độ tuổi)",
            details: `Khóa học yêu cầu: [${courseAgeTypeTitles}] - HLV có: [${
              specialistAgeTypeTitles || "Không"
            }]`,
          });
        }
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      errors.push({
        type: "system_error",
        message: "Lỗi kiểm tra thông tin",
        details: error.message || "Không thể kiểm tra chuyên môn HLV",
      });
    } finally {
      setLoading(false);
      // Consider invalid if there are ANY warnings of type category, age_type, or specialist_missing
      const isValid = warnings.length === 0 && errors.length === 0;
      setResult({ isValid, warnings, errors });
    }
  }, [
    instructorId,
    course,
    tenantId,
    token,
    mappingsLoaded,
    skip,
    categoryTitles,
    ageTypeTitles,
  ]);

  useEffect(() => {
    validate();
  }, [validate]);

  return { loading, result, revalidate: validate };
}
