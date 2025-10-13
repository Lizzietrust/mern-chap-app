import { useSocketDebug } from "../../hooks/useSocketDebug";

export const SocketDebugPanel = () => {
  const { socketEvents, clearEvents, isConnected, onlineUsers, socketId } =
    useSocketDebug();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "black",
        color: "white",
        padding: "10px",
        border: "1px solid #ccc",
        zIndex: 1000,
        fontSize: "10px",
        maxWidth: "400px",
        maxHeight: "300px",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <strong>Socket Debug</strong>
        <button
          onClick={clearEvents}
          style={{ fontSize: "10px", padding: "2px 5px" }}
        >
          Clear
        </button>
      </div>
      <div>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
      <div>Socket ID: {socketId || "None"}</div>
      <div>Online Users: {onlineUsers.length}</div>
      <div style={{ marginTop: "10px" }}>
        <strong>Recent Events:</strong>
        {socketEvents.length === 0 ? (
          <div>No events yet</div>
        ) : (
          socketEvents.map((event, index) => (
            <div key={index} style={{ margin: "2px 0" }}>
              {event}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
