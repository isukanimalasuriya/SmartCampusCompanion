import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const categories = [
  { label: "Account Access", icon: "🔒" },
  { label: "Course Materials", icon: "📚" },
  { label: "Technical Issue", icon: "⚙️" },
  { label: "Billing", icon: "💳" },
  { label: "General Inquiry", icon: "💬" },
];

const SupportTicketForm = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    phoneNumber: "",
    category: "Account Access",
    description: "",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [errors, setErrors] = useState({
    studentName: true,
    phoneNumber: true,
    description: true,
  });

  const validateField = (field, value) => {
    switch (field) {
      case "studentName":
        return /^[A-Za-z\s]{3,}$/.test(value);
      case "phoneNumber":
        return /^[0-9]{10}$/.test(value);
      case "description":
        return value.trim().length >= 10;
      default:
        return true;
    }
  };

  const isFormValid = () => !Object.values(errors).includes(true);

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
      toast.error(err.response?.data?.message || "Failed to fetch AI suggestions");
      setSuggestions([]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error("Please fix all fields before submitting");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/tickets", formData);
      toast.success("Ticket submitted successfully!");
      setFormData({
        studentName: "",
        phoneNumber: "",
        category: "Account Access",
        description: "",
      });
      setErrors({ studentName: true, phoneNumber: true, description: true });
      setSuggestions([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit ticket.");
    }
  };

  const handleChange = (field, value) => {
    if (field === "studentName" && /[^A-Za-z\s]/.test(value)) {
      toast.error("Full name can only contain letters and spaces");
      return;
    }
    if (field === "phoneNumber" && /[^0-9]/.test(value)) {
      toast.error("Phone can only contain digits");
      return;
    }
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: !validateField(field, value) });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-10"
         style={{ background: "linear-gradient(to bottom, #e0f7fa, #f9f9f9)" }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 w-full max-w-4xl">

        {/* LEFT — FORM */}
        <div className="bg-white rounded-2xl p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
            Support Portal
          </div>

          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">
            How can we <br /> help you today?
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            Fill in the details and we'll get back to you right away.
          </p>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold tracking-widest uppercase text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.studentName}
                  onChange={(e) => handleChange("studentName", e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition
                    ${errors.studentName
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } bg-gray-50 placeholder:text-gray-300`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold tracking-widest uppercase text-gray-500">
                  Phone Number 
                </label>
                <input
                  type="text"
                  placeholder="0712345678"
                  value={formData.phoneNumber}
                  maxLength={10}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition
                    ${errors.phoneNumber
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } bg-gray-50 placeholder:text-gray-300`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold tracking-widest uppercase text-gray-500">
                Issue Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: label })}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl text-xs font-medium transition
                      ${formData.category === label
                        ? "border-2 border-indigo-500 bg-indigo-50 text-indigo-600 font-semibold"
                        : "border border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500"
                      }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold tracking-widest uppercase text-gray-500">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={5}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition resize-none
                  ${errors.description
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                  } bg-gray-50 placeholder:text-gray-300`}
              />
              <p className="text-right text-xs text-gray-400">{formData.description.length} chars</p>
            </div>

            <button
              type="submit"
              disabled={!isFormValid()}
              className={`w-full text-white font-semibold py-4 rounded-xl text-sm transition
                ${isFormValid()
                  ? "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
                  : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              Submit Ticket →
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              +
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">AI Quick Help</h2>
              
            </div>
          </div>

          <div className="flex-1">
            {loadingAI ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400 animate-pulse">Analyzing your issue...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-500">Based on your description, try these steps:</p>
                <ul className="flex flex-col gap-2">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm rounded-xl px-4 py-3">
                      <span className="font-bold text-indigo-400 mt-0.5">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                <span className="text-5xl opacity-20">💬</span>
                <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">
                  Start describing your issue and I'll suggest instant fixes tailored to your problem.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={4000} />
    </div>
  );
};

export default SupportTicketForm;