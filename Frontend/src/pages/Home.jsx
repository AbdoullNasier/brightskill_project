import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdRocketLaunch, MdPsychology, MdSchool } from 'react-icons/md';
import howItWorksData from '../data/howItWorks';
import Button from '../components/Button';
import Card from '../components/Card';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Home = () => {
    const { t } = useLanguage();
    const { isAuthenticated, logout } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            logout();
        }
    }, [isAuthenticated, logout]);

    const features = [
        {
            icon: <MdPsychology className="text-4xl text-primary" />,
            title: t('home.feature1_title'),
            description: t('home.feature1_desc')
        },
        {
            icon: <MdSchool className="text-4xl text-secondary" />,
            title: t('home.feature2_title'),
            description: t('home.feature2_desc')
        },
        {
            icon: <MdRocketLaunch className="text-4xl text-pink-500" />,
            title: t('home.feature3_title'),
            description: t('home.feature3_desc')
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="space-y-20 pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="relative bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center"
                    >
                        <motion.h1 variants={itemVariants} className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-6xl">
                            <span className="block">{t('home.welcome')}</span>
                            <span className="block text-primary mt-2">{t('home.subtitle')}</span>
                        </motion.h1>
                        <motion.p variants={itemVariants} className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                            <span>{t('home.paragraph')}</span>
                        </motion.p>
                        <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-4">
                            <Link to="/register">
                                <Button size="lg" className="px-8 py-3 text-lg">{t('btn.start')}</Button>
                            </Link>
                            <Link to="/about">
                                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">{t('btn.learn_more')}</Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} delay={index * 0.1} className="text-center p-8">
                            <div className="flex justify-center mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* How It Works Preview */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        {t('home.how_it_works')}
                    </h2>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                        {t('home.how_desc')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {howItWorksData.slice(0, 3).map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.id} delay={index * 0.1} className="p-8 rounded-2xl shadow-sm">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                                    <Icon className="text-primary text-2xl" />
                                </div>

                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.description}</p>
                            </Card>
                        );
                    })}
                </div>


                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 flex justify-center"
                >
                    <Link to="/how-it-works">
                        <Button size="lg" className="px-10">
                            {t('home.full_path')}
                        </Button>
                    </Link>
                </motion.div>
            </section>

        </div>
    );
};

export default Home;
