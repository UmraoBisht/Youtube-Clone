import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { transporter } from "../utils/sendMail.js";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log(user);
    // generate access token and refresh token

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "failed to generate acccess and refresh token!");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validartion - not empty
  // check if user already exists :username ,email
  // check for images and avatar
  // upload them to cloudinary
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check user creation
  // return res

  const { userName, firstName, lastName, email, password } = req.body;
  console.log(userName, firstName, lastName, email, password);

  if (
    [userName, firstName, lastName, email, password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with email or userName already exists");
  }

  if (!req.files?.avatar[0]) {
    throw new ApiError(400, "No avatar image provided");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log(avatarLocalPath);

  let coverImageLocalPath;
  if (req.files?.coverImage?.length > 0) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log(avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
    email: email.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(400, "Could not create User!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user exists :username,email
  // check password
  // access token and generate token
  // send secure cookie
  // return res

  const { email, userName, password } = req.body;
  console.log(email, userName);

  if (!(userName || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log(isPasswordValid);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // remove secure cookies
  // return res
  await User.updateOne({ _id: req.user._id }, { refreshToken: "" });
  return res
    .clearCookie("accessToken", { secure: true })
    .clearCookie("refreshToken", { secure: true })
    .status(200)
    .json(new ApiResponse(200, null, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get user details from frontend

  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token. Please login again.");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) {
      throw new ApiError(401, "Invalid refresh token. Please login again.");
    }
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "User not found. Please login again.");
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Token Expired! please login again.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access Token Refreshed successfully!"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid refresh token. Please login again."
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if password is correct
  // update password
  // return res

  const { currentPassword, newPassword } = req.body;
  if (!(currentPassword || newPassword)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid current password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // return res
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // update user details
  // return res

  const { userName, firstName, lastName, email } = req.body;
  if (!(userName || firstName || lastName || email)) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      userName: userName.toLowerCase(),
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      email: email.toLowerCase(),
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // upload avatar to cloudinary
  // update user avatar
  // return res
  console.log(req.file);
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.secure_url) {
    throw new ApiError(400, "Avatar upload failed");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { avatar: avatar.secure_url },
    { new: true }
  ).select("-password -refreshToken");

  console.log(user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.secure_url) {
    throw new ApiError(400, "Cover Image upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      coverImage: coverImage.secure_url,
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // send password reset link to user email
  // return res

  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const mailOptions = {
    from: "rod.johns@ethereal.email", // sender address
    to: user.email, // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(info.messageId);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset link sent successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing!");
  }
  const channel = await User.aggregate([
    {
      $match: {
        //returns an array
        userName: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        //return an array
        from: "Subscriptions", //using collections created by database
        localField: "_id",
        foreginFeild: "subscriber", //from Subscriber model
        as: "subscribers", //name as per wish (actually represets its true value )
      },
    },
    {
      $lookup: {
        from: "Subscriptions",
        localField: "_id",
        foreginFeild: "subscriber", //from Subscriber model
        as: "subscribedTo", //name as per wish (actually represents its true value )
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          // $in: [req.user?._id, "$subscribers"],
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, //TODO: need to check how it works
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        userName: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        subscriptions: 0,
        subscribedTo: 0,
      },
    },
  ]);
  console.log(channel);
  if (!channel?.length) {
    throw new ApiError(400, "Channel Does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully!")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate(
    {
      $match: {
        _id: new mongoose.Types.ObjectId.createFromBase64(req.user._id),
      },
    },
    {
      $lookup: {
        from: "Videos",
        localField: "watchHistory",
        foreginFeild: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "Users",
              localField: "owner",
              foreginFeild: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    userName: 1,
                    firstName: 1,
                    lastName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.watchHistory,
        "Watch History Successfully Fetched!"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  resetPassword,
  getUserChannelProfile,
  getWatchHistory,
};
