import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadVideo = asyncHandler(async (req, res) => {
  //get video details from frontend
  //validation - not empty
  //upload video to cloud storage
  //save video details in database
  //return res
  const { title, description, channel } = req.body;
  console.log(title, description, channel);
  if (!title || !description || !channel) {
    throw new ApiError(400, "All fields are required!");
  }
  // upload video to cloud storage
  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!videoLocalPath) {
    throw new ApiError(404, "Video File is Missing!");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(404, "Video Thumbnail is Missing!");
  }
  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  if (!uploadedVideo?.url) {
    throw new ApiError(400, "Video upload failed");
  }
  const videoThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!videoThumbnail?.url) {
    throw new ApiError(400, "Video thumbnail upload failed");
  }

  const video = await Video({
    title,
    description,
    url: uploadedVideo.url,
    thumbnail: videoThumbnail.url,
    channel,
    owner: req.user?._id,
  });

  await video.save();
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video Successfully Uploaded!"));
});

export { uploadVideo };
