import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-dark py-20 px-4 sm:px-6 lg:px-8 font-sans text-gray-200">
            <div className="max-w-4xl mx-auto bg-gray-900/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Privacy Policy
                </h1>

                <div className="space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                        <p className="leading-relaxed text-gray-400">
                            We collect information you provide directly to us, such as when you create an account, update your profile, or participate in our interactive features. This includes your name, email address, username, and learning progress data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                        <p className="leading-relaxed text-gray-400">
                            We use the information we collect to operate, maintain, and improve our services. Specifically, we use your data to personalize your learning experience, track your progress, and provide AI-driven feedback for your soft skills training.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
                        <p className="leading-relaxed text-gray-400">
                            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Cookies and Tracking</h2>
                        <p className="leading-relaxed text-gray-400">
                            We use cookies to understand how you use our website and improve your experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Contact Us</h2>
                        <p className="leading-relaxed text-gray-400">
                            If you have any questions about this Privacy Policy, please contact us at <span className="text-primary font-medium">contact.brightskill@gmail.com</span>.
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

export default PrivacyPolicy;
