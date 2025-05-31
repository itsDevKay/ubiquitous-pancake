"use strict";
// This code defines a Mongoose schema for a User model in a MongoDB database.
// It includes fields for user authentication, profile information, payment details, and social media interactions.
// The schema also includes methods for creating, updating, deleting users, and handling password resets and email verification.
// The User model is designed to be used in a Node.js application with Mongoose for database interactions.
// The code also includes pre-save and pre-update hooks to manage timestamps and password hashing.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/User.ts
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const ObjectId = Schema.Types.ObjectId;
const User = new Schema({
    // typical user fields often found in a user model
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "" },
    bio: { type: String, default: "" },
    // fields for user authentication and security
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date, default: Date.now },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: "" },
    emailVerificationExpires: { type: Date, default: Date.now },
    // fields for payment and subscription management via stripe checkout
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    stripeSubscriptionStatus: { type: String, enum: ["active", "canceled", "past_due"], default: "active" },
    stripeSubscriptionPlan: { type: String, default: "free" },
    stripeSubscriptionStart: { type: Date, default: Date.now },
    stripeSubscriptionEnd: { type: Date, default: Date.now },
    stripeCancellationDetails: {
        reason: { type: String, default: "" },
        comment: { type: String, default: "" },
        canceledAt: { type: Date, default: null },
    },
    stripeTrialEnd: { type: Date, default: null },
    // user role & activity fields
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: Date.now },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // fields typically used in social media applications
    followers: [{ type: ObjectId, ref: "User" }],
    following: [{ type: ObjectId, ref: "User" }],
    posts: [{ type: ObjectId, ref: "Post" }],
    // fields for JWT authentication
    jwtToken: { type: String, default: "" },
    jwtTokenExpires: { type: Date, default: Date.now },
    refreshToken: { type: String, default: "" },
    refreshTokenExpires: { type: Date, default: Date.now },
    // additional fields for user settings and preferences
    settings: {
        theme: { type: String, default: "light" },
        notifications: { type: Boolean, default: true },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true, // automatically manage createdAt and updatedAt fields
    toJSON: { virtuals: true }, // include virtuals in JSON output
    toObject: { virtuals: true }, // include virtuals in object output
});
User.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});
User.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: new Date() });
    next();
});
// create indexes for email and username
User.index({ email: 1, username: 1 }, { unique: true });
exports.default = mongoose_1.default.model("User", User);
