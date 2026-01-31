import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MdDownload, MdArrowBack } from 'react-icons/md';
import Button from '../components/Button';

import logo from '../assets/images/logo1.png';

const Certificate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const certificateRef = useRef(null);

    // Get data from location state or fallback (for testing)
    const { studentName, courseName, date } = location.state || {
        studentName: "Student Name",
        courseName: "Course Title",
        date: new Date().toLocaleDateString()
    };

    const handleDownload = async () => {
        const element = certificateRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`BrightSkill_Certificate_${courseName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Certificate generation failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex items-center"
                >
                    <MdArrowBack className="mr-2" /> Back
                </Button>
                <Button
                    onClick={handleDownload}
                    className="flex items-center"
                >
                    <MdDownload className="mr-2" /> Download PDF
                </Button>
            </div>

            {/* Certificate Template */}
            <div
                ref={certificateRef}
                className="bg-white text-center p-12 shadow-2xl relative w-[800px] h-[600px] flex flex-col items-center justify-center border-[20px] border-double border-primary/20"
                style={{ fontFamily: "'Playfair Display', serif" }} // Ideally add a nice font in index.html
            >
                {/* Decorative Corner */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-primary"></div>
                <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-primary"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-primary"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-primary"></div>

                <div className="mb-4">
                    <img src={logo} alt="BrightSkill Logo" className="h-20 object-contain mx-auto" />
                </div>
                <div className="mb-8">
                    <h1 className="text-5xl font-bold text-primary mb-2 uppercase tracking-widest">Certificate</h1>
                    <span className="text-xl text-gray-500 tracking-wider">OF COMPLETION</span>
                </div>

                <p className="text-lg text-gray-600 mb-4">This is to certify that</p>

                <h2 className="text-4xl font-bold text-gray-900 mb-2 border-b-2 border-gray-300 pb-2 px-12 italic min-w-[400px]">
                    {studentName}
                </h2>

                <p className="text-lg text-gray-600 mt-6 mb-4">has successfully completed the course</p>

                <h3 className="text-3xl font-bold text-secondary mb-12">
                    {courseName}
                </h3>

                <div className="w-full flex justify-between items-end px-16 mt-auto">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-800">{date}</span>
                        <div className="w-40 h-px bg-gray-400 mt-1"></div>
                        <span className="text-sm text-gray-500 mt-2">Date</span>
                    </div>

                    {/* Seal */}
                    <div className="w-24 h-24 rounded-full border-4 border-primary text-primary flex items-center justify-center font-bold text-xs uppercase tracking-widest transform rotate-[-15deg] shadow-lg bg-yellow-50">
                        BrightSkill Certified
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-800 italic font-signature">BrightSkill Team</span>
                        <div className="w-40 h-px bg-gray-400 mt-1"></div>
                        <span className="text-sm text-gray-500 mt-2">Instructor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificate;
