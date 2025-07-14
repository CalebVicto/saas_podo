// Authentication System Usage Examples
// This file demonstrates how to use the token-based authentication system

import React from "react";
import { useAuth, apiGet, apiPost, createAuthenticatedApi } from "@/lib/auth";

// Example 1: Using the authentication context in a React component
export function ExampleAuthComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>Welcome, {user?.name}!</h2>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Example 2: Making authenticated API requests using convenience functions
export async function fetchUserData() {
  try {
    // The token is automatically included in the Authorization header
    const response = await apiGet<{ users: any[] }>("/api/users");

    if (response.error) {
      console.error("API Error:", response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Request failed:", error);
    return null;
  }
}

// Example 3: Creating and updating data with authentication
export async function createPatient(patientData: any) {
  try {
    const response = await apiPost("/api/patients", patientData);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  } catch (error) {
    console.error("Failed to create patient:", error);
    throw error;
  }
}

// Example 4: Using a custom authenticated API instance
export function createCustomApiService(baseURL: string) {
  const api = createAuthenticatedApi(baseURL, () => {
    console.log("Token expired in custom service");
  });

  return {
    async getReports() {
      return api.get("/reports");
    },

    async createReport(data: any) {
      return api.post("/reports", data);
    },

    async updateReport(id: string, data: any) {
      return api.put(`/reports/${id}`, data);
    },

    async deleteReport(id: string) {
      return api.delete(`/reports/${id}`);
    },
  };
}

// Example 5: Error handling for different scenarios
export async function handleApiErrors() {
  try {
    const response = await apiGet("/api/protected-resource");

    // Check response status
    switch (response.status) {
      case 200:
        return response.data;
      case 401:
        // Token expired - user will be automatically logged out
        console.log("Authentication expired");
        break;
      case 403:
        // Forbidden - user doesn't have permission
        throw new Error("Access denied");
      case 404:
        throw new Error("Resource not found");
      default:
        throw new Error(response.error || "Unknown error occurred");
    }
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Example 6: Role-based actions
export function useRoleBasedActions() {
  const { user } = useAuth();

  const canCreateUsers = user?.role === "admin";
  const canViewReports = user?.role === "admin";
  const canManageAppointments = true; // Both admin and worker

  return {
    canCreateUsers,
    canViewReports,
    canManageAppointments,
  };
}

// Example 7: Manual token validation (rarely needed)
export async function checkTokenValidity() {
  try {
    const response = await apiGet("/api/auth/validate");
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
