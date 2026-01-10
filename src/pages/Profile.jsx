import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <Link to="/profile/edit">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <span className="text-3xl font-semibold text-emerald-400">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{user?.full_name}</h2>
              <p className="text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">Phone</div>
                <div className="font-medium text-white">{user?.phone}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Role</div>
                <div className="font-medium text-white capitalize">{user?.role}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Gender</div>
                <div className="font-medium text-white capitalize">{user?.gender}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Member Since</div>
                <div className="font-medium text-white">
                  {new Date(user?.created_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Status</div>
                <div className={`font-medium ${user?.is_verified ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {user?.is_verified ? 'Verified' : 'Not Verified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
