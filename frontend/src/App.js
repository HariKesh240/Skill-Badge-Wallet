import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddBadge from "./pages/AddBadge";
import SharedWallet from "./components/SharedWallet"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add" element={<AddBadge />} />
        <Route path="/shared/:userId" element={<SharedWallet />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
