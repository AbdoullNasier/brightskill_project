import React from 'react';
import * as Icons from 'react-icons/md';

const Badge = ({ name, icon, description, className = '' }) => {
    const IconComponent = Icons[icon] || Icons.MdStar;

    return (
        <div className={`flex flex-col items-center text-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${className}`}>
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full mb-2">
                <IconComponent size={24} />
            </div>
            <h4 className="font-bold text-sm text-gray-800">{name}</h4>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
    );
};

export default Badge;
