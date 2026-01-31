import React from 'react';
import Card from '../components/Card';

const About = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">About BrightSkill</h1>
                <p className="text-lg text-gray-600">
                    Bridging the gap between technical expertise and human connection.
                </p>
            </div>

            <div className="space-y-8">
                <Card className="p-8">
                    <h2 className="text-2xl font-bold mb-4 text-primary">Our Mission</h2>
                    <p className="text-gray-700 leading-relaxed">
                        At BrightSkill, we believe that while technical skills get you the interview, soft skills get you the job and the promotion.
                        Our mission is to democratize access to high-quality soft skills training, making it accessible, engaging, and effective for everyone,
                        regardless of their background or current career stage.
                    </p>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <h3 className="text-xl font-bold mb-2">Why Soft Skills?</h3>
                        <p className="text-gray-600">
                            In an age of AI and automation, human-centric skills like empathy, adaptability, and clear communication are becoming more valuable than ever.
                            They are the future-proof assets of the modern workforce, no matter which field you came from.
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-bold mb-2">How We Teach</h3>
                        <p className="text-gray-600">
                            We combine proven pedagogical methods with cutting-edge AI technology.
                            Interactive lessons provide the theory, while our AI roleplay bots give you a safe space to practice and receive instant, personalized feedback.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default About;
