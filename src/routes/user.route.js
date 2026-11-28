import { Router } from 'express';
import {
    registerUser,
    logInUser,
    logOutUser,
    refreshAccessToken,
    changeAndUpdatePassword,
    changeUserAccountDetails,
    changeUserProfileAvatar,
    changeUserProfileCoverImage,
    getWatchHistory,
    getUserDetails,
    getUserChannelProfile,
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';

const router = Router();
router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1,
        },
        {
            name: 'coverImage',
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route('/login').post(upload.none(), logInUser);
router.route('/logout').post(verifyJwt, logOutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/update-password').post(verifyJwt, changeAndUpdatePassword);
router
    .route('/change-account-details')
    .patch(verifyJwt, changeUserAccountDetails);
router
    .route('/change-profile-image')
    .patch(verifyJwt, upload.single('avatar'), changeUserProfileAvatar);
router
    .route('/change-cover-image')
    .patch(verifyJwt, upload.single('coverImage'), changeUserProfileCoverImage);
router.route('/profile').get(verifyJwt, getUserDetails);
router.route('/channel/:username').get(verifyJwt, getUserChannelProfile);
router.route('/history').get(verifyJwt, getWatchHistory);

export default router;
