import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, loading, isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isSubmitting = loading || Boolean(success);

  const redirectByRole = (loggedInUser) => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (loggedInUser.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (loggedInUser.role === 'tutor') {
      navigate('/admin/tutor-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogin = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setError('');
      setSuccess('');

      const result = await login(username, password);

      if (result.success) {
        setSuccess(result.message);
        // navigate immediately once login succeeds (no unnecessary delay)
        redirectByRole(result.user);
    } else {
      setError(result.message);
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
            {t('auth.signin_title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-indigo-500"
            >
              {t('auth.create_account')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <Input
              label={t('auth.username_label')}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label={t('auth.password_label')}
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="show-password"
                name="show-password"
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

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary hover:text-indigo-500"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <Button type="submit" className="w-full flex justify-center py-3">
              {isSubmitting ? t('auth.signin_loading') : t('auth.signin_btn')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
