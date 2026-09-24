export interface Message {
  _id?: string; // MongoDB ObjectId
  message: string;
  timestamp: Date;
  username: string;
  roomId?: string; // Room the message belongs to
}

export type MessageThreadProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
};
