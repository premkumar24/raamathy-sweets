const cloudinary = require("../config/cloudinary");

const uploadProductImage = async (req, res) => {

    try {

        console.log("Cloudinary configuration check:");
        console.log(
            "Cloud Name:",
            process.env.CLOUDINARY_CLOUD_NAME
        );
        console.log(
            "API Key exists:",
            !!process.env.CLOUDINARY_API_KEY
        );
        console.log(
            "API Secret exists:",
            !!process.env.CLOUDINARY_API_SECRET
        );

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "raamathy-sweets/products",
                resource_type: "image"
            },

            (error, result) => {

                if (error) {

                    console.error(
                        "Cloudinary upload error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Image upload failed"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Image uploaded successfully",
                    imageUrl: result.secure_url,
                    imagePublicId: result.public_id
                });
            }
        );

        uploadStream.end(req.file.buffer);

    } catch (error) {

        console.error(
            "Upload product image error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Image upload failed"
        });
    }
};

const deleteProductImage = async (req, res) => {
    try {
        const { imagePublicId } = req.body;

        if (!imagePublicId) {
            return res.status(400).json({
                success: false,
                message: "Image public ID is required"
            });
        }

        const result =
            await cloudinary.uploader.destroy(
                imagePublicId,
                {
                    resource_type: "image"
                }
            );

        if (
            result.result !== "ok" &&
            result.result !== "not found"
        ) {
            return res.status(500).json({
                success: false,
                message: "Unable to delete image"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete Cloudinary image error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete image"
        });
    }
};

module.exports = {
    uploadProductImage,
    deleteProductImage
};