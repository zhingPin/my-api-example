import { catchAsync } from "../utils/catchAsync";
import { Request, Response, NextFunction } from "express";
import { MediaModel } from "./mediaSchema";
import APIFeatures from "../utils/apiFeatures";
import AppError from "../utils/appError";

const mediaControllers = {
    getAllMedia: catchAsync(async (req: Request, res: Response) => {
        // Apply API features for pagination, sorting, etc.
        const features = new APIFeatures(MediaModel.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const media = await features.query;

        res.status(200).json({
            status: "success",
            total: media.length,
            message: "All media fetched successfully",
            data: media
        });
    }),
    getMedia: catchAsync(async (req: Request, res: Response) => {
        const mediaId = req.params.id;
        const media = await MediaModel.findById(mediaId);
        if (!media) {
            return res.status(404).json({ message: "Media not found" });
        }
        res.status(200).json({
            status: "success",
            message: "Media fetched successfully",
            data: media
        });
    }),
    uploadMedia: catchAsync(async (req: Request, res: Response) => {

        const media = req.body;
        const newMedia = await MediaModel.create(media);
        // Handle media upload
        res.status(200).json({
            status: "success",
            message: "Media uploaded successfully",
            data: newMedia
        });

    }),
    // Update media by ID
    updateMedia: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const mediaId = req.params.id;
        const updatedMedia = await MediaModel.findByIdAndUpdate(mediaId, req.body, { new: true });
        if (!updatedMedia) {
            return next(new AppError("Media not found", 404));
        }
        res.status(200).json({
            status: "success",
            message: "Media updated successfully",
            data: updatedMedia
        });
    }),
    // Delete media by ID
    deleteMedia: catchAsync(async (req: Request, res: Response) => {
        const mediaId = req.params.id;
        const media = await MediaModel.findById(mediaId);
        if (!media) {
            return res.status(404).json({ message: "Media not found" });
        }
        await MediaModel.findByIdAndDelete(mediaId);
        res.status(200).json({
            status: "success",
            message: "Media deleted successfully",

            data: {
                mediaId,
                media: media
            }
        });
    }),

    //AGGREGATION PIPELINE
    getMediaStats: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const groupByField = req.query.groupBy || "mediaType";
        const sortField = req.query.sort || "avgRating";

        // Construct the aggregation pipeline
        const stats = await MediaModel.aggregate([
            {
                $match: { rating: { $gte: 3.3 } }, // Match stage to filter documents with rating >= 0
            },
            {
                $group: {
                    _id: { $toUpper: `$${groupByField}` }, // Group by the specified field, converted to uppercase
                    numNFTs: { $sum: 1 }, // Count the number of NFTs
                    avgRating: { $avg: "$ratingAverage" }, // Calculate the average rating
                    numOfRatings: { $sum: "$rating" }, // Sum the ratings
                    avgPrice: { $avg: "$price" }, // Calculate the average price
                    minPrice: { $min: "$price" }, // Find the minimum price
                    maxPrice: { $max: "$price" }, // Find the maximum price
                },
            },
            {
                $sort: { sortField: -1 }, // Sort by average rating in descending order
            },
            // Exclude specific documents
            {
                $match: {
                    _id: { $nin: ["HARMONY BEATS", "ALICE WONDERLAND"] }, // Exclude documents with _id "HARMONY BEATS" and "ALICE WONDERLAND"
                },
            },
        ]);

        res.status(200).json({
            status: "success",
            data: {
                stats,
            },
        });
    }),

    // APIfeatures test middleware
    getTop5Media: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        req.query.limit = "5";
        req.query.sort = "-rating";
        req.query.fields = "name,price,rating,";
        next()
    })
};

export default mediaControllers;
