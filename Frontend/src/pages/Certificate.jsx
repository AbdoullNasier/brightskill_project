import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MdDownload, MdArrowBack } from 'react-icons/md';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/images/logo1.png';

const Certificate = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const { apiRequest, user } = useAuth();
    const certificateRef = useRef(null);
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCertificate = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await apiRequest('/certificates/');
                if (!response.ok) {
                    throw new Error('Failed to load certificates.');
                }

                const data = await response.json();
                const certificates = Array.isArray(data) ? data : [];
                const selectedCertificate = courseId
                    ? certificates.find((item) => Number(item.course) === Number(courseId))
                    : certificates[0];

                if (!selectedCertificate) {
                    setCertificate(null);
                    setError('No issued certificate was found for this course yet.');
                    return;
                }

                setCertificate(selectedCertificate);
            } catch (loadError) {
                setCertificate(null);
                setError(loadError.message || 'Failed to load certificate.');
            } finally {
                setLoading(false);
            }
        };

        loadCertificate();
    }, [apiRequest, courseId]);

    const studentName = useMemo(
        () => user?.first_name || user?.username || 'Learner',
        [user]
    );
    const courseName = certificate?.course_title || 'Course';
    const date = certificate?.issued_at
        ? new Date(certificate.issued_at).toLocaleDateString()
        : '';

    const handleDownload = async () => {
        const element = certificateRef.current;
        if (!element || !certificate) return;

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center p-4">Loading certificate...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
                <p className="text-lg text-gray-700">{error}</p>
                <Button variant="outline" onClick={() => navigate('/skills')}>
                    Back to Courses
                </Button>
            </div>
        );
    }

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

                <p className="absolute bottom-6 text-xs tracking-wide text-gray-500">
                    Certificate ID: {certificate?.certificate_id}
                </p>
            </div>
        </div>
    );
};

export default Certificate;
