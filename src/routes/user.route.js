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
    .post(verifyJwt, changeUserAccountDetails);
router
    .route('/change-account-details')
    .post(verifyJwt, changeUserAccountDetails);
router.route('/change-profile-image').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1,
        },
    ]),
    verifyJwt,
    changeUserProfileAvatar
);
router.route('/change-cover-image').post(
    upload.fields([
        {
            name: 'coverImage',
            maxCount: 1,
        },
    ]),
    verifyJwt,
    changeUserProfileCoverImage
);

export default router;
