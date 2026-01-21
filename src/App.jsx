import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/DriverDashboard";
import PassengerDashboard from "./pages/PassengerDashboard";
import SearchRides from "./pages/SearchRides";
import PostRide from "./pages/PostRide";
import RideDetails from "./pages/RideDetails";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import MyRides from "./pages/MyRides";
import Requests from "./pages/Requests";
import MyBookings from "./pages/MyBookings";
import DriverProfile from "./pages/DriverProfile";
import EditRide from "./pages/EditRide";
import DriverProfileSetup from "./pages/DriverProfileSetup";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    );

  return user ? children : <Navigate to="/login" />;
};

const DriverRoute = ({ children }) => {
  const { user, loading, isDriver } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    );

  if (!user) return <Navigate to="/login" />;
  if (!isDriver()) return <Navigate to="/passenger/dashboard" />;

  return children;
};

function AppContent() {
  const { user, isDriver } = useAuth();

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to={isDriver() ? "/driver/dashboard" : "/passenger/dashboard"}
              />
            ) : (
              <Landing />
            )
          }
        />
        <Route
          path="/login"
          element={
            !user ? (
              <Login />
            ) : (
              <Navigate
                to={isDriver() ? "/driver/dashboard" : "/passenger/dashboard"}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            !user ? (
              <Register />
            ) : (
              <Navigate
                to={isDriver() ? "/driver/dashboard" : "/passenger/dashboard"}
              />
            )
          }
        />

        {/* Driver Routes */}
        <Route
          path="/driver/dashboard"
          element={
            <DriverRoute>
              <DriverDashboard />
            </DriverRoute>
          }
        />
        <Route
          path="/driver/post-ride"
          element={
            <DriverRoute>
              <PostRide />
            </DriverRoute>
          }
        />
        <Route
          path="/driver/my-rides"
          element={
            <DriverRoute>
              <MyRides />
            </DriverRoute>
          }
        />
        <Route
          path="/driver/requests"
          element={
            <DriverRoute>
              <Requests />
            </DriverRoute>
          }
        />
        <Route
          path="/driver/profile/setup"
          element={
            <DriverRoute>
              <DriverProfileSetup />
            </DriverRoute>
          }
        />

        {/* Passenger Routes */}
        <Route
          path="/passenger/dashboard"
          element={
            <ProtectedRoute>
              <PassengerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger/search"
          element={
            <ProtectedRoute>
              <SearchRides />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Shared Routes */}
        <Route
          path="/rides/:id"
          element={
            <ProtectedRoute>
              <RideDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/:id"
          element={
            <ProtectedRoute>
              <DriverProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/rides/:id/edit"
          element={
            <DriverRoute>
              <EditRide />
            </DriverRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
