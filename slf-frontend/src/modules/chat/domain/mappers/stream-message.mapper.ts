// ─── Stream → MessageEntity mapper ───────────────────────────────────────────
//
// Stream Chat uses multiple overlapping message types (local, server, optimistic).
// We cast through `unknown` and read only the fields we need so any SDK version
// change is handled in one place.

import type { MessageEntity } from '../entities/message.entity';

// Converts any Stream Chat message object (local, server, or optimistic) to
// our clean `MessageEntity` domain type.
export function convertStreamMessageToMessageEntity(streamMessage: unknown): MessageEntity {
  const msg = streamMessage as {
    id?:           string;
    text?:         string;
    user?:         { id?: string; name?: string; image?: string };
    created_at?:   string | Date;
    attachments?:  Array<{
      type?:       string;
      asset_url?:  string;
      image_url?:  string;
      thumb_url?:  string;
      title?:      string;
      mime_type?:  string;
    }>;
  };

  return {
    id:          msg.id ?? `temp-${Date.now()}`,
    text:        msg.text,
    authorId:    msg.user?.id  ?? '',
    authorName:  msg.user?.name ?? '',
    authorPhoto: msg.user?.image,
    sentAt:      msg.created_at ? new Date(msg.created_at) : new Date(),
    status:      'sent',
    attachments: (msg.attachments ?? []).map((attachment) => ({
      id:        attachment.asset_url ?? attachment.thumb_url ?? String(Date.now()),
      type:      (attachment.type as 'image' | 'video' | 'file') ?? 'file',
      url:       attachment.asset_url ?? attachment.image_url ?? '',
      name:      attachment.title,
      sizeBytes: undefined,
      mimeType:  attachment.mime_type,
    })),
  };
}
