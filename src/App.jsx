import { Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing";
import CreateRoom from "./pages/CreateRoom";
import RoomGate from "./pages/RoomGate";
import AmbientBackground from "./components/AmbientBackground";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/room/:code" element={<RoomGate />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <AmbientBackground />
      <div className="relative z-10">
        <h1 className="font-display text-2xl font-semibold mb-3">Page not found</h1>
        <Link to="/" className="text-signal hover:text-signal-glow transition-colors focus-ring">
          ← Back to start
        </Link>
      </div>
    </div>
  );
}
