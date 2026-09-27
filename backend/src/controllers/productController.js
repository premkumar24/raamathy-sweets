const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
// Get all products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get products"
        });
    }
};


// Get single product
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get product"
        });
    }
};

// Create product
const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            price,
            unit,
            imageUrl,
            imagePublicId,
            stock,
            isAvailable
        } = req.body;

        // Basic validation
        if (!name || !category || price === undefined || !unit) {
            return res.status(400).json({
                success: false,
                message: "Name, category, price and unit are required"
            });
        }

        const product = await Product.create({
            name,
            category,
            description,
            price,
            unit,
            imageUrl,
            imagePublicId,
            stock,
            isAvailable
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error("Create product error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            price,
            unit,
            imageUrl,
            imagePublicId,
            stock,
            isAvailable
        } = req.body;

        if (
            !name ||
            !category ||
            price === undefined ||
            !unit
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, category, price and unit are required"
            });
        }

        // Find the existing product first
        const existingProduct =
            await Product.findById(req.params.id);

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const oldImagePublicId =
            existingProduct.imagePublicId;

        // Update the product in MongoDB
        const product =
            await Product.findByIdAndUpdate(
                req.params.id,
                {
                    name,
                    category,
                    description,
                    price,
                    unit,
                    imageUrl,
                    imagePublicId,
                    stock,
                    isAvailable
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        // Delete old Cloudinary image
        // only when a different image was uploaded
        if (
            oldImagePublicId &&
            oldImagePublicId !== imagePublicId
        ) {
            try {
                await cloudinary.uploader.destroy(
                    oldImagePublicId
                );

                console.log(
                    "Old product image deleted:",
                    oldImagePublicId
                );

            } catch (cloudinaryError) {
                console.error(
                    "Unable to delete old Cloudinary image:",
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error(
            "Update product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update product"
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product =
            await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Delete image from Cloudinary
        if (product.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(
                    product.imagePublicId,
                    {
                        resource_type: "image"
                    }
                );
            } catch (imageError) {
                console.error(
                    "Cloudinary image deletion failed:",
                    imageError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Product image could not be deleted. Product was not removed."
                });
            }
        }

        // Delete product from MongoDB
        await Product.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete product"
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};