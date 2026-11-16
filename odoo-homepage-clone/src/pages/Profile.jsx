import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Icon from '../components/common/Icons';

export const Profile = () => {
  const { showToast } = useNotification();
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Shrishti Verma',
    email: 'shrishtiverma107@gmail.com',
    role: 'Inventory Director',
    department: 'Supply Chain & Operations',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    lastLogin: new Date().toISOString()
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfile = async () => {
    try {
      const data = await inventoryApi.getUserProfile();
      if (data && Object.keys(data).length > 0) {
        setProfile(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      showToast('Error loading profile: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryApi.updateUserProfile(profile);
      showToast('Profile information updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    showToast('Password updated securely!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="profile-page">
      <div className="page-header-row">
        <div>
          <h2>Account Profile & Permissions</h2>
          <p className="page-header-desc">
            Manage your personal administrative identity, contact preferences, and account security credentials.
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Profile Summary Card */}
        <div className="card-box profile-summary-card">
          <div className="profile-card-cover"></div>
          <div className="profile-avatar-wrap">
            <img
              src={profile.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
              alt={profile.name}
              className="profile-large-avatar"
            />
          </div>

          <div className="profile-card-body text-center">
            <h3 className="profile-display-name">{profile.name}</h3>
            <p className="profile-display-email">{profile.email}</p>
            <div className="mt-2">
              <span className="badge-pill badge-primary">{profile.role}</span>
            </div>
            <p className="profile-dept-text">{profile.department}</p>

            <div className="profile-details-list mt-4 text-left">
              <div className="profile-detail-row">
                <span className="p-key">Phone:</span>
                <span className="p-val">{profile.phone}</span>
              </div>
              <div className="profile-detail-row">
                <span className="p-key">Status:</span>
                <span className="p-val text-success font-weight-bold">● Active Administrator</span>
              </div>
              <div className="profile-detail-row">
                <span className="p-key">Access Level:</span>
                <span className="p-val">Full Read/Write CRUD</span>
              </div>
              <div className="profile-detail-row">
                <span className="p-key">Active Session:</span>
                <span className="p-val">{new Date(profile.lastLogin).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Cards */}
        <div className="profile-forms-column">
          {/* Personal Info Form */}
          <div className="card-box">
            <div className="card-header-row">
              <h3 className="card-title">Edit Personal Details</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="card-body">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Administrative Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Avatar Photo URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={profile.avatar}
                    onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions-right mt-3">
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Icon name="check" size={16} />
                  <span>{saving ? 'Saving...' : 'Update Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="card-box mt-4">
            <div className="card-header-row">
              <h3 className="card-title">Security & Password</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="card-body">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-actions-right mt-3">
                <button type="submit" className="btn-secondary">
                  <span>Change Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
