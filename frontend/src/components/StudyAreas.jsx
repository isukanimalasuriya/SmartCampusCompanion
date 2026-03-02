import React, { useState } from "react";
import Navbar from "./Navbar";

const StudyAreas = () => {
  const [areas, setAreas] = useState(mockAreas);
  const [selectedArea, setSelectedArea] = useState(null);

  const handleCheckIn = (areaId, tableId) => {
    const updated = areas.map((area) => {
      if (area.id !== areaId) return area;

      const updatedTables = area.tables.map((table) => {
        if (table.id !== tableId) return table;

        if (table.occupiedSeats < table.totalSeats) {
          return {
            ...table,
            occupiedSeats: table.occupiedSeats + 1,
          };
        }

        return table;
      });

      return { ...area, tables: updatedTables };
    });

    setAreas(updated);

    if (selectedArea?.id === areaId) {
      const updatedSelected = updated.find((a) => a.id === areaId);
      setSelectedArea(updatedSelected);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Navbar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-6 border-b bg-white">
          <h1 className="text-2xl font-semibold text-gray-900">Study Areas</h1>
          <p className="text-sm text-gray-500">
            Real-time seat availability simulation
          </p>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Area Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {areas.map((area) => {
              const totalSeats = area.tables.reduce(
                (sum, t) => sum + t.totalSeats,
                0,
              );
              const occupiedSeats = area.tables.reduce(
                (sum, t) => sum + t.occupiedSeats,
                0,
              );
              const availableSeats = totalSeats - occupiedSeats;

              return (
                <div
                  key={area.id}
                  onClick={() => setSelectedArea(area)}
                  className="cursor-pointer rounded-2xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {area.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{area.location}</p>

                  <div className="mt-4 text-sm flex justify-between">
                    <span>Total: {totalSeats}</span>
                    <span>Available: {availableSeats}</span>
                  </div>

                  <StatusBadge available={availableSeats} total={totalSeats} />
                </div>
              );
            })}
          </div>

          {/* Tables Section */}
          {selectedArea && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedArea.name} - Tables
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {selectedArea.tables.map((table) => {
                  const available = table.totalSeats - table.occupiedSeats;

                  return (
                    <div
                      key={table.id}
                      className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">
                          Table {table.tableNo}
                        </h3>
                        <span className="text-xs text-gray-500 capitalize">
                          {table.type}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-gray-600">
                        {available} / {table.totalSeats} seats available
                      </div>

                      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{
                            width: `${
                              (table.occupiedSeats / table.totalSeats) * 100
                            }%`,
                          }}
                        />
                      </div>

                      <button
                        disabled={available === 0}
                        onClick={() => handleCheckIn(selectedArea.id, table.id)}
                        className={`mt-4 w-full py-2 rounded-xl text-sm font-medium transition ${
                          available === 0
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {available === 0 ? "Full" : "Check In"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const StatusBadge = ({ available, total }) => {
  let label = "Available";
  let style = "bg-green-50 text-green-700";

  if (available === 0) {
    label = "Full";
    style = "bg-red-50 text-red-700";
  } else if (available / total < 0.25) {
    label = "Nearly Full";
    style = "bg-yellow-50 text-yellow-700";
  }

  return (
    <div
      className={`mt-4 inline-block px-3 py-1 text-xs rounded-lg font-medium ${style}`}
    >
      {label}
    </div>
  );
};

const mockAreas = [
  {
    id: "1",
    name: "Main Library - Level 2",
    location: "Library Building",
    tables: [
      { id: "t1", tableNo: 1, type: "group", totalSeats: 4, occupiedSeats: 2 },
      { id: "t2", tableNo: 2, type: "group", totalSeats: 5, occupiedSeats: 4 },
      { id: "t3", tableNo: 3, type: "single", totalSeats: 1, occupiedSeats: 0 },
    ],
  },
  {
    id: "2",
    name: "Engineering Study Hall",
    location: "Engineering Block",
    tables: [
      { id: "t4", tableNo: 1, type: "group", totalSeats: 4, occupiedSeats: 3 },
      { id: "t5", tableNo: 2, type: "single", totalSeats: 1, occupiedSeats: 1 },
      { id: "t6", tableNo: 3, type: "group", totalSeats: 5, occupiedSeats: 2 },
    ],
  },
];

export default StudyAreas;
