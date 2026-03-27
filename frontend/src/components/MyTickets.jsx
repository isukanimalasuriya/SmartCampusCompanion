import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("You must be logged in!");
      try {
        const { data } = await axios.get("http://localhost:5000/api/tickets/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(data.tickets);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading tickets...</p>
      </div>
    );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4">My Tickets</h1>
        {tickets.length === 0 ? (
          <p className="text-gray-500">You have not submitted any tickets yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {tickets.map((ticket) => (
              <li
                key={ticket._id}
                className="border p-4 rounded-lg shadow-sm hover:shadow-md transition bg-gray-50"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{ticket.category}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      ticket.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : ticket.status === "Resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-1">{ticket.description}</p>
                <p className="text-gray-400 text-sm">
                  Created at: {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={4000} />
    </div>
  );
};

export default MyTickets;