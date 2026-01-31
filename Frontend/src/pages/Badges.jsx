import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../context/GamificationContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { MdArrowBack } from 'react-icons/md';

const Badges = () => {
    const { badges } = useGamification();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 flex items-center">
                <MdArrowBack className="mr-2" /> Back to Dashboard
            </Button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Your Achievements</h1>
                <p className="text-gray-600">You have earned {badges.length} badges!</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {badges.map(badge => (
                    <Badge key={badge.id} {...badge} className="h-full" />
                ))}
            </div>
        </div>
    );
};

export default Badges;
