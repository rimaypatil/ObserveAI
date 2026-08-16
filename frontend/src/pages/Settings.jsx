import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { profileApi } from '@/api/profile';
import { organizationApi } from '@/api/organization';
import { SdkOnboardingStep } from '@/components/sdk/SdkOnboardingStep';
import { Modal } from '@/components/common/Modal';
import { Key, Lock, Bell, Server, Settings as SettingsIcon, User, ShieldCheck, Users, Plus, UserPlus, Trash2, CheckCircle2, AlertCircle, Building } from 'lucide-react';
import { clsx } from 'clsx';

export const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { activeProject, projects } = useProject();
  const [activeTab, setActiveTab] = useState('sdk');

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Organization members state
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [orgMsg, setOrgMsg] = useState({ type: '', text: '' });

  // Invite Member Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteAssignedProjects, setInviteAssignedProjects] = useState([]);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  const isOwner = user?.role?.toUpperCase() === 'OWNER';

  const loadMembers = async () => {
    if (!isOwner) return;
    setIsLoadingMembers(true);
    try {
      const list = await organizationApi.listMembers();
      setMembers(list || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'org') {
      loadMembers();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await profileApi.updateProfile({ full_name: fullName, timezone });
      await refreshUser();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsChangingPass(true);
    setPasswordMsg('');
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg('Password change failed. Verify current password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setOrgMsg({ type: '', text: '' });
    setIsSubmittingInvite(true);

    try {
      await organizationApi.inviteMember({
        email: inviteEmail,
        full_name: inviteFullName,
        password: invitePassword,
        role: inviteRole,
        assigned_project_ids: inviteAssignedProjects,
      });
      setOrgMsg({ type: 'success', text: `Member ${inviteFullName} invited successfully.` });
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteFullName('');
      setInvitePassword('');
      setInviteRole('MEMBER');
      setInviteAssignedProjects([]);
      loadMembers();
    } catch (err) {
      console.error('Failed to invite member:', err);
      setOrgMsg({ type: 'error', text: err.message || 'Failed to invite member.' });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleToggleMemberRole = async (member) => {
    const newRole = member.role.toUpperCase() === 'OWNER' ? 'MEMBER' : 'OWNER';
    try {
      await organizationApi.updateMemberRole(member.user_id, { role: newRole });
      loadMembers();
    } catch (err) {
      console.error('Failed to update role:', err);
      setOrgMsg({ type: 'error', text: err.message || 'Failed to update member role.' });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the organization?')) return;
    try {
      await organizationApi.removeMember(userId);
      loadMembers();
    } catch (err) {
      console.error('Failed to remove member:', err);
      setOrgMsg({ type: 'error', text: err.message || 'Failed to remove member.' });
    }
  };

  const tabs = [
    { id: 'sdk', label: 'SDK Integration', icon: Server },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'project', label: 'Project Settings', icon: SettingsIcon },
    ...(isOwner ? [{ id: 'org', label: 'Organization & Members', icon: Users }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-brand-500" />
          Settings & SDK Configuration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage application SDK integration keys, user profile, project settings, and organization members
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all',
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'sdk' && <SdkOnboardingStep />}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Form */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Personal Profile Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Security & Password
            </h3>

            {passwordMsg && (
              <p className="text-xs text-brand-500 font-semibold">{passwordMsg}</p>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                {isChangingPass ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'project' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Active Project Configuration
          </h3>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p><strong>Project Name:</strong> {activeProject?.name}</p>
            <p><strong>Environment:</strong> {activeProject?.environment}</p>
            <p><strong>Retention Policy:</strong> 30 Days Telemetry Storage</p>
            <p><strong>Autonomous AI RCA:</strong> Enabled</p>
          </div>
        </div>
      )}

      {activeTab === 'org' && isOwner && (
        <div className="space-y-6">
          {orgMsg.text && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${orgMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
              {orgMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{orgMsg.text}</span>
            </div>
          )}

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-500" />
                Organization Member Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage members, roles (OWNER / MEMBER), and project assignments for {user?.organization_name || 'your organization'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          </div>

          {/* Members Table */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
              Organization Members ({members.length})
            </h4>

            {isLoadingMembers ? (
              <p className="text-xs text-slate-500">Loading members...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {members.map((m) => {
                      const isCurrentUser = m.user_id === user?.id;
                      const roleTagClass = m.role.toUpperCase() === 'OWNER'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30';

                      return (
                        <tr key={m.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {m.full_name}
                                {isCurrentUser && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 font-mono">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-500 font-mono text-[11px]">{m.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleTagClass}`}>
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(m.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isCurrentUser && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberRole(m)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                                >
                                  Make {m.role.toUpperCase() === 'OWNER' ? 'MEMBER' : 'OWNER'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invite Member Modal */}
          <Modal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            title="Invite New Organization Member"
          >
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Organization Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="MEMBER">MEMBER (Assigned projects only)</option>
                  <option value="OWNER">OWNER (Full organization management access)</option>
                </select>
              </div>

              {inviteRole === 'MEMBER' && projects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assign Projects (Optional)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs">
                    {projects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={inviteAssignedProjects.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteAssignedProjects([...inviteAssignedProjects, p.id]);
                            } else {
                              setInviteAssignedProjects(inviteAssignedProjects.filter((id) => id !== p.id));
                            }
                          }}
                          className="rounded text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{p.name}</span>
                        <span className="text-[10px] uppercase font-mono text-slate-400 ml-auto">{p.environment}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingInvite ? 'Inviting...' : 'Invite Member'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
};
