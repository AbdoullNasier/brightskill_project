import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = true, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: delay }}
            whileHover={hover ? { y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : {}}
            className={`bg-white rounded-xl p-6 border border-gray-100 shadow-md ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default Card;
