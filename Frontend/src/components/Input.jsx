import React from 'react';

const Input = ({ label, type = 'text', placeholder, value, onChange, className = '', ...props }) => {
    return (
        <div className={`flex flex-col mb-4 ${className}`}>
            {label && <label className="mb-2 text-sm font-semibold text-gray-700">{label}</label>}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                {...props}
            />
        </div>
    );
};

export default Input;
