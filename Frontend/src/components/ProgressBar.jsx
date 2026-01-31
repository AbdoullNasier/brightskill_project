import React from 'react';

const ProgressBar = ({ progress, color = 'bg-primary', height = 'h-2' }) => {
    return (
        <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
            <div
                className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
