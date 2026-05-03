import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brightskillapp.onrender.com/api';

const ResetPassword = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/password-reset-confirm/${uid}/${token}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.detail || data?.confirm_password?.[0] || 'Password reset failed.');
            }

            setMessage('Password reset successful. Redirecting to login...');
            setTimeout(() => navigate('/login', { replace: true }), 1400);
        } catch (err) {
            setError(err.message || 'Password reset failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full space-y-8 p-10">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Password</h2>
                    <p className="mt-2 text-sm text-gray-600">Set your new password below.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

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

                    {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">{message}</div>}
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">{error}</div>}

                    <Button type="submit" className="w-full flex justify-center py-3" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>

                    <div className="text-center text-sm">
                        <Link to="/login" className="font-medium text-primary hover:text-indigo-500">
                            Back to Login
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ResetPassword;
