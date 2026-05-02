import { Outlet } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { StoreFooter } from "../../components/StoreFooter";

export const ClientLayout = () => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg,
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      <StoreFooter />
    </div>
  );
};
