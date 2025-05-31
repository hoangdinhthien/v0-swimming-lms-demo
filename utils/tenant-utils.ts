export function setSelectedTenant(tenantId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("selectedTenantId", tenantId);
  }
}

export function getSelectedTenant(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("selectedTenantId");
  }
  return null;
}

export function clearSelectedTenant() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("selectedTenantId");
  }
}
