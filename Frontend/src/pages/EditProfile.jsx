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
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setAvatar(user.avatar || '');
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        // Use context function to update global state and local storage
        await updateUser({ name, avatar });

        // Short delay for UX
        setTimeout(() => {
            setIsSaving(false);
            navigate('/dashboard');
        }, 500);
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 flex items-center">
                <MdArrowBack className="mr-2" /> {t('profile.back')}
            </Button>

            <Card className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.title')}</h1>

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
                        label={t('auth.fullname_label')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Input
                        label={t('auth.email_label')}
                        value={email}
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                        helpText={t('profile.email_help')}
                    />

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
