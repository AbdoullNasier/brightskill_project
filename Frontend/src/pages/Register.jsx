import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const Register = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register, loading, isAuthenticated, user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const validatePassword = (pwd) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        const hasNumberOrSpecial = /[0-9!@#$%^&*]/.test(pwd);

        if (pwd.length < minLength) return 'Password must be at least 8 characters long.';
        if (!hasUpperCase) return 'Password must contain at least one uppercase letter.';
        if (!hasLowerCase) return 'Password must contain at least one lowercase letter.';
        if (!hasNumberOrSpecial) return 'Password must contain at least one number or special character.';
        return null;
    };

    const redirectByRole = (registeredUser) => {
        if (location.state?.from) {
            navigate(location.state.from);
        } else if (registeredUser.role === 'admin') {
            navigate('/admin/dashboard');
        } else if (registeredUser.role === 'tutor') {
            navigate('/admin/tutor-dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        try {
            const registeredUser = await register(name, username, email, password, confirmPassword);
            setSuccess('Registration successful. Redirecting...');
            // no artificial delay, go straight to the appropriate page
            redirectByRole(registeredUser);
        } catch (err) {
            setError(err.message || 'Failed to create an account');
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !user || success) return;
        redirectByRole(user);
    }, [isAuthenticated, user, success]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full space-y-8 p-10">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        {t('auth.register_title')}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {t('auth.already_account')}{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-indigo-500">
                            {t('auth.signin_btn')}
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <Input
                            label={t('auth.fullname_label')}
                            type="text"
                            placeholder="Taufeeq Abdurrahman"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <Input
                            label={t('auth.username_label')}
                            type="text"
                            placeholder="taufeeq"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            label={t('auth.email_label')}
                            type="email"
                            placeholder="taufeeq@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label={t('auth.password_label')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            helpText="Min 8 chars, mixed case & number/symbol"
                        />
                        <Input
                            label={t('auth.confirm_password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="********"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <div className='flex items-center'>
                            <input
                                name="show-password"
                                id="show-password"
                                type="checkbox"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label
                                htmlFor="show-password"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Show Password
                            </label>
                        </div>
                    </div>

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <div className="text-sm text-gray-500">
                        By signing up, you agree to our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                    </div>

                    <div>
                        <Button type="submit" className="w-full flex justify-center py-3">
                            {loading ? 'Creating account...' : t('auth.signup_btn')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Register;
