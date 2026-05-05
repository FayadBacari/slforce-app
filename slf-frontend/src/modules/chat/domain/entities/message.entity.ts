// A single message in a conversation
export interface MessageEntity {
  id:          string;
  text:        string | undefined;
  authorId:    string;
  authorName:  string;
  authorPhoto: string | undefined;
  sentAt:      Date;
  status:      MessageDeliveryStatus;
  attachments: MessageAttachment[];
}

// Whether the message was delivered successfully or not
export type MessageDeliveryStatus = 'sending' | 'sent' | 'failed';

// An attached file (photo, video, or document)
export interface MessageAttachment {
  id:        string;
  type:      'image' | 'video' | 'file';
  url:       string;
  name:      string | undefined;
  sizeBytes: number | undefined;
  mimeType:  string | undefined;
}

// A payment request sent inside a conversation
export interface PaymentRequestMessage {
  amountInEuros: number;
  description:   string | undefined;
  status:        'pending' | 'paid' | 'declined';
}
