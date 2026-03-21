import jwt from "jsonwebtoken";
import { v4 as uuid } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';


const getBase64 = (file) => 
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

 const sendToken = (res, user, code, message) => {
    const token = jwt.sign({
        id: user._id,
    }, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })

    // .cookie("chatApp-token", token, cookieOption)
    return res.status(code)
        .json({
            success: true,
            message,
            user,
            token
        })
}

export const uploadFilesToCloudinary = async (files = []) => {
    const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            // console.log("uploading file to cloudinary", getBase64(file));
            cloudinary.uploader.upload(getBase64(file), {
                resource_type: "auto",
                public_id: uuid(),
                folder: "Sathi_Barber_Shop",
            }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
        })
    })

    try {
        const result = await Promise.all(uploadPromises)

        const formattedResults = result.map((result) => ({
            url: result.secure_url,
            public_id: result.public_id
        }))
        return formattedResults;
    } catch (error) {
        console.log(error)
        throw new Error("Error uploading files to cloudinary", error);
    }

}

export const deleteFilesFromCloudinary = async (public_id) => {

    if(public_id.length > 0){
        try {
            for (let i = 0; i < public_id.length; i++) {
                await cloudinary.uploader.destroy(public_id);
            }
        } catch (error) {
            console.log(error)
            throw new Error("Error Deleting files to cloudinary", error);
        }
    }
    return []
}

export default sendToken;