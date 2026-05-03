import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://brightskillapp.onrender.com/api";

const getAccessToken = () => {
  const direct = localStorage.getItem("access");
  if (direct) return direct;

  try {
    const tokens = JSON.parse(localStorage.getItem("brightskill_tokens") || "{}");
    return tokens?.access || null;
  } catch {
    return null;
  }
};

function BecomeTutor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    qualification: "",
    fieldOfStudy: "",
    experienceYears: "",
    skills: "",
    teachingLevel: "",
    bio: "",
    cv: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const payload = new FormData();
      payload.append("phone", formData.phone);
      payload.append("location", formData.location);
      payload.append("qualification", formData.qualification);
      payload.append("field_of_study", formData.fieldOfStudy);
      payload.append("experience_years", formData.experienceYears);
      payload.append("skills", formData.skills);
      payload.append("teaching_level", formData.teachingLevel);
      payload.append("bio", formData.bio);
      payload.append("cv", formData.cv);

      const response = await fetch(`${API_BASE_URL}/tutor/apply/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to submit tutor application.");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to submit tutor application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Apply to Become a Tutor
      </h1>
      <p className="text-gray-600 mb-6 text-center">
        Join our platform as a verified tutor and share your expertise with learners.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <h2 className="text-xl font-semibold mb-3">Personal Information</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              className="p-3 border rounded"
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="location"
              placeholder="Location (City, Country)"
              className="p-3 border rounded"
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">
            Professional Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="qualification"
              placeholder="Highest Qualification"
              className="p-3 border rounded"
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="fieldOfStudy"
              placeholder="Field of Study"
              className="p-3 border rounded"
              onChange={handleChange}
              required
            />
          </div>

          <input
            type="number"
            name="experienceYears"
            placeholder="Years of Experience"
            className="p-3 border rounded mt-4 w-full"
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">
            Teaching Information
          </h2>

          <textarea
            name="skills"
            placeholder="Skills You Want to Teach"
            className="p-3 border rounded w-full"
            onChange={handleChange}
            required
          />

          <select
            name="teachingLevel"
            className="p-3 border rounded w-full mt-4"
            onChange={handleChange}
            required
          >
            <option value="">Select Teaching Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <textarea
            name="bio"
            placeholder="Short Bio"
            className="p-3 border rounded w-full mt-4"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Supporting Documents</h2>

          <input
            type="file"
            name="cv"
            className="w-full"
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

export default BecomeTutor;

