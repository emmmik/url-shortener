import ShortenForm from "./components/ShortenForm";
import Dashboard from "./components/Dashboard";

export default function Home() {
  return (
    <div className="mx-auto mt-12 w-full max-w-5xl border-2 border-black bg-white">
      <Dashboard />
      <div className="bg-white px-5 pb-5 pt-3">
        <ShortenForm />
      </div>
    </div>
  );
}
