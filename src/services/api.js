import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getCurrentUser: () => api.get("/auth/me"),
};

export const userAPI = {
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  changePassword: (id, data) => api.put(`/users/${id}/password`, data),
  deactivateAccount: (id) => api.delete(`/users/${id}`),
  updateProfile: (data) => api.put("/users/profile", data),
  deleteAccount: () => api.delete("/users/profile"),
};

export const driverAPI = {
  createProfile: (data) => api.post("/drivers", data),
  getProfile: (userId) => api.get(`/drivers/${userId}`),
  updateProfile: (userId, data) => api.put(`/drivers/${userId}`, data),
  getAllDrivers: (params) => api.get("/drivers", { params }),
};

export const rideAPI = {
  createRide: (data) => api.post("/rides", data),
  searchRides: (params) => api.get("/rides", { params }),
  getRide: (id) => api.get(`/rides/${id}`),
  getDriverRides: (driverId, params) =>
    api.get(`/rides/driver/${driverId}`, { params }),
  updateRide: (id, data) => api.put(`/rides/${id}`, data),
  cancelRide: (id) => api.delete(`/rides/${id}`),
  completeRide: (id) => api.put(`/rides/${id}/complete`),
};

export const bookingAPI = {
  createBooking: (data) => api.post("/bookings", data),
  getBooking: (id) => api.get(`/bookings/${id}`),
  getPassengerBookings: (passengerId, params) =>
    api.get(`/bookings/passenger/${passengerId}`, { params }),
  getRideBookings: (rideId) => api.get(`/bookings/ride/${rideId}`),
  updateBookingStatus: (id, status) =>
    api.put(`/bookings/${id}/status`, { status }),
  cancelBooking: (id) =>
    api.put(`/bookings/${id}/status`, { status: "cancelled" }),
};

export const reviewAPI = {
  createReview: (data) => api.post("/reviews", data),
  getReview: (id) => api.get(`/reviews/${id}`),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  getBookingReviews: (bookingId) => api.get(`/reviews/booking/${bookingId}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export const universityAPI = {
  getAll: (params) => api.get("/universities", { params }),
  getById: (id) => api.get(`/universities/${id}`),
};

export default api;
