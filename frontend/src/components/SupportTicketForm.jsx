import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SupportTicketForm = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    phoneNumber: "",
    category: "Account Access",
    description: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // Trigger AI suggestions when description is long enough
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (formData.description.length > 10) fetchAISuggestions();
    }, 1000);
    return () => clearTimeout(debounce);
  }, [formData.description]);

  const fetchAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const { data } = await axios.post("http://localhost:5000/api/ai", {
        description: formData.description,
      });
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("AI Fetch error", err);
      toast.error(
        err.response?.data?.message || "Failed to fetch AI suggestions"
      );
      setSuggestions([]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/tickets", formData);
      toast.success("Ticket submitted successfully!");
      setFormData({
        studentName: "",
        phoneNumber: "",
        category: "Account Access",
        description: "",
      });
      setSuggestions([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit ticket.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-8">
      {/* Form */}
      <div className="flex-1 bg-white p-6 rounded-xl shadow-md max-w-md mr-6">
        <h2 className="text-2xl font-bold mb-4">Submit a Support Ticket</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium">Full Name</label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) =>
                setFormData({ ...formData, studentName: e.target.value })
              }
              required
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium">Phone Number</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              required
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium">Issue Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Account Access</option>
              <option>Course Materials</option>
              <option>General Inquiry</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Please describe your problem..."
              className="w-full border rounded-md p-2 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Submit Ticket & Get Help
          </button>
        </form>
      </div>

      {/* AI Suggestions */}
      <div className="flex-1 bg-yellow-50 p-6 rounded-xl border border-yellow-200 max-w-md">
        <h3 className="text-xl font-semibold text-yellow-800 mb-3">
          💡 AI-Powered Instant Help
        </h3>
        {loadingAI ? (
          <p>Analyzing issue...</p>
        ) : suggestions.length > 0 ? (
          <>
            <p>Based on your description, try these steps:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-500">Suggestions will appear as you type...</p>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={4000} />
    </div>
  );
};

export default SupportTicketForm;