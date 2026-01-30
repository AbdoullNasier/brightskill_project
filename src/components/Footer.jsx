import React from 'react';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

const Footer = () => {
    return (
        <footer className="bg-dark text-white pt-12 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            BrightSkill
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Empowering individuals with the soft skills needed to thrive in the modern workplace.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">Platform</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="/Skills" className="hover:text-primary transition-colors">Available Courses</a></li>
                            <li><a href="/community" className="hover:text-primary transition-colors">Community & Mentorship</a></li>
                            <li><a href="/ai-roleplay" className="hover:text-primary transition-colors">AI Role Play</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">Company</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="/about" className="hover:text-primary transition-colors">About Us</a></li>
                            <li><a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">Contact</h4>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li className="flex items-center"><MdEmail className="mr-2" /> support@brightskill.com</li>
                            <li className="flex items-center"><MdPhone className="mr-2" /> +234 810 774 8773</li>
                            <li className="flex items-center"><MdLocationOn className="mr-2" /> Kano, Nigeria</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} BrightSkill. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
