import { ROUTES } from "./constants";

export const getRedirectPath = (userRole) => {
  switch (userRole?.toUpperCase()) {
    case "OWNER":
      return ROUTES.HOME; // Owners use navigation menu, not dashboard
    case "RENTER":
      return ROUTES.HOME;
    case "SHIPPER":
      return "/shipments"; // Redirect to shipment management page
    case "ADMIN":
      return ROUTES.ADMIN_DASHBOARD; // Nếu có
    default:
      return ROUTES.HOME; // Default fallback
  }
};

export const navigateByRole = (navigate, user) => {
  const redirectPath = getRedirectPath(user?.role);
  navigate(redirectPath, { replace: true });
};
