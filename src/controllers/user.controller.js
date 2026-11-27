import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emailValidation } from '../utils/verifyEmail.js';
import { passwordValidation } from '../utils/verifyPassword.js';
import { User } from '../models/user.model.js';
import { cloudinaryUploader } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(400, 'Something went wrong while log in user');
    }
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
    const { username, email, password } = req.body;
    if (!username || !email) {
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
    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
        user._id
    );
    const logInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    res.status(200)
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
    const options={
        httpOnly:true,
        secure:true,
    }
    res.status(200).clearCookie('refreshToken',options).clearCookie('accessToken',options).json(new ApiResponse(200,{},"User logout successfully"))
});

export { registerUser, logInUser, logOutUser };
