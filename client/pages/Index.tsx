import { Navigate } from "react-router-dom";

export default function Index() {
  // Redirect to login page since we're using a SaaS model
  return <Navigate to="/login" replace />;
}
