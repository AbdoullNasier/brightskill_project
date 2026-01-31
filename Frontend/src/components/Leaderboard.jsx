import React from 'react';
import { MdEmojiEvents } from 'react-icons/md';

const Leaderboard = () => {
    const users = [
        { rank: 1, name: 'Sarah Connor', xp: 5200, avatar: 'SC' },
        { rank: 2, name: 'John Doe', xp: 4850, avatar: 'JD' },
        { rank: 3, name: 'Alex Johnson', xp: 2450, avatar: 'AJ', isCurrentUser: true }, // Current user matches Dashboard mock
        { rank: 4, name: 'Emily Blunt', xp: 2100, avatar: 'EB' },
        { rank: 5, name: 'Michael Scott', xp: 1800, avatar: 'MS' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <MdEmojiEvents className="text-yellow-500 text-xl" />
                <h3 className="font-bold text-gray-800">Weekly Leaderboard</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {users.map((user) => (
                    <div
                        key={user.rank}
                        className={`flex items-center justify-between p-4 ${user.isCurrentUser ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-4">
                            <span className={`
                flex-shrink-0 w-6 text-center font-bold 
                ${user.rank === 1 ? 'text-yellow-500' :
                                    user.rank === 2 ? 'text-gray-400' :
                                        user.rank === 3 ? 'text-orange-500' : 'text-gray-500'}
              `}>
                                #{user.rank}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                {user.avatar}
                            </div>
                            <span className={`font-medium ${user.isCurrentUser ? 'text-primary' : 'text-gray-800'}`}>
                                {user.name} {user.isCurrentUser && '(You)'}
                            </span>
                        </div>
                        <span className="font-bold text-gray-600 text-sm">{user.xp.toLocaleString()} XP</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
