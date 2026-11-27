import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emailValidation } from '../utils/verifyEmail.js';
import { passwordValidation } from '../utils/verifyPassword.js';
import { User } from '../models/user.model.js';
import { cloudinaryUploader } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        // console.log([accessToken,refreshToken])
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(400, 'Something went wrong while log in user');
    }
};

const urlEncoder = (url) => {
    const urlElements = url.split('/');
    const length = urlElements.length;
    const public_id = `${urlElements[length - 2]}/${urlElements[length - 1]}`;
    return public_id;
};

const deleteImageFromCloudinary = async (public_id) => {
    const result = await cloudinary.uploader.destroy(public_id, {
        resource_type: 'image',
        invalidate: true,
    });
};

const registerUser = asyncHandler(async (req, res) => {
    /* 
    We need to set algo how we will register a user according to our model
    1. Get the data from frontend or response
    2. check if any required data is empty and check if email is correct, is password is more than 8 letters have one special character and mix of numbers and alphabet
    3. check if the user is already in db or not using username and email
    4. get the avatar and coverImage and checks if the avatar is in the data or not 
    5. save it on cloudinary and checks if it saved on cloudinary or not
    6. now create user object and upload it on mongodb
    7.remove password and refreshToken from the response we get from the mongodb
    8. check if user created or not
    9. return the response
    */

    //    console.log(req.body)
    // console.log(req.files)
    // console.log(req.body)
    const { username, email, fullName, password } = req.body;
    // console.log(email)
    if (
        [username, email, fullName, password].some(
            (field) => field?.trim() == ''
        )
    ) {
        throw new ApiError(400, 'All fields are required!');
    }
    if (!emailValidation(email)) {
        throw new ApiError(400, 'Invalid Email Format');
    }
    if (!passwordValidation(password)) {
        throw new ApiError(
            400,
            'Password must contain atleast 8 character,one Uppercase letter,one Lowercase letter,one special character, and one number'
        );
    }
    const isUserExist = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (isUserExist) {
        throw new ApiError(409, 'User is already registered');
    }
    const avatarLocalFilePath = req.files?.avatar[0].path;
    // let coverImageLocalFilePath=req.files?.coverImage[0].path  //this will cause error if coverImage is not given
    if (!avatarLocalFilePath) {
        throw new ApiError(400, 'Avatar image is required');
    }
    const avatar = await cloudinaryUploader(avatarLocalFilePath);
    if (!avatar) {
        throw new ApiError(400, 'Avatar image is required');
    }
    let coverImageLocalFilePath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage[0].length
    ) {
        coverImageLocalFilePath = req.files.coverImage[0].path;
    }
    const coverImage = await cloudinaryUploader(coverImageLocalFilePath);
    const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        password,
    });
    const createUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );
    if (!createUser) {
        throw new ApiError(500, 'Something went wrong while registering user');
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, createUser, 'User is registered successfully!')
        );
});

const logInUser = asyncHandler(async (req, res) => {
    /*
    What we need to do to login user
    1. get data from frontend or response
    2. find if user exist inside database using username or email
    3. then comparing password if password is same as saved in database or not
    4. generate access and refresh tokens and send it as cokkie to user
    5. send status and response
    */
    //    console.log(req.body)
    const { username, email, password } = req.body;
    // if (!username && !email) {
    //     throw new ApiError(400, 'username or email required');
    // }
    if (!(username || email)) {
        throw new ApiError(400, 'username or email required');
    }
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (!user) {
        throw new ApiError(400, "User doesn't exist");
    }
    const isPassword = await user.isPasswordCorrect(password);
    if (!isPassword) {
        throw new ApiError(400, 'Invalid Password');
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );
    const logInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie('AccessToken', accessToken, options)
        .cookie('RefreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: logInUser, accessToken, refreshToken },
                'user loggedIn successfully'
            )
        );
});

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: '',
            },
        },
        {
            new: true,
        }
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie('RefreshToken', options)
        .clearCookie('AccessToken', options)
        .json(new ApiResponse(200, {}, 'User logout successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingAccessToken =
        req.cookies?.RefreshToken || req.body?.refreshToken;
    if (!incomingAccessToken) {
        throw new ApiError(400, 'Invalid Access Token');
    }
    const decodedUser = jwt.verify(
        incomingAccessToken,
        process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedUser?._id);
    if (!user) {
        throw new ApiError(400, 'Unauthorized User');
    }
    // console.log(user?.refreshToken)
    // console.log(incomingAccessToken)
    if (incomingAccessToken !== user?.refreshToken) {
        throw new ApiError(400, 'Access token is invalid or expired');
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        decodedUser?._id
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie('AccessToken', accessToken, options)
        .cookie('RefreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                'Accesstoken refreshed successfully'
            )
        );
});

const changeAndUpdatePassword = asyncHandler(async (req, res) => {
    /*  
    How we gonna do this?
    1. taking field from frontend
    2. checking if confirmPassword is same as new password
    3. check if user is auntheticate or not using auth middleware, how this will help if we get req.body._id that means user is loggedin cause it have access token
    4. by this we will get req.body._id
    5. then get the user data from database and change the value and save don't use find and update as we can't able to call the pre hooks without save() method
    6. and send response
    */

    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword) {
        throw new ApiError(400, 'Please enter your oldPassword');
    }
    const user = await User.findById(req.user?._id);
    const isOldPasswordCorrect = user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordCorrect) {
        throw new ApiError(400, 'Old password is incorrect');
    }
    if (!passwordValidation(newPassword)) {
        throw new ApiError(
            400,
            'Password must contain atleast 8 character,one Uppercase letter,one Lowercase letter,one special character, and one number'
        );
    }
    if (newPassword !== confirmPassword) {
        throw new ApiError(
            400,
            'confirm password must be same as new password'
        );
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const changeUserAccountDetails = asyncHandler(async (req, res) => {
    /*
    Steps to do this,
    1. first get all the required field from frontend
    2. check if any field is empty or not 
    3. check if email is right or not
    4. update the required field
    5. send response
    */
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, 'All fields are required');
    }
    if (!emailValidation(email)) {
        throw new ApiError(400, 'Email format is wrong');
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        {
            new: true,
        }
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                'Fullname and Email changed successfully'
            )
        );
});

const changeUserProfileAvatar = asyncHandler(async (req, res) => {
    /*
    Todo:-
    1. get the avatar from frontend
    2. check if avatar url or localpath is there or not
    3. upload on cludinary and delete the old one
    4. and save the url given by cludinary into database
    5. send response
    */

    const avatarLocalFilePath = req.file?.avatar[0].path;
    if (!avatarLocalFilePath) {
        throw new ApiError(400, 'Avatar is not uploaded');
    }
    const avatar = await cloudinaryUploader(avatarLocalFilePath);
    if (!avatar) {
        throw new ApiError(400, 'Failed to upload on cloudinary');
    }
    const user = await User.findById(req.user?._id);
    const cloudinaryOldUrl = user.avatar;
    const avatarPublic_id = urlEncoder(cloudinaryOldUrl);
    const result = await deleteImageFromCloudinary(avatarPublic_id);
    if (!result) {
        throw new ApiError(400, 'Failed to delete old avatar from cloudinary');
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar?.url,
            },
        },
        {
            new: true,
        }
    ).select('-password -refreshToken');
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, 'Avatar changed successfully'));
});

const changeUserProfileCoverImage = asyncHandler(async (req, res) => {
    /*
    Todo:-
    1. get the avatar from frontend
    2. check if avatar url or localpath is there or not
    3. upload on cludinary and delete the old one
    4. and save the url given by cludinary into database
    5. send response
    */

    if (!(
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage[0].length
    )) {
    }
    const coverImageLocalFilePath = req.file?.coverImage[0].path;
    // if (!coverImageLocalFilePath) {
    //     throw new ApiError(400, 'Cover Image is not uploaded');
    // }
    const coverImage = await cloudinaryUploader(coverImageLocalFilePath);
    const user = await User.findById(req.user?._id);
    const cloudinaryOldUrl = user.coverImage;
    if (cloudinaryOldUrl) {
        const coverImagePublic_id = urlEncoder(cloudinaryOldUrl);
        const result = await deleteImageFromCloudinary(coverImagePublic_id);
        if (!result) {
            throw new ApiError(
                400,
                'Failed to delete old cover image from cloudinary'
            );
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage?.url || '',
            },
        },
        {
            new: true,
        }
    ).select('-password -refreshToken');
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                'Cover image changed successfully'
            )
        );
});

export {
    registerUser,
    logInUser,
    logOutUser,
    refreshAccessToken,
    changeAndUpdatePassword,
    changeUserAccountDetails,
    changeUserProfileAvatar,
    changeUserProfileCoverImage,
};
