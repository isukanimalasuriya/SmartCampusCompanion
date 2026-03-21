import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "./Navbar";

const socket = io("http://localhost:5000");

const StudyAreas = () => {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  const token = localStorage.getItem("token");

  // 🔹 Load spaces
  useEffect(() => {
    fetch("http://localhost:5000/api/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAreas(data.spaces));
  }, []);

  // 🔹 Load active booking
  useEffect(() => {
    fetch("http://localhost:5000/api/bookings/active", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setActiveBooking(data.active));
  }, []);

  // 🔹 Load tables
  const fetchTables = async (spaceId) => {
    const res = await fetch(
      `http://localhost:5000/api/spaces/${spaceId}/tables`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();

    setSelectedArea({
      ...data.space,
      tables: data.tables,
    });
  };

  // 🔹 Booking
  const handleCheckIn = async (tableId) => {
    const res = await fetch("http://localhost:5000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tableId, seats: 1 }),
    });

    const data = await res.json();

    if (!res.ok) alert(data.message);
    else setActiveBooking(data.booking);
  };

  // 🔹 Real-time updates
  useEffect(() => {
    socket.on("seatUpdated", ({ tableId, availableSeats }) => {
      setSelectedArea((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          tables: prev.tables.map((t) =>
            t._id === tableId ? { ...t, availableSeats } : t,
          ),
        };
      });
    });

    return () => socket.off("seatUpdated");
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />

      <div className="flex-1 p-6">
        <h1 className="text-xl font-bold mb-4">Study Spaces</h1>

        {/* SPACES */}
        <div className="grid grid-cols-3 gap-4">
          {areas.map((area) => (
            <div
              key={area._id}
              onClick={() => fetchTables(area._id)}
              className="p-4 bg-white shadow rounded cursor-pointer"
            >
              <h2 className="font-semibold">{area.name}</h2>
              <p>{area.location}</p>
              <p>Available: {area.availableSeats}</p>
            </div>
          ))}
        </div>

        {/* TABLES */}
        {selectedArea && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-3">{selectedArea.name}</h2>

            <div className="grid grid-cols-3 gap-4">
              {selectedArea.tables.map((table) => {
                const available = table.availableSeats;

                return (
                  <div key={table._id} className="p-4 bg-white shadow rounded">
                    <h3>{table.code}</h3>
                    <p>
                      {available} / {table.capacity}
                    </p>

                    <button
                      disabled={available === 0 || activeBooking}
                      onClick={() => handleCheckIn(table._id)}
                      className={`mt-2 w-full py-2 rounded ${
                        available === 0 || activeBooking
                          ? "bg-gray-300"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {activeBooking
                        ? "Already Booked"
                        : available === 0
                          ? "Full"
                          : "Book"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyAreas;
