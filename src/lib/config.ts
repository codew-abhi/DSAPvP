/**
 * Centralized Application Configuration
 */

// Base URL for Backend API and WebSocket connections
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');



export const API_BASE_URL = `${BACKEND_URL}/api`;
