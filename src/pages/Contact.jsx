import React from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { MdEmail, MdLocationOn, MdPhone } from 'react-icons/md';

const Contact = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h1>
                <p className="text-gray-600">Have questions? We'd love to hear from you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Contact Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="h-full bg-white text-gray-800 border border-gray-200" hover={false}>
                        <h2 className="text-xl font-bold mb-6 text-center">Contact Information</h2>
                        <div className="flex flex-col items-start ml-4 space-y-8">
                            <div className="flex items-start">
                                <MdEmail size={24} className="mt-1 mr-4 opacity-80" />
                                <div>
                                    <p className="font-semibold">Email</p>
                                    <p className="opacity-80">support@brightskill.com</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <MdPhone size={24} className="mt-1 mr-4 opacity-80" />
                                <div>
                                    <p className="font-semibold">Phone</p>
                                    <p className="opacity-80">+234 810 273 4258</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <MdLocationOn size={24} className="mt-1 mr-4 opacity-80" />
                                <div>
                                    <p className="font-semibold">Office</p>
                                    <p className="opacity-80">Kano State, Nigeria</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-2">
                    <Card>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Name" placeholder="Your Name" />
                                <Input label="Email" type="email" placeholder="you@example.com" />
                            </div>
                            <Input label="Subject" placeholder="How can we help you?" />
                            <div className="flex flex-col mb-4">
                                <label className="mb-2 text-sm font-semibold text-gray-700">Message</label>
                                <textarea
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 min-h-[150px]"
                                    placeholder="Write your message here..."
                                ></textarea>
                            </div>
                            <Button type="submit" size="lg" className="px-8">Send Message</Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Contact;
