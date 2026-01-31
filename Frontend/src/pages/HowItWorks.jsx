import React, { useEffect } from 'react'
import howItWorksData from '../data/howItWorks';
import { Link, useLocation } from 'react-router-dom';

const HowItWorks = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToBottom) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className='pt-24 px-7 max-w-7xl mx-auto'>
      <h1 className="text-3xl font-bold text-center mb-4">
        How It Works
      </h1>
      <p className="text-center text-gray-800 max-w-2xl mx-auto mb-16">
        Discover how BrightSkill empowers you to enhance your soft skills through a personalized learning journey.
      </p>
      <div className="grid md:grid-cols-3 gap-12 relative">
        {howItWorksData.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.id} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center text-primary font-bold">
                {item.step}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="text-primary" size={20} />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className=" mt-24 mb-32 text-center">
        <Link to="/register">
          <button className="bg-primary text-white px-12 py-4 rounded-full text-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            Get Started Now
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HowItWorks
