import { Store } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <Store size={30} />
      </div>

      <div className="loading-spinner" />

      <p>Loading Supermarket POS...</p>
    </div>
  );
}