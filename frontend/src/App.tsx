import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppRoot } from "@telegram-apps/telegram-ui";
import { MainLayout } from "./components/layout/MainLayout";
import { Spinner } from "./components/common/Spinner";
import { useBootstrap } from "./hooks/useBootstrap";
import { useUserStore } from "./stores/userStore";

const LoginScreen = lazy(() => import("./screens/LoginScreen").then((m) => ({ default: m.LoginScreen })));
const OnboardingScreen = lazy(() =>
  import("./screens/OnboardingScreen").then((m) => ({ default: m.OnboardingScreen })),
);
const HomeScreen = lazy(() => import("./screens/HomeScreen").then((m) => ({ default: m.HomeScreen })));
const ProgressScreen = lazy(() =>
  import("./screens/ProgressScreen").then((m) => ({ default: m.ProgressScreen })),
);
const ClansScreen = lazy(() => import("./screens/ClansScreen").then((m) => ({ default: m.ClansScreen })));
const ProfileScreen = lazy(() => import("./screens/ProfileScreen").then((m) => ({ default: m.ProfileScreen })));
const CameraScreen = lazy(() => import("./screens/CameraScreen").then((m) => ({ default: m.CameraScreen })));
const DiagnosisScreen = lazy(() =>
  import("./screens/DiagnosisScreen").then((m) => ({ default: m.DiagnosisScreen })),
);
const ShopScreen = lazy(() => import("./screens/ShopScreen").then((m) => ({ default: m.ShopScreen })));
const PremiumScreen = lazy(() => import("./screens/PremiumScreen").then((m) => ({ default: m.PremiumScreen })));
const PeerHelpScreen = lazy(() => import("./screens/PeerHelpScreen").then((m) => ({ default: m.PeerHelpScreen })));

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
          <Suspense fallback={<Spinner label="Загрузка экрана…" />}>
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppRoot>
    );
  }

  if (!user.onboardingComplete) {
    return (
      <AppRoot appearance={scheme}>
        <BrowserRouter>
          <Suspense fallback={<Spinner label="Загрузка экрана…" />}>
            <Routes>
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppRoot>
    );
  }

  return (
    <AppRoot appearance={scheme}>
      <BrowserRouter>
        <Suspense fallback={<Spinner label="Загрузка экрана…" />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/progress" element={<ProgressScreen />} />
              <Route path="/clans" element={<ClansScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/peer-help" element={<PeerHelpScreen />} />
            </Route>
            <Route path="/camera" element={<CameraScreen />} />
            <Route path="/diagnosis/:problemId" element={<DiagnosisScreen />} />
            <Route path="/shop" element={<ShopScreen />} />
            <Route path="/premium" element={<PremiumScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppRoot>
  );
}
