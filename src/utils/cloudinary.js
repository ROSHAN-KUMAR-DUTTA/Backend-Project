import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    //   secure_distribution: 'mydomain.com',
    //   upload_prefix: 'https://api-eu.cloudinary.com'
});

const cloudinaryUploader = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error('File path is empty!!');
            return null;
        }
        const fileUpload = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        console.log('File uploaded successfully!!', fileUpload.url);
        fs.unlinkSync(localFilePath);
        return fileUpload;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export { cloudinaryUploader };

// cloudinary.v2.uploader
// .upload("dog.mp4", {
//   resource_type: "video",
//   public_id: "my_dog",
//   overwrite: true,
//   notification_url: "https://mysite.example.com/notify_endpoint"})
// .then(result=>console.log(result));
