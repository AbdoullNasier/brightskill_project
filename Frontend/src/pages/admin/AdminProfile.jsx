import React, { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';

const emptyPasswordForm = {
    current_password: '',
    new_password: '',
    confirm_password: '',
};

const AdminProfile = () => {
    const { apiRequest, user, refreshCurrentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        avatar: '',
    });
    const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await apiRequest('/auth/profile/settings/');
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.detail || 'Failed to load profile settings.');
                }
                setProfile(data);
                setProfileForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    bio: data.bio || '',
                    avatar: data.avatar || '',
                });
            } catch (err) {
                setError(err.message || 'Failed to load profile settings.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [apiRequest]);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setError('');
        setSuccess('');
        try {
            const response = await apiRequest('/auth/profile/settings/', {
                method: 'PATCH',
                body: JSON.stringify(profileForm),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.detail || 'Failed to update profile settings.');
            }
            setProfile(data);
            await refreshCurrentUser();
            setSuccess('Profile settings updated successfully.');
        } catch (err) {
            setError(err.message || 'Failed to update profile settings.');
        } finally {
            setSavingProfile(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        setSavingPassword(true);
        setError('');
        setSuccess('');
        try {
            const response = await apiRequest('/auth/profile/change-password/', {
                method: 'POST',
                body: JSON.stringify(passwordForm),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.current_password?.[0] ||
                    data?.confirm_password?.[0] ||
                    data?.new_password?.[0] ||
                    'Failed to update password.'
                );
            }
            setPasswordForm(emptyPasswordForm);
            setSuccess(data?.message || 'Password updated successfully.');
        } catch (err) {
            setError(err.message || 'Failed to update password.');
        } finally {
            setSavingPassword(false);
        }
    };

    const tutorApplication = profile?.tutor_application;
    const displayName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user?.username || 'User';
    const roleLabel = profile?.role ? profile.role.replace('_', ' ') : user?.role || 'user';

    if (loading) {
        return <div className="text-sm text-gray-500">Loading profile settings...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
                <p className="text-sm text-gray-500">Manage account details, tutor information, and security settings.</p>
            </div>

            {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-1" hover={false}>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200 mb-4">
                            {profileForm.avatar ? (
                                <img src={profileForm.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                        <p className="text-sm text-gray-500">@{profile?.username}</p>
                        <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                            {roleLabel}
                        </p>
                        <div className="mt-6 w-full space-y-3 text-left text-sm">
                            <div>
                                <p className="text-gray-500">Email</p>
                                <p className="font-medium text-gray-800 break-all">{profile?.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Joined</p>
                                <p className="font-medium text-gray-800">{profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : '-'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="xl:col-span-2" hover={false}>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
                    <form onSubmit={saveProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                value={profileForm.first_name}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, first_name: e.target.value }))}
                            />
                            <Input
                                label="Last Name"
                                value={profileForm.last_name}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, last_name: e.target.value }))}
                            />
                        </div>
                        <Input
                            label="Avatar URL"
                            value={profileForm.avatar}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, avatar: e.target.value }))}
                            placeholder="https://example.com/photo.jpg"
                        />
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Bio</label>
                            <textarea
                                value={profileForm.bio}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                                rows={5}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                placeholder="Write a short profile summary"
                            />
                        </div>
                        <Button type="submit" disabled={savingProfile}>
                            {savingProfile ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </form>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card hover={false}>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Security</h2>
                    <form onSubmit={changePassword} className="space-y-4">
                        <Input
                            label="Current Password"
                            type="password"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                            required
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                            required
                        />
                        <Button type="submit" disabled={savingPassword}>
                            {savingPassword ? 'Updating...' : 'Change Password'}
                        </Button>
                    </form>
                </Card>

                <Card hover={false}>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Tutor Details</h2>
                    {tutorApplication ? (
                        <div className="space-y-3 text-sm text-gray-700">
                            <div>
                                <p className="text-gray-500">Application Status</p>
                                <p className="font-medium capitalize">{tutorApplication.status}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Phone</p>
                                <p className="font-medium">{tutorApplication.phone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium">{tutorApplication.location || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Qualification</p>
                                <p className="font-medium">{tutorApplication.qualification || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Field of Study</p>
                                <p className="font-medium">{tutorApplication.field_of_study || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Experience</p>
                                <p className="font-medium">{tutorApplication.experience_years ?? '-'} years</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Teaching Level</p>
                                <p className="font-medium">{tutorApplication.teaching_level || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Skills</p>
                                <p className="font-medium whitespace-pre-wrap">{tutorApplication.skills || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Tutor Bio</p>
                                <p className="font-medium whitespace-pre-wrap">{tutorApplication.bio || '-'}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            No tutor application details are available for this account yet.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminProfile;
