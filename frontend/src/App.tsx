import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppRoot } from "@telegram-apps/telegram-ui";
import { MainLayout } from "./components/layout/MainLayout";
import { Spinner } from "./components/common/Spinner";
import { useBootstrap } from "./hooks/useBootstrap";
import { useUserStore } from "./stores/userStore";
import { LoginScreen } from "./screens/LoginScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { ClansScreen } from "./screens/ClansScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { CameraScreen } from "./screens/CameraScreen";
import { DiagnosisScreen } from "./screens/DiagnosisScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { PremiumScreen } from "./screens/PremiumScreen";

export function App() {
  const ready = useBootstrap();
  const user = useUserStore((s) => s.user);

  const scheme = typeof window !== "undefined" ? window.Telegram?.WebApp?.colorScheme ?? "light" : "light";

  if (!ready) {
    return (
      <AppRoot appearance={scheme}>
        <Spinner label="Загрузка…" />
      </AppRoot>
    );
  }

  if (!user) {
    return (
      <AppRoot appearance={scheme}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AppRoot>
    );
  }

  if (!user.onboardingComplete) {
    return (
      <AppRoot appearance={scheme}>
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </BrowserRouter>
      </AppRoot>
    );
  }

  return (
    <AppRoot appearance={scheme}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/progress" element={<ProgressScreen />} />
            <Route path="/clans" element={<ClansScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>
          <Route path="/camera" element={<CameraScreen />} />
          <Route path="/diagnosis/:problemId" element={<DiagnosisScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/premium" element={<PremiumScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppRoot>
  );
}
