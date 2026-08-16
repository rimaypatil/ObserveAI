import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { profileApi } from '@/api/profile';
import { organizationApi } from '@/api/organization';
import { Modal } from '@/components/common/Modal';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Building,
  Calendar,
  Globe,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  Trash2,
  ArrowRightLeft,
  Users
} from 'lucide-react';

export const ProfileSettings = () => {
  const { user, refreshUser, logout } = useAuth();

  // Personal info state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security & password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Org members state for ownership transfer & deletion checks
  const [members, setMembers] = useState([]);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState('');

  // Modals state
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeleteOrgModalOpen, setIsDeleteOrgModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Danger zone action loading & error states
  const [dangerMsg, setDangerMsg] = useState({ type: '', text: '' });
  const [isSubmittingDanger, setIsSubmittingDanger] = useState(false);

  const isOwner = user?.role?.toUpperCase() === 'OWNER';

  const fetchOrgMembers = async () => {
    try {
      const memberList = await organizationApi.listMembers();
      setMembers(memberList || []);
    } catch (err) {
      console.error('Failed to load organization members:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setTimezone(user.timezone || 'UTC');
      fetchOrgMembers();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setIsUpdatingProfile(true);

    try {
      await profileApi.updateProfile({
        full_name: fullName,
        timezone,
      });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Personal details updated successfully.' });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile details.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPass(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordMsg({ type: 'error', text: err.message || 'Password change failed. Verify your current password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDangerMsg({ type: '', text: '' });
    setIsSubmittingDanger(true);

    try {
      await profileApi.deleteAccount();
      setIsDeleteAccountModalOpen(false);
      logout();
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDangerMsg({ type: 'error', text: err.message || 'Failed to delete account.' });
    } finally {
      setIsSubmittingDanger(false);
    }
  };

  const handleDeleteOrganization = async () => {
    setDangerMsg({ type: '', text: '' });
    setIsSubmittingDanger(true);

    try {
      await organizationApi.deleteOrganization();
      setIsDeleteOrgModalOpen(false);
      logout();
    } catch (err) {
      console.error('Failed to delete organization:', err);
      setDangerMsg({ type: 'error', text: err.message || 'Failed to delete organization.' });
    } finally {
      setIsSubmittingDanger(false);
    }
  };

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!selectedNewOwnerId) return;

    setDangerMsg({ type: '', text: '' });
    setIsSubmittingDanger(true);

    try {
      const res = await organizationApi.transferOwnership(selectedNewOwnerId);
      await refreshUser();
      await fetchOrgMembers();
      setIsTransferModalOpen(false);
      setSelectedNewOwnerId('');
      setProfileMsg({ type: 'success', text: res.message || 'Ownership transferred successfully.' });
    } catch (err) {
      console.error('Failed to transfer ownership:', err);
      setDangerMsg({ type: 'error', text: err.message || 'Failed to transfer ownership.' });
    } finally {
      setIsSubmittingDanger(false);
    }
  };

  const initialLetter = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
  const roleDisplay = user?.role ? user.role.toUpperCase() : 'MEMBER';
  const otherMembers = members.filter((m) => m.user_id !== user?.id);
  const hasOtherMembers = otherMembers.length > 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <User className="w-6 h-6 text-brand-500" />
          User Profile Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal account credentials, security settings, preferences, and organization role.
        </p>
      </div>

      {/* 1. Header Summary Card */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            {initialLetter}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {user?.full_name || 'User Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                Role: {roleDisplay}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Active Session
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
          <p className="text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Organization:</span>
          </p>
          <p className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[220px]">
            {user?.organization_name || 'Primary Workspace'}
          </p>
          <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
            ID: {user?.organization_id || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Personal Information & Preferences Card */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Personal Information
            </h3>
          </div>

          {profileMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Email address is managed by your account authentication settings.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Timezone Preference
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London (GMT / BST)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* 3. Security & Change Password Card */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Security & Credentials
            </h3>
          </div>

          {passwordMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                New Password (Min 8 Characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPass}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                {isChangingPass ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 4. Account Metadata & Danger Zone Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Metadata */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Account Metadata
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Assigned Role</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{roleDisplay}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Member Since</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-200 dark:border-rose-900/30">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base text-rose-600 dark:text-rose-400">
              Account Management Zone
            </h3>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Account deletion and organization management are subject to role authorizations and active member validations.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDangerMsg({ type: '', text: '' });
                  setIsDeleteAccountModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDangerMsg({ type: '', text: '' });
                      setIsDeleteOrgModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-rose-400 font-semibold text-xs border border-rose-500/30 shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Building className="w-4 h-4 text-rose-500" />
                    Delete Organization
                  </button>

                  {hasOtherMembers && (
                    <button
                      type="button"
                      onClick={() => {
                        setDangerMsg({ type: '', text: '' });
                        setIsTransferModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 font-semibold text-xs border border-brand-500/30 shadow-sm transition-colors flex items-center gap-2"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Transfer Ownership
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Delete Account */}
      <Modal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        title="Delete My Account"
      >
        <div className="space-y-4">
          {dangerMsg.text && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{dangerMsg.text}</span>
            </div>
          )}

          {isOwner && hasOtherMembers ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-3">
              <p className="font-semibold flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Ownership Transfer Required
              </p>
              <p className="leading-relaxed">
                As the organization owner, you cannot delete your account while other members exist in the organization ({otherMembers.length} active member{otherMembers.length > 1 ? 's' : ''}). Please transfer ownership to another member first.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteAccountModalOpen(false);
                    setIsTransferModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow hover:bg-brand-600 transition-colors flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Ownership Now
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to delete your account? This action is permanent and cannot be undone.
              </p>

              {isOwner && !hasOtherMembers && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                  <p className="font-semibold">Notice for Sole Organization Owner:</p>
                  <p className="mt-1">Since you are the only member, deleting your account will also permanently delete the organization and all its associated projects and telemetry data.</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingDanger}
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingDanger ? 'Deleting Account...' : 'Permanently Delete Account'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal 2: Delete Organization */}
      <Modal
        isOpen={isDeleteOrgModalOpen}
        onClose={() => setIsDeleteOrgModalOpen(false)}
        title="Delete Organization"
      >
        <div className="space-y-4">
          {dangerMsg.text && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{dangerMsg.text}</span>
            </div>
          )}

          {hasOtherMembers ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-3">
              <p className="font-semibold flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cannot Delete Active Organization
              </p>
              <p className="leading-relaxed">
                Other active members exist in this organization ({otherMembers.length} member{otherMembers.length > 1 ? 's' : ''}). You must transfer ownership or remove all members before deleting the organization.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteOrgModalOpen(false);
                    setIsTransferModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow hover:bg-brand-600 transition-colors flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Ownership
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-2">
                <p className="font-bold text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Warning: Irreversible Action
                </p>
                <p className="leading-relaxed">
                  Deleting organization <strong>"{user?.organization_name || 'Primary Organization'}"</strong> will permanently remove all associated projects, telemetry logs, metrics, services, incidents, AI RCA reports, and organization-owned data.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteOrgModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingDanger}
                  onClick={handleDeleteOrganization}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingDanger ? 'Deleting Organization...' : 'Confirm Organization Deletion'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal 3: Transfer Ownership */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Organization Ownership"
      >
        <form onSubmit={handleTransferOwnership} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Select an existing organization member to transfer ownership to. Your role will be updated to <strong>MEMBER</strong> and the selected user will become the new <strong>OWNER</strong>.
          </p>

          {dangerMsg.text && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{dangerMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Select New Owner
            </label>
            <div className="relative">
              <Users className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <select
                required
                value={selectedNewOwnerId}
                onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Member --</option>
                {otherMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name} ({m.email}) - Role: {m.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingDanger || !selectedNewOwnerId}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {isSubmittingDanger ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
