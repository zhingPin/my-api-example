
// import { ToolConfig } from "../../../../tools/allTools";
// import AppError from "../appError";

// export interface TransformedThread {
//   id: string;
//   threadId: string;
//   assistantId: string;
//   title: string;
//   notes: string;
//   metadata: Record<string, any>;
//   tool_resources: ToolConfig[];
//   object: string;
//   initialMessage: string;
//   createdAt: Date;
// }

// export function transformThread(thread: any): TransformedThread {
//   return {
//     id: thread.id,
//     threadId: thread.threadId,
//     assistantId: thread.assistantId,
//     title: thread.title || "", // Optional field, default to empty string
//     notes: thread.notes || "", // Optional field, default to empty string
//     metadata: thread.metadata || {}, // Default to an empty object
//     tool_resources: thread.tool_resources || [], // Default to an empty array
//     object: thread.object || "thread",
//     initialMessage: thread.initialMessage || "", // Default to empty string
//     createdAt: new Date(thread.createdAt), // Ensure this is a Date
//   };
// }

// export interface TransformedMessage {
//   id: string;
//   threadId: string;
//   sender: string;
//   content: string;
//   timestamp: Date; // Or string if your timestamp is serialized
// }

// export function transformMessage(message: any): TransformedMessage {
//   return {
//     id: message.messageId, // Ensure message.messageId exists
//     threadId: message.threadId,
//     sender: message.sender,
//     content: message.content,
//     timestamp: new Date(message.timestamp), // Convert timestamp to Date if needed
//   };
// }

// export function validateId(id: string | undefined, type: string): void {
//   if (!id) {
//     throw new AppError(`${type} is required`, 400);
//   }
// }
