import { v2 as cloudinary } from 'cloudinary';
import { response } from 'express';
import path from 'path';
import fs from "fs";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null ;
        //upload file on cloudinary
        const uploadResult = await cloudinary.uploader
       .upload(
           localFilePath, {
               resource_type : 'auto'
           }
       )
       console.log("Received localFilePath:", localFilePath);
       console.log("Resolved absolute path:", path.resolve(localFilePath));

       // File has been uploaded successfully
    //    console.log("File has been uploaded on cloudinary",uploadResult.url);
         if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
       return {
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url
        };
    } catch (error) {
        console.error(" Cloudinary upload failed:", error.message);
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload option get failed
        return null;
    }
    
}

const deleteFromCloudinary = async (url) => {
  if (typeof url !== 'string') {
    console.error("Invalid URL:", url);
    return;
  }

  const publicId = url.split('/').pop().split('.')[0];
  return await cloudinary.uploader.destroy(publicId);
};



export {uploadOnCloudinary,deleteFromCloudinary}