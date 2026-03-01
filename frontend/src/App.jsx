import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="font-poppins">
        <h1 className=" font-extrabold bg-blue-500 text-white p-12 rounded-full font-poppins">
          Welcome to Smart Campus Companion
        </h1>
        <p className="text-2xl">Hello Evr</p>
      </div>
    </>
  );
}

export default App;
