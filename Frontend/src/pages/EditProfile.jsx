import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { MdArrowBack, MdSave } from 'react-icons/md';

const EditProfile = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const isAdminArea = ['admin', 'tutor'].includes(user?.role);
    const backTarget = isAdminArea
        ? (user?.role === 'tutor' ? '/admin/tutor-dashboard' : '/admin/dashboard')
        : '/dashboard';
    const pageTitle = isAdminArea ? 'Profile Settings' : t('profile.title');
    const roleLabel = user?.role ? user.role.replace('_', ' ') : 'learner';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setAvatar(user.avatar || '');
            setBio(user.bio || '');
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        await updateUser({ first_name: name, last_name: lastName, avatar, bio });

        setTimeout(() => {
            setIsSaving(false);
            navigate(backTarget);
        }, 500);
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <Button variant="ghost" onClick={() => navigate(backTarget)} className="mb-6 flex items-center">
                <MdArrowBack className="mr-2" /> {isAdminArea ? 'Back to workspace' : t('profile.back')}
            </Button>

            <Card className="p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                    <p className="text-sm text-gray-500 capitalize mt-1">{roleLabel} account</p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <img
                                src={avatar || 'https://via.placeholder.com/100'}
                                alt="Profile Preview"
                                className="h-24 w-24 rounded-full border-4 border-white shadow-md object-cover"
                            />
                            <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                                <label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center">
                                    <MdSave size={16} />
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setAvatar(reader.result);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="First Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Input
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />

                    <Input
                        label={t('auth.email_label')}
                        value={email}
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                        helpText={t('profile.email_help')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 p-3"
                            placeholder="Add a short bio"
                        />
                    </div>

                    <div className="text-sm text-center text-gray-500">
                        {t('profile.upload_hint')}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" className="flex items-center">
                            <MdSave className="mr-2" /> {t('profile.save')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditProfile;
