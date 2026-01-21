import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { driverAPI } from '../services/api';

const DriverProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    license_number: '',
    car_make: '',
    car_model: '',
    car_year: new Date().getFullYear(),
    car_color: '',
    car_plate_number: '',
    car_seats: 4,
  });

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const response = await driverAPI.getProfile(user.id);
      if (response.data.data) {
        // Profile exists, load it for editing
        const profile = response.data.data;
        setFormData({
          license_number: profile.license_number || '',
          car_make: profile.car_make || '',
          car_model: profile.car_model || '',
          car_year: profile.car_year || new Date().getFullYear(),
          car_color: profile.car_color || '',
          car_plate_number: profile.car_plate_number || '',
          car_seats: profile.car_seats || 4,
        });
        setIsEditing(true);
      }
    } catch (error) {
      // No profile exists, that's fine - we're creating one
      console.log('No existing driver profile');
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'car_year' || name === 'car_seats' ? parseInt(value) : value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditing) {
        await driverAPI.updateProfile(user.id, formData);
      } else {
        await driverAPI.createProfile(formData);
      }
      navigate('/driver/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save driver profile');
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isEditing ? 'Edit Driver Profile' : 'Setup Driver Profile'}
          </h1>
          <p className="text-slate-400">
            {isEditing
              ? 'Update your vehicle and license information'
              : 'Enter your vehicle and license details to start offering rides'
            }
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* License Number */}
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-slate-300 mb-2">
                Driver's License Number
              </label>
              <input
                id="license_number"
                name="license_number"
                type="text"
                required
                value={formData.license_number}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                placeholder="Enter your license number"
              />
            </div>

            {/* Car Make & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="car_make" className="block text-sm font-medium text-slate-300 mb-2">
                  Car Make
                </label>
                <input
                  id="car_make"
                  name="car_make"
                  type="text"
                  required
                  value={formData.car_make}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                  placeholder="Toyota, Honda, etc."
                />
              </div>
              <div>
                <label htmlFor="car_model" className="block text-sm font-medium text-slate-300 mb-2">
                  Car Model
                </label>
                <input
                  id="car_model"
                  name="car_model"
                  type="text"
                  required
                  value={formData.car_model}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                  placeholder="Camry, Civic, etc."
                />
              </div>
            </div>

            {/* Car Year & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="car_year" className="block text-sm font-medium text-slate-300 mb-2">
                  Car Year
                </label>
                <input
                  id="car_year"
                  name="car_year"
                  type="number"
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.car_year}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="car_color" className="block text-sm font-medium text-slate-300 mb-2">
                  Car Color
                </label>
                <input
                  id="car_color"
                  name="car_color"
                  type="text"
                  required
                  value={formData.car_color}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                  placeholder="White, Black, Silver, etc."
                />
              </div>
            </div>

            {/* Plate Number & Seats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="car_plate_number" className="block text-sm font-medium text-slate-300 mb-2">
                  License Plate Number
                </label>
                <input
                  id="car_plate_number"
                  name="car_plate_number"
                  type="text"
                  required
                  value={formData.car_plate_number}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                  placeholder="XX-XXXXX"
                />
              </div>
              <div>
                <label htmlFor="car_seats" className="block text-sm font-medium text-slate-300 mb-2">
                  Available Seats
                </label>
                <select
                  id="car_seats"
                  name="car_seats"
                  value={formData.car_seats}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'seat' : 'seats'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-200 border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Profile' : 'Create Profile')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverProfileSetup;
