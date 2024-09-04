import asyncHandler from "../utils/async-handler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log(req.body);
  
  const { username, password, email, role } = req.body;

  if ([username, password, email].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with that username or email");
  }

  const user = await User.create({
    ...req.body,
    username: username.toLowerCase(),
    role: role.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "User created",
        createdUser,
        true,
        "User created successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

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
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Unauthorized request" });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    user.refreshToken = refreshToken;
    await user.save();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Refresh token error:", error.message);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    console.error("Token verification error:", error);
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Invalid or expired token"));
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, username, division, company, zone, branch, lob } = req.body;

  if (!req.user?._id) {
    return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
  }

  if (!email) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Email is required"));
  }

  const updateFields = {
    email,
    ...(username && { username }),
    ...(division && { division }),
    ...(company && { company }),
    ...(zone && { zone }),
    ...(branch && { branch }),
    ...(lob && { lob }),
  };

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json(new ApiResponse(500, null, "Server Error"));
  }
});

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken");

    if (!users.length) {
      return res.status(404).json(new ApiResponse(404, [], "No users found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (error) {
    console.error("Error fetching users:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updatedData = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updatedData },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

const deleteUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};