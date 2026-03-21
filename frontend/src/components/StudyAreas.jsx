import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "./Navbar";
import { MapPin, Users, Table2 } from "lucide-react";

const socket = io("http://localhost:5000");

const StudyAreas = () => {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  const token = localStorage.getItem("token");

  // Load spaces
  useEffect(() => {
    fetch("http://localhost:5000/api/spaces", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAreas(data.spaces));
  }, []);

  // Load active booking
  useEffect(() => {
    fetch("http://localhost:5000/api/bookings/active", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setActiveBooking(data.active));
  }, []);

  // Load tables
  const fetchTables = async (spaceId) => {
    const res = await fetch(
      `http://localhost:5000/api/spaces/${spaceId}/tables`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();

    setSelectedArea({
      ...data.space,
      tables: data.tables,
    });
  };

  // Book table
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

  // Unbook table
  const handleUnbook = async () => {
    if (!activeBooking) return;

    const res = await fetch(
      `http://localhost:5000/api/bookings/${activeBooking._id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();

    if (!res.ok) alert(data.message);
    else setActiveBooking(null);
  };

  // Real-time updates
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
    <div className="font-poppins flex h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <Navbar />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          📚 Study Spaces
        </h1>

        {/* SPACES */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {areas.map((area) => (
            <div
              key={area._id}
              onClick={() => fetchTables(area._id)}
              className="group cursor-pointer rounded-3xl p-6 bg-white/70 backdrop-blur-lg border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-gray-900">
                  {area.name}
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-600">
                  {area.availableSeats > 0 ? "Available" : "Full"}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                <MapPin size={16} />
                {area.location}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users size={16} />
                  {area.availableSeats} seats left
                </div>
              </div>

              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{
                    width: `${(area.availableSeats / area.totalSeats) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* TABLES */}
        {selectedArea && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {selectedArea.name} Tables
            </h2>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedArea.tables.map((table) => {
                const available = table.availableSeats;
                const isBookedByUser = activeBooking?.tableId === table._id;
                const disableButton =
                  available === 0 || (activeBooking && !isBookedByUser);

                return (
                  <div
                    key={table._id}
                    className="rounded-3xl p-5 bg-white border border-gray-200 shadow-md hover:shadow-lg transition relative"
                  >
                    {isBookedByUser && (
                      <span className="absolute top-3 right-3 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                        Your Seat
                      </span>
                    )}

                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Table2 size={18} />
                        {table.code}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {table.type}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-600">
                      {available} / {table.capacity} seats
                    </p>

                    <div className="mt-3 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{
                          width: `${(available / table.capacity) * 100}%`,
                        }}
                      />
                    </div>

                    {isBookedByUser ? (
                      <button
                        onClick={handleUnbook}
                        className="mt-4 w-full py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:opacity-90 transition"
                      >
                        Unbook
                      </button>
                    ) : (
                      <button
                        disabled={disableButton}
                        onClick={() => handleCheckIn(table._id)}
                        className={`mt-4 w-full py-2 rounded-xl text-sm font-medium transition ${
                          disableButton
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
                        }`}
                      >
                        {available === 0 ? "Full" : "Book Seat"}
                      </button>
                    )}
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
