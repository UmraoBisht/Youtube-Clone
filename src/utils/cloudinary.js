import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    // upload file on cloudianry
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file uploaded successfully
    console.log("File is Uploaded on Cloudinary Successfully", response.url);
    return response;
  } catch (error) {
    return null;
  } finally {
    fs.unlinkSync(localFilePath); //remove locally saved temp file as upload opration got failed
  }
};

export { uploadOnCloudinary };
