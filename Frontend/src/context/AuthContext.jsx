import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Course Management State
    const [activeCourseId, setActiveCourseId] = useState(null);
    const [userProgress, setUserProgress] = useState({}); // { skillId: progress }
    const [completedCourses, setCompletedCourses] = useState([]); // [skillId, skillId]

    useEffect(() => {
        // Load course data
        const storedCourses = JSON.parse(localStorage.getItem('brightskill_courses') || '{}');
        if (storedCourses) {
            setActiveCourseId(storedCourses.activeCourseId || null);
            setUserProgress(storedCourses.userProgress || {});
            setCompletedCourses(storedCourses.completedCourses || []);
        }
    }, []);

    // Save course data whenever it changes
    useEffect(() => {
        const courseData = {
            activeCourseId,
            userProgress,
            completedCourses
        };
        localStorage.setItem('brightskill_courses', JSON.stringify(courseData));
    }, [activeCourseId, userProgress, completedCourses]);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('brightskill_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        let userData;

        // Mock Admin Logic
        if (email.toLowerCase() === 'super@brightskill.com') {
            userData = {
                id: 'super_admin_001',
                name: 'Super Admin',
                email: email,
                role: 'super_admin',
                avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=000&color=fff'
            };
        } else if (email.toLowerCase() === 'tutor@brightskill.com') {
            userData = {
                id: 'tutor_001',
                name: 'Lead Tutor',
                email: email,
                role: 'tutor',
                avatar: 'https://ui-avatars.com/api/?name=Lead+Tutor&background=5D3&color=fff'
            };
        } else if (email.toLowerCase() === 'admin@brightskill.com') {
            userData = {
                id: 'admin_001',
                name: 'Admin User',
                email: email,
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
            };
        } else {
            // STRICT CHECK: Check if user exists in our "database" (localStorage) which we populate on register
            const registeredUsers = JSON.parse(localStorage.getItem('brightskill_registered_users') || '[]');
            const foundUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!foundUser) {
                setLoading(false);
                throw new Error("Email not registered");
            }

            if (foundUser.password !== password) {
                setLoading(false);
                throw new Error("Incorrect password");
            }

            userData = foundUser;
        }

        // Store current session user
        localStorage.setItem('brightskill_user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        return userData;
    };

    const register = async (name, username, email, password) => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const userData = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            name: name,
            username: username,
            email: email,
            password: password, // Storing password for mock auth
            role: 'learner',
            avatar: `https://ui-avatars.com/api/?name=${username || name}&background=random`
        };

        // Add to "database" of registered users
        const registeredUsers = JSON.parse(localStorage.getItem('brightskill_registered_users') || '[]');
        registeredUsers.push(userData);
        localStorage.setItem('brightskill_registered_users', JSON.stringify(registeredUsers));

        // Auto login after register
        localStorage.setItem('brightskill_user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('brightskill_user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('brightskill_user', JSON.stringify(newUser));

        // Also update the registered users list if needed (for persistence across mock sessions)
        const registeredUsers = JSON.parse(localStorage.getItem('brightskill_registered_users') || '[]');
        const updatedRegistered = registeredUsers.map(u => u.email === user.email ? { ...u, ...updatedData } : u);
        localStorage.setItem('brightskill_registered_users', JSON.stringify(updatedRegistered));

        return newUser;
    };

    // --- Course Management Functions ---

    const enrollInCourse = (skillId) => {
        if (activeCourseId && activeCourseId !== skillId) {
            throw new Error("You are already enrolled in a course. Please complete it first.");
        }
        setActiveCourseId(skillId);
        // Initialize progress if not exists
        if (!userProgress[skillId]) {
            setUserProgress(prev => ({ ...prev, [skillId]: 0 }));
        }
    };

    const updateCourseProgress = (skillId, progress) => {
        setUserProgress(prev => ({ ...prev, [skillId]: progress }));

        // Auto-complete if 100%
        if (progress >= 100) {
            completeCourse(skillId);
        }
    };

    const completeCourse = (skillId) => {
        if (!completedCourses.includes(skillId)) {
            setCompletedCourses(prev => [...prev, skillId]);
        }
        // Release the lock
        setActiveCourseId(null);
        // Ensure progress is maxed
        setUserProgress(prev => ({ ...prev, [skillId]: 100 }));
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
        // Course Data
        activeCourseId,
        userProgress,
        completedCourses,
        enrollInCourse,
        updateCourseProgress,
        completeCourse
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
