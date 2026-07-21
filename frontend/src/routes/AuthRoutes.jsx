import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { getMe } from "@/lib/apiClient";

function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page min-h-screen flex items-center justify-center">
        <p className="muted-text">កំពុងផ្ទុក...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <AppShell user={user} />;
}

function PublicOnly({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page min-h-screen flex items-center justify-center">
        <p className="muted-text">កំពុងផ្ទុក...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export { ProtectedRoute, PublicOnly };
