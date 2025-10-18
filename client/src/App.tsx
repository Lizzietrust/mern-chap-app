import { AppRouter } from "./router/AppRouter";
import { NotificationToast } from "./components/notifications/NotificationToast";

function App() {
  return (
    <>
      <AppRouter />
      <NotificationToast />
    </>
  );
}

export default App;
