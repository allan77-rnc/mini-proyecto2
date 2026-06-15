export interface Room {
  id: string;
  name: string;
  hostUid: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUid: string;
  senderUsername: string;
  text: string;
  createdAt: string;
}
