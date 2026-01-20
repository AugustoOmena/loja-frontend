import { Outlet } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

export const ClientLayout = () => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg,
        fontFamily: "sans-serif",
      }}
    >
      <Outlet />
    </div>
  );
};
