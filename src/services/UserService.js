"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const stripe_1 = __importDefault(require("stripe"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
});
class UserService {
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify userData is provided
            if (!userData || !userData.email || !userData.password || !userData.username) {
                throw new Error("User data, including email, password, and username, is required");
            }
            const saltRounds = 10;
            const hashedPassword = yield bcrypt_1.default.hash(userData.password, saltRounds);
            // generate email verification token
            const emailVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
            const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            // create stripe customer
            const customer = yield stripe.customers.create({
                email: userData.email,
                name: userData.username,
            });
            if (!customer.id) {
                throw new Error("Failed to create Stripe customer");
            }
            // create user object
            const user = new UserModel_1.default(Object.assign(Object.assign({}, userData), { password: hashedPassword, emailVerificationToken,
                emailVerificationExpires, stripeCustomerId: customer.id }));
            console.log("Creating user with data:", user);
            // save user to database
            const savedUser = yield user.save();
            console.log("User created successfully:", savedUser);
            if (!savedUser) {
                throw new Error("Failed to save user to database");
            }
            return savedUser;
        });
    }
    resetPassword(token, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!token || !newPassword) {
                throw new Error("Reset password token and new password are required");
            }
            // verify token is provided
            const user = yield UserModel_1.default.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
            if (!user) {
                throw new Error("Password reset token is invalid or has expired");
            }
            user.password = yield bcrypt_1.default.hash(newPassword, 10);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.updatedAt = new Date();
            yield user.save();
            return user;
        });
    }
    verifyEmail(token) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify token is provided
            if (!token) {
                throw new Error("Email verification token is required");
            }
            // Verify email using the token
            if (!token) {
                throw new Error("Email verification token is required");
            }
            const user = yield UserModel_1.default.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: Date.now() } });
            if (!user) {
                throw new Error("Email verification token is invalid or has expired");
            }
            user.emailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            user.updatedAt = new Date();
            yield user.save();
            return user;
        });
    }
    updateUser(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify userId and updateData are provided
            if (!userId || !updateData) {
                throw new Error("User ID and update data are required");
            }
            // find user by ID
            const user = yield UserModel_1.default.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            // Update user fields
            Object.keys(updateData).forEach((key) => {
                if (user[key] !== undefined) {
                    user[key] = updateData[key];
                }
            });
            // If password is being updated, hash it
            if (updateData.password) {
                const saltRounds = 10;
                user.password = yield bcrypt_1.default.hash(updateData.password, saltRounds);
            }
            user.updatedAt = new Date();
            yield user.save();
            return user;
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify userId is provided
            if (!userId) {
                throw new Error("User ID is required");
            }
            // find user by ID
            const user = yield UserModel_1.default.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            // delete user from followers and following lists
            yield UserModel_1.default.updateMany({ _id: { $in: user.followers } }, { $pull: { following: userId } });
            yield UserModel_1.default.updateMany({ _id: { $in: user.following } }, { $pull: { followers: userId } });
            // delete user posts
            // const Post = require("../Post"); // Assuming Post model is defined in Post.js
            // await Post.deleteMany({ _id: { $in: user.posts } });
            // Optionally, you can also delete the user from Stripe 
            if (user.stripeCustomerId) {
                yield stripe.customers.del(user.stripeCustomerId);
            }
            // Remove the user from the database
            yield user.deleteOne();
            return { message: "User deleted successfully" };
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify email is provided
            if (!email) {
                throw new Error("Email is required");
            }
            // find user by email
            const user = yield UserModel_1.default.findOne({ email });
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify username is provided
            if (!username) {
                throw new Error("Username is required");
            }
            // find user by username
            const user = yield UserModel_1.default.findOne({ username }).populate("followers following");
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield UserModel_1.default.findById(userId).populate("followers following");
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield UserModel_1.default.find().populate("followers following");
            return users;
        });
    }
    getUserByStripeCustomerId(stripeCustomerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify stripeCustomerId is provided
            if (!stripeCustomerId) {
                throw new Error("Stripe customer ID is required");
            }
            // find user by Stripe customer ID
            const user = yield UserModel_1.default.findOne({ stripeCustomerId });
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify email and password are provided
            if (!email || !password) {
                throw new Error("Email and password are required");
            }
            // find user by email
            const user = yield UserModel_1.default.findOne({ email });
            if (!user) {
                throw new Error("Invalid email or password");
            }
            // compare password
            const isMatch = yield bcrypt_1.default.compare(password, user.password);
            if (!isMatch) {
                throw new Error("Invalid email or password");
            }
            // generate JWT and refresh token
            const jwtToken = this.generateJWTAndRefreshToken(user);
            if (!jwtToken) {
                throw new Error("Failed to generate JWT token");
            }
            // update last login time and jwt token
            user.jwtToken = jwtToken;
            user.jwtTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
            user.lastLogin = new Date();
            user.updatedAt = new Date();
            yield user.save();
            // return user without password
            const _a = user.toObject(), { password: _ } = _a, userWithoutPassword = __rest(_a, ["password"]);
            return userWithoutPassword;
        });
    }
    generateJWTAndRefreshToken(user) {
        // verify user is provided
        if (!user) {
            throw new Error("User is required to generate JWT");
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role || "user",
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }, process.env.JWT_SECRET, {
            expiresIn: "1h", // 1 hour expiration
            algorithm: "HS256",
        });
        // // Optionally, you can also generate a refresh token
        // const refreshToken = jwt.sign(
        //     {
        //         id: user._id,
        //         email: user.email,
        //         username: user.username,
        //         role: user.role || "user",
        //         emailVerified: user.emailVerified,
        //         createdAt: user.createdAt,
        //         updatedAt: user.updatedAt,
        //     },
        //     process.env.JWT_SECRET!,
        //     {
        //         expiresIn: "7d", // 7 days expiration
        //         algorithm: "HS256",
        //     }
        // );
        // // Save the refresh token in the user model
        // user.refreshToken = refreshToken;
        // user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // user.jwtToken = token;
        // user.jwtTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        // user.updatedAt = new Date();
        // user.save();
        // Return the JWT token
        if (!token) {
            throw new Error("Failed to generate JWT token");
        }
        return token;
    }
    verifyJWT(token) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify token is provided
            if (!token) {
                throw new Error("JWT token is required");
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                // Check if the token is expired
                if (decoded.jwtTokenExpires && new Date(decoded.jwtTokenExpires) < new Date()) {
                    throw new Error("JWT token has expired");
                }
                return decoded;
            }
            catch (error) {
                console.error("JWT verification failed:", error);
                return null; // Return null if verification fails
            }
        });
    }
    verifyResetToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify token is provided
            if (!token) {
                throw new Error("Reset token is required");
            }
            // find user by reset token
            const user = yield UserModel_1.default.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
            if (!user) {
                return false; // Invalid or expired token
            }
            return true; // Valid token
        });
    }
    generateResetToken(email) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify email is provided
            if (!email) {
                throw new Error("Email is required");
            }
            // find user by email
            const user = yield UserModel_1.default.findOne({ email });
            if (!user) {
                throw new Error("User not found");
            }
            // generate reset token
            const resetToken = crypto_1.default.randomBytes(32).toString("hex");
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
            user.updatedAt = new Date();
            yield user.save();
            return resetToken; // Return the generated reset token
        });
    }
    generateEmailVerificationToken(email) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify email is provided
            if (!email) {
                throw new Error("Email is required");
            }
            // find user by email
            const user = yield UserModel_1.default.findOne({ email });
            if (!user) {
                throw new Error("User not found");
            }
            // generate email verification token
            const emailVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
            user.emailVerificationToken = emailVerificationToken;
            user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            user.updatedAt = new Date();
            yield user.save();
            return emailVerificationToken; // Return the generated email verification token
        });
    }
    getStripeCustomer(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify customerId is provided
            if (!customerId) {
                throw new Error("Stripe customer ID is required");
            }
            try {
                const customer = yield stripe.customers.retrieve(customerId);
                if (!customer) {
                    throw new Error("Stripe customer not found");
                }
                return customer;
            }
            catch (error) {
                console.error("Error retrieving Stripe customer:", error);
                return null; // Return null if retrieval fails
            }
        });
    }
    createStripeCheckoutSession(customerId, priceId) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify customerId and priceId are provided
            if (!customerId || !priceId) {
                throw new Error("Stripe customer ID and price ID are required");
            }
            try {
                const session = yield stripe.checkout.sessions.create({
                    customer: customerId,
                    payment_method_types: ["card"],
                    line_items: [
                        {
                            price: priceId,
                            quantity: 1,
                        },
                    ],
                    mode: "subscription",
                    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
                });
                return session;
            }
            catch (error) {
                console.error("Error creating Stripe checkout session:", error);
                throw new Error("Failed to create Stripe checkout session");
            }
        });
    }
    cancelStripeSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify subscriptionId is provided
            if (!subscriptionId) {
                throw new Error("Stripe subscription ID is required");
            }
            // cancel the subscription
        });
    }
    getStripeSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            // verify subscriptionId is provided
            if (!subscriptionId) {
                throw new Error("Stripe subscription ID is required");
            }
            try {
                const subscription = yield stripe.subscriptions.retrieve(subscriptionId);
                if (!subscription) {
                    throw new Error("Stripe subscription not found");
                }
                return subscription;
            }
            catch (error) {
                console.error("Error retrieving Stripe subscription:", error);
                return null; // Return null if retrieval fails
            }
        });
    }
}
exports.default = UserService;
