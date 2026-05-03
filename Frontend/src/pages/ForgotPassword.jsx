import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brightskillapp.onrender.com/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const extractErrorMessage = (data) => {
        if (!data || typeof data !== 'object') return 'Failed to request password reset.';
        if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;

        const emailError = data.email;
        if (Array.isArray(emailError) && emailError.length > 0) return String(emailError[0]);
        if (typeof emailError === 'string' && emailError.trim()) return emailError;

        const firstArrayError = Object.values(data).find((value) => Array.isArray(value) && value.length > 0);
        if (firstArrayError) return String(firstArrayError[0]);

        return 'Failed to request password reset.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/password-reset/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(extractErrorMessage(data));
            }

            setMessage(data?.message || 'If an account exists for this email, a reset link has been sent.');
        } catch (err) {
            setError(err.message || 'Failed to request password reset.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full space-y-8 p-10">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot Password</h2>
                    <p className="mt-2 text-sm text-gray-600">Enter your email to receive a password reset link.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">{message}</div>}
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">{error}</div>}

                    <Button type="submit" className="w-full flex justify-center py-3" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
