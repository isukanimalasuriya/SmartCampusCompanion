import React, { createContext, useContext, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Mock current user - In a real app, this would come from an Auth API
  const [user] = useState({
    id: "user_67890",
    name: "John Doe",
    email: "john.doe@my.sliit.lk",
    avatar: "JD",
    role: "student"
  });

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
