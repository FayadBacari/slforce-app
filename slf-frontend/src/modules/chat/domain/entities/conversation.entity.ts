import type { MessageEntity } from './message.entity';

// A conversation between two users
export interface ConversationEntity {
  id:                  string;
  otherParticipantId:  string;
  otherParticipantName:string;
  otherParticipantPhoto:string | undefined;
  isOtherParticipantOnline: boolean;
  lastMessage:         MessageEntity | undefined;
  numberOfUnreadMessages: number;
  updatedAt:           Date;
}
