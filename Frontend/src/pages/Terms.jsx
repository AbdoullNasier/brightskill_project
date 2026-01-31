import React from 'react';

const Terms = () => {
    return (
        <div className="min-h-screen bg-dark py-20 px-4 sm:px-6 lg:px-8 font-sans text-gray-200">
            <div className="max-w-4xl mx-auto bg-gray-900/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Terms and Conditions
                </h1>

                <div className="space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                        <p className="leading-relaxed text-gray-400">
                            By accessing or using BrightSkill, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. User Accounts</h2>
                        <p className="leading-relaxed text-gray-400">
                            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Educational Content</h2>
                        <p className="leading-relaxed text-gray-400">
                            The content provided on BrightSkill is for educational purposes only. While we strive to provide high-quality training for soft skills, we make no guarantees regarding specific career outcomes or employment opportunities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
                        <p className="leading-relaxed text-gray-400">
                            The Service and its original content, features, and functionality are and will remain the exclusive property of BrightSkill and its licensors.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Termination</h2>
                        <p className="leading-relaxed text-gray-400">
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};

export default Terms;
