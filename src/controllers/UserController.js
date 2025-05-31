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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserService_1 = __importDefault(require("../services/UserService"));
class UserController {
    constructor() {
        this.userService = new UserService_1.default();
    }
    registerUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract userData from req.body
            const userData = req.body;
            // Validate userData (e.g., check if email, password, and username are provided)
            if (!userData.email || !userData.password || !userData.username) {
                return res.status(400).json({ error: "Email, password, and username are required." });
            }
            // verify if user already exists
            const existingUserEmail = yield this.userService.getUserByEmail(userData.email).catch(err => {
                console.error("Error checking existing email:", err);
                return null; // Return null if there's an error
            });
            // If user with the same email or username already exists, return an error
            if (existingUserEmail) {
                return res.status(409).json({ error: "Email already exists." });
            }
            const existingUserUsername = yield this.userService.getUserByUsername(userData.username).catch(err => {
                console.error("Error checking existing username:", err);
                return null; // Return null if there's an error
            });
            if (existingUserUsername) {
                return res.status(409).json({ error: "Username already exists." });
            }
            // Create user using the service
            const user = yield this.userService.createUser(userData);
            if (!user) {
                return res.status(500).json({ error: "Failed to create user." });
            }
            console.log("User created successfully:", user.username);
            // Handle user creation logic, e.g., send verification email
            // You might want to send a verification email here
            // For example:
            // await this.userService.sendVerificationEmail(user.email, user.emailVerificationToken);
            // Note: The actual email sending logic is not implemented here, but you can use a service like Nodemailer or SendGrid.
            // Return success response
            return res.status(201).json({ message: "User created successfully.", user });
        });
    }
    verifyEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = req.body.token;
            console.log("Verification token received:", token);
            if (!token) {
                return res.status(400).json({ error: "Verification token is required." });
            }
            // Call this.userService.verifyEmail(token)
            const result = yield this.userService.verifyEmail(token);
            if (!result) {
                return res.status(400).json({ error: "Invalid or expired verification token." });
            }
            return res.status(200).json({ message: "Email verified successfully." });
        });
    }
    getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Call this.userService.getAllUsers()
            const users = yield this.userService.getAllUsers();
            if (!users || users.length === 0) {
                return res.status(404).json({ error: "No users found." });
            }
            // Return success response with users data (excluding passwords)
            return res.status(200).json(users.map(user => ({
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                // Add any other fields you want to return
            })));
        });
    }
    getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get userId from req.params
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ error: "User ID is required." });
            }
            // check if userId is a valid ObjectId
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
                return res.status(400).json({ error: "Invalid User ID format." });
            }
            // Call this.userService.getUserById(userId)
            const user = yield this.userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }
            // Return user data (excluding sensitive fields like password)
            return res.status(200).json({
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                // Add any other fields you want to return
            });
        });
    }
    loginUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract email and password from req.body
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required." });
            }
            // Call this.userService.loginUser(email, password)
            const user = yield this.userService.loginUser(email, password).catch(err => {
                console.error("Error during login:", err);
                return null; // Return null if there's an error
            });
            if (!user) {
                return res.status(401).json({ error: "Invalid email or password." });
            }
            // Return success response with user data (excluding password)
            return res.status(200).json({
                message: "Login successful.",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    bio: user.bio,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    // Add any other fields you want to return
                },
            });
        });
    }
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get token and newPassword from req.body
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ error: "Reset token and new password are required." });
            }
            // Call this.userService.verifyResetToken(token)
            const isValidToken = yield this.userService.verifyResetToken(token);
            if (!isValidToken) {
                return res.status(400).json({ error: "Invalid or expired reset token." });
            }
            // Call this.userService.resetPassword(token, newPassword)
            const result = yield this.userService.resetPassword(token, newPassword);
            if (!result) {
                return res.status(500).json({ error: "Failed to reset password." });
            }
            return res.status(200).json({ message: "Password reset successfully." });
            // Note: You might want to send a confirmation email after resetting the password.
        });
    }
    getUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get userId from req.params
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ error: "User ID is required." });
            }
            // check if userId is a valid ObjectId
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
                return res.status(400).json({ error: "Invalid User ID format." });
            }
            // Call this.userService.getUserById(userId)
            const user = yield this.userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }
            // Return user data (excluding sensitive fields like password)
            return res.status(200).json({
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                // Add any other fields you want to return
            });
        });
    }
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get userId from req.params
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ error: "User ID is required." });
            }
            // check if userId is a valid ObjectId
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
                return res.status(400).json({ error: "Invalid User ID format." });
            }
            // Call this.userService.getUserById(userId)
            const user = yield this.userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }
            const message = yield this.userService.deleteUser(userId);
            if (!message) {
                return res.status(500).json({ error: "Failed to delete user." });
            }
            // Return success response
            return res.status(200).json({ message: "User deleted successfully." });
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get userId from req.params
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ error: "User ID is required." });
            }
            // check if userId is a valid ObjectId
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
                return res.status(400).json({ error: "Invalid User ID format." });
            }
            // Extract updated data from req.body
            const updatedData = req.body;
            // Call this.userService.updateUser(userId, updatedData)
            const user = yield this.userService.updateUser(userId, updatedData);
            if (!user) {
                return res.status(500).json({ error: "Failed to update user." });
            }
            // Return success response with updated user data
            return res.status(200).json({
                message: "User updated successfully.",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    bio: user.bio,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    // Add any other fields you want to return
                },
            });
        });
    }
}
exports.default = UserController;
