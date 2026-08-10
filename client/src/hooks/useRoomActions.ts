import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/authFetch";

const useRoomActions = () => {
  const navigate = useNavigate();

  const createRoom = () => {
    authFetch(`/rooms/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data: { roomId: string; friendlyName: string }) => {
        navigate(`/room/${data.roomId}`, {
          state: { isHost: true, friendlyName: data.friendlyName },
        });
      })
      .catch((error) => {
        console.error("Error creating room:", error);
      });
  };

  const joinRoom = useCallback(
    (roomName: string) => {
      authFetch(`/rooms/find-by-name/${roomName}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.roomId) {
            navigate(`/room/${data.roomId}`, {
              state: { isHost: false, friendlyName: data.friendlyName }
            });
          } else {
            // TODO: Handle case where no room is found
          }
        })
        .catch((error) => {
          console.error("Error joining room:", error);
        });
    },
    [navigate]
  );

  return { createRoom, joinRoom };
};

export default useRoomActions;
