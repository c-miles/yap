export interface Message {
  _id?: string;
  message: string;
  timestamp: Date;
  username: string;
  roomId?: string;
}

export type MessageThreadProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
};
