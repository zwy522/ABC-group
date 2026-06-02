import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Meetings from "@/pages/Meetings";

export default function App() {
  return (
    <Router basename="/ABC-group">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/meetings" element={<Meetings />} />
        </Route>
      </Routes>
    </Router>
  );
}
