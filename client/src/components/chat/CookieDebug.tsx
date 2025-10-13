import { useApp } from "../../contexts/AppContext";

export const CookieDebug = () => {
  const { state } = useApp();

  const checkCookies = () => {
    const cookies = document.cookie;
    const cookieList = cookies.split(";").map((cookie) => {
      const [name, value] = cookie.trim().split("=");
      return { name, value: value ? `${value.substring(0, 20)}...` : "empty" };
    });

    console.log("🍪 All Cookies Debug:", {
      allCookies: cookies,
      cookieList: cookieList,
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    });

    // Specifically check for the 'jwt' cookie
    const jwtCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("jwt="));
    if (jwtCookie) {
      const token = jwtCookie.split("=")[1];
      console.log(
        `✅ Found jwt cookie: ${
          token ? `${token.substring(0, 20)}...` : "empty"
        }`
      );

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.log(`📋 JWT payload:`, payload);
        } catch (error) {
          console.error(`❌ Error decoding jwt token:`, error);
        }
      }
    } else {
      console.log(`❌ No jwt cookie found`);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 60,
        left: 10,
        background: "lightgreen",
        padding: "10px",
        border: "1px solid #ccc",
        zIndex: 1000,
        fontSize: "12px",
      }}
    >
      <button onClick={checkCookies} style={{ marginBottom: "5px" }}>
        Debug JWT Cookie
      </button>
      <div>User: {state.user?._id || "Not logged in"}</div>
      <div>Auth: {state.isAuthenticated ? "✅" : "❌"}</div>
      <div>
        Has JWT Cookie: {document.cookie.includes("jwt=") ? "✅" : "❌"}
      </div>
    </div>
  );
};
