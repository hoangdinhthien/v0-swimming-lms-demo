"use client";

import { useState, useEffect } from "react";
import { getAuthenticatedUser } from "@/api/auth-utils";
import { getUserFrontendRole } from "@/api/role-utils";

export function useUserRole() {
  const [role, setRole] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user and role information when component mounts
    const fetchUserInfo = () => {
      try {
        const userData = getAuthenticatedUser();
        if (userData) {
          setUser(userData);
          const frontendRole = getUserFrontendRole();
          setRole(frontendRole);

          // Set role flags
          setIsAdmin(frontendRole === "admin");
          setIsManager(frontendRole === "manager" || frontendRole === "admin");
          setIsInstructor(frontendRole === "instructor");
          setIsStudent(frontendRole === "student");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  return {
    role,
    isAdmin,
    isManager,
    isInstructor,
    isStudent,
    isLoading,
    user,
  };
}
