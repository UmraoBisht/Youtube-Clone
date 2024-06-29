import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // one whom to subscribe
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

// Subscription Schema:
// {
// subscriber: { type: Schema.Types.ObjectId, ref: "User" },
// channel: { type: Schema.Types.ObjectId, ref: "USer" },
// status: { type: String, enum: ["active", "inactive"], default: "active" },
// createdAt: { type: Date, default: Date.now },
// }
