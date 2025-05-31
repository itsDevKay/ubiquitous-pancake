import bcrypt from "bcrypt";
import crypto from "crypto";
import Stripe from "stripe";
import UserModel, { IUser } from "../models/UserModel";
import jwt from "jsonwebtoken";
// load environment variables
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
});

class UserService {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        // verify userData is provided
        if (!userData || !userData.email || !userData.password || !userData.username) {
            throw new Error("User data, including email, password, and username, is required");
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password!, saltRounds);

        // generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // create stripe customer
        const customer = await stripe.customers.create({
            email: userData.email,
            name: userData.username,
        });
        if (!customer.id) {
            throw new Error("Failed to create Stripe customer");
        }

        // create user object
        const user = new UserModel({
            ...userData,
            password: hashedPassword,
            emailVerificationToken,
            emailVerificationExpires,
            stripeCustomerId: customer.id
        });
        console.log("Creating user with data:", user);

        // save user to database
        const savedUser = await user.save();
        console.log("User created successfully:", savedUser);
        if (!savedUser) {
            throw new Error("Failed to save user to database");
        }
        return savedUser;
    }

    async resetPassword(token: string, newPassword: string): Promise<IUser> {
        if (!token || !newPassword) {
            throw new Error("Reset password token and new password are required");
        }
        // verify token is provided
        const user = await UserModel.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            throw new Error("Password reset token is invalid or has expired");
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.updatedAt = new Date();
        await user.save();
        return user;
    }

    async verifyEmail(token: string) {
        // verify token is provided
        if (!token) {
            throw new Error("Email verification token is required");
        }

        // Verify email using the token
        if (!token) {
            throw new Error("Email verification token is required");
        }
        const user = await UserModel.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: Date.now() } });
        if (!user) {
            throw new Error("Email verification token is invalid or has expired");
        }
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.updatedAt = new Date();
        await user.save();
        return user;
    }

    async updateUser(userId : string, updateData: Partial<IUser>) {
        // verify userId and updateData are provided
        if (!userId || !updateData) {
            throw new Error("User ID and update data are required");
        }
        // find user by ID
        const user = await UserModel.findById(userId);
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
            user.password = await bcrypt.hash(updateData.password, saltRounds);
        }
        user.updatedAt = new Date();
        await user.save();
        return user;
    }
    
    async deleteUser(userId: string) {
        // verify userId is provided
        if (!userId) {
            throw new Error("User ID is required");
        }
        // find user by ID
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        // delete user from followers and following lists
        await UserModel.updateMany(
            { _id: { $in: user.followers } },
            { $pull: { following: userId } }
        );
        await UserModel.updateMany(
            { _id: { $in: user.following } },
            { $pull: { followers: userId } }
        );

        // delete user posts
        // const Post = require("../Post"); // Assuming Post model is defined in Post.js
        // await Post.deleteMany({ _id: { $in: user.posts } });

        // Optionally, you can also delete the user from Stripe 
        if (user.stripeCustomerId) {
            await stripe.customers.del(user.stripeCustomerId);
        }

        // Remove the user from the database
        await user.deleteOne();
        return { message: "User deleted successfully" };
    }

    async getUserByEmail(email: string): Promise<IUser> {
        // verify email is provided
        if (!email) {
            throw new Error("Email is required");
        }
        // find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async getUserByUsername(username: string): Promise<IUser> {
        // verify username is provided
        if (!username) {
            throw new Error("Username is required");
        }
        // find user by username
        const user = await UserModel.findOne({ username }).populate("followers following");
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async getUserById(userId: string) {
        const user = await UserModel.findById(userId).populate("followers following");
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async getAllUsers() {
        const users = await UserModel.find().populate("followers following");
        return users;
    }

    async getUserByStripeCustomerId(stripeCustomerId: string): Promise<IUser> {
        // verify stripeCustomerId is provided
        if (!stripeCustomerId) {
            throw new Error("Stripe customer ID is required");
        }
        // find user by Stripe customer ID
        const user = await UserModel.findOne({ stripeCustomerId });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async loginUser(email: string, password: string): Promise<Partial<IUser>> {
        // verify email and password are provided
        if (!email || !password) {
            throw new Error("Email and password are required");
        }
        // find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new Error("Invalid email or password");
        }
        // compare password
        const isMatch = await bcrypt.compare(password, user.password);
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
        await user.save();
        // return user without password
        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword as Partial<IUser>;
    }

    generateJWTAndRefreshToken(user: IUser): string {
        // verify user is provided
        if (!user) {
            throw new Error("User is required to generate JWT");
        }
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role || "user",
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: "1h", // 1 hour expiration
                algorithm: "HS256",
            }
        );
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

    async verifyJWT(token: string): Promise<IUser | null> {
        // verify token is provided
        if (!token) {
            throw new Error("JWT token is required");
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IUser;
            // Check if the token is expired
            if (decoded.jwtTokenExpires && new Date(decoded.jwtTokenExpires) < new Date()) {
                throw new Error("JWT token has expired");
            }
            return decoded;
        } catch (error) {
            console.error("JWT verification failed:", error);
            return null; // Return null if verification fails
        }
    }
    
    async verifyResetToken(token: string): Promise<boolean> {
        // verify token is provided
        if (!token) {
            throw new Error("Reset token is required");
        }
        // find user by reset token
        const user = await UserModel.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return false; // Invalid or expired token
        }
        return true; // Valid token
    }

    async generateResetToken(email: string): Promise<string> {
        // verify email is provided
        if (!email) {
            throw new Error("Email is required");
        }
        // find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }
        // generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        user.updatedAt = new Date();
        await user.save();
        return resetToken; // Return the generated reset token
    }

    async generateEmailVerificationToken(email: string): Promise<string> {
        // verify email is provided
        if (!email) {
            throw new Error("Email is required");
        }
        // find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }
        // generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        user.updatedAt = new Date();
        await user.save();
        return emailVerificationToken; // Return the generated email verification token
    }

    async getStripeCustomer(customerId: string): Promise<Stripe.Customer | null> {
        // verify customerId is provided
        if (!customerId) {
            throw new Error("Stripe customer ID is required");
        }
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer) {
                throw new Error("Stripe customer not found");
            }
            return customer as Stripe.Customer;
        } catch (error) {
            console.error("Error retrieving Stripe customer:", error);
            return null; // Return null if retrieval fails
        }
    }

    async createStripeCheckoutSession(customerId: string, priceId: string): Promise<Stripe.Checkout.Session> {
        // verify customerId and priceId are provided
        if (!customerId || !priceId) {
            throw new Error("Stripe customer ID and price ID are required");
        }
        try {
            const session = await stripe.checkout.sessions.create({
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
        } catch (error) {
            console.error("Error creating Stripe checkout session:", error);
            throw new Error("Failed to create Stripe checkout session");
        }
    }

    async cancelStripeSubscription(subscriptionId: string) { //: Promise<Stripe.Subscription> {
        // verify subscriptionId is provided
        if (!subscriptionId) {
            throw new Error("Stripe subscription ID is required");
        }
        // cancel the subscription
    }

    async getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
        // verify subscriptionId is provided
        if (!subscriptionId) {
            throw new Error("Stripe subscription ID is required");
        }
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            if (!subscription) {
                throw new Error("Stripe subscription not found");
            }
            return subscription;
        } catch (error) {
            console.error("Error retrieving Stripe subscription:", error);
            return null; // Return null if retrieval fails
        }
    }
}

export default UserService;