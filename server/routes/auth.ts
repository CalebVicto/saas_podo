import { RequestHandler } from "express";

// Mock token validation endpoint
export const validateToken: RequestHandler = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "No token provided",
      valid: false,
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Mock validation - in real app, verify JWT signature and expiration
  if (token && token.startsWith("mock_jwt_token_")) {
    return res.json({
      valid: true,
      message: "Token is valid",
    });
  }

  return res.status(401).json({
    error: "Invalid token",
    valid: false,
  });
};

// Mock token refresh endpoint
export const refreshToken: RequestHandler = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshToken.startsWith("mock_refresh_token_")) {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }

  // Generate new tokens
  const userId = refreshToken.split("_")[3]; // Extract user ID from mock token
  const newAccessToken = `mock_jwt_token_${userId}_${Date.now()}`;
  const newRefreshToken = `mock_refresh_token_${userId}_${Date.now()}`;

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

// Logout endpoint
export const logout: RequestHandler = (req, res) => {
  // In a real app, you might invalidate the token in your database
  res.json({
    message: "Logged out successfully",
  });
};
