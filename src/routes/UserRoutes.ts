import express, { Request, Response } from 'express';
import UserController from '../controllers/UserController';
// import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();
const userController = new UserController();

// Define routes for user operations
router.get('/', async (req: Request, res: Response) => {
    await userController.getAllUsers(req, res);
});

router.get('/:userId', async (req: Request, res: Response) => {
    await userController.getUserById(req, res);
});

router.put('/:userId', async (req: Request, res: Response) => {
    await userController.updateUser(req, res);
});

router.delete('/:userId', async (req: Request, res: Response) => {
    await userController.deleteUser(req, res);
});

router.post('/login', async (req: Request, res: Response) => {
    await userController.loginUser(req, res);
});

// router.post('/logout', async (req: Request, res: Response) => {
//     await userController.logoutUser(req, res);
// });

router.post('/register', async (req: Request, res: Response) => {
    await userController.registerUser(req, res);
});

router.post('/reset-password', async (req: Request, res: Response) => {
    await userController.resetPassword(req, res);
});

// router.post('/verify-reset-token', async (req: Request, res: Response) => {
//     await userController.verifyResetToken(req, res);
// });
// router.post('/update-password', async (req: Request, res: Response) => {
//     await userController.updatePassword(req, res);
// });

router.post('/verify-email', async (req: Request, res: Response) => {
    await userController.verifyEmail(req, res);
});


// router.post('/send-reset-email', async (req: Request, res: Response) => {
//     await userController.sendResetEmail(req, res);
// });
// router.post('/send-verification-email', async (req: Request, res: Response) => {
//     await userController.sendVerificationEmail(req, res);
// });
// router.post('/resend-verification-email', async (req: Request, res: Response) => {
//     await userController.resendVerificationEmail(req, res);
// });
// router.post('/change-password', async (req: Request, res: Response) => {
//     await userController.changePassword(req, res);
// });


// router.post('/follow/:userId', async (req: Request, res: Response) => {
//     await userController.followUser(req, res);
// });
// router.post('/unfollow/:userId', async (req: Request, res: Response) => {
//     await userController.unfollowUser(req, res);
// });
// router.get('/followers/:userId', async (req: Request, res: Response) => {
//     await userController.getFollowers(req, res);
// });
// router.get('/following/:userId', async (req: Request, res: Response) => {
//     await userController.getFollowing(req, res);
// });
// router.get('/posts/:userId', async (req: Request, res: Response) => {
//     await userController.getUserPosts(req, res);
// });


// router.post('/stripe/create-customer', async (req: Request, res: Response) => {
//     await userController.createStripeCustomer(req, res);
// });
// router.post('/stripe/create-subscription', async (req: Request, res: Response) => {
//     await userController.createStripeSubscription(req, res);
// });
// router.post('/stripe/cancel-subscription', async (req: Request, res: Response) => {
//     await userController.cancelStripeSubscription(req, res);
// });
// router.get('/stripe/subscription-status', async (req: Request, res: Response) => {
//     await userController.getStripeSubscriptionStatus(req, res);
// });
// router.post('/stripe/webhook', async (req: Request, res: Response) => {
//     await userController.handleStripeWebhook(req, res);
// });


// router.get('/search', async (req: Request, res: Response) => {
//     await userController.searchUsers(req, res);
// });
// router.get('/settings', async (req: Request, res: Response) => {
//     await userController.getUserSettings(req, res);
// });
// router.put('/settings', async (req: Request, res: Response) => {
//     await userController.updateUserSettings(req, res);
// });
// router.post('/upload-profile-picture', async (req: Request, res: Response) => {
//     await userController.uploadProfilePicture(req, res);
// });    


// router.post('/delete-account', async (req: Request, res: Response) => {
//     await userController.deleteUser(req, res);
// });
// router.post('/refresh-token', async (req: Request, res: Response) => {   
//     await userController.refreshToken(req, res);
// });
// router.post('/verify-token', async (req: Request, res: Response) => {
//     await userController.verifyToken(req, res);
// });
// router.post('/logout-all', async (req: Request, res: Response) => {
//     await userController.logoutAll(req, res);
// });

export default router;