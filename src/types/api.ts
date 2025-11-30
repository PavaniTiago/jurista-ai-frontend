export interface ApiError {
    error: string;
}
export interface HealthResponse {
    status: "healthy" | "unhealthy";
    timestamp: string;
    environment: string;
}
