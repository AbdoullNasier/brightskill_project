import React from 'react';
import { FaDiscord, FaSlack, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Community = () => {
    return (
        <div className="min-h-screen bg-dark py-20 px-4 sm:px-6 lg:px-8 font-sans text-gray-200">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">BrightSkill Community</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Connect with fellow learners, share your progress, and get mentorship from industry experts.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Discord Card */}
                    <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-primary transition-all group">
                        <div className="bg-[#5865F2]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FaDiscord className="text-3xl text-[#5865F2]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Discord Server</h3>
                        <p className="text-gray-400 mb-6">
                            Live chat, voice channels, and daily challenges. The heartbeat of our community.
                        </p>
                        <button className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors">
                            Join Discord
                        </button>
                    </div>

                    {/* Slack Card */}
                    <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-primary transition-all group">
                        <div className="bg-[#4A154B]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FaSlack className="text-3xl text-[#e01e5a]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Alumni Network</h3>
                        <p className="text-gray-400 mb-6">
                            Professional networking for certified graduates. Find jobs and opportunities.
                        </p>
                        <button className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors">
                            Request Access
                        </button>
                    </div>

                    {/* Forum Card */}
                    <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-primary transition-all group">
                        <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FaUsers className="text-3xl text-primary" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Discussion Forum</h3>
                        <p className="text-gray-400 mb-6">
                            Long-form discussions, article sharing, and detailed Q&A threads.
                        </p>
                        <Link to="/community/forum" className="block w-full text-center py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-colors">
                            Browse Forum
                        </Link>
                    </div>
                </div>

                <div className="mt-20 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 border border-gray-700 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Why Join?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mt-8">
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-green-400" />
                            <p className="text-gray-300">Get 24/7 support from peers and mentors</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-400" />
                            <p className="text-gray-300">Participate in mock interview events</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-purple-400" />
                            <p className="text-gray-300">Unlock exclusive community badges</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Community;
