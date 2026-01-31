import React from 'react'
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIAssistant from '../components/AIAssistant';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800 bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
};

export default MainLayout;