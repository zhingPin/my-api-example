import mongoose, {
    Schema,
    type Document,
    type Model,
    type Query,
    HydratedDocument
} from "mongoose";
import slugify from "slugify";
import validator from "validator";

// ----- INTERFACE -----
export interface IMedia extends Document {
    name: string;
    slug?: string;
    ratingAverage: number;
    ratingQuantity: number;
    rating: number;
    description?: string;
    price: number;
    discount?: number;
    coverImage?: string;
    backGroundImage?: string;
    mediaType: "jpg" | "png" | "mp4" | "mp3";
    // media: string;
    media: {
        url: string;
        type: "image" | "video" | "audio";
    }
    createdAt: Date;
    secretNft: boolean;
    tags?: string[];
    category: string;
    creator: string;
    maxgroupSize?: number;
    startDates?: Date[];
    duration?: number;
}

// ----- SCHEMA -----
const mediaSchema = new Schema<IMedia>(
    {
        name: {
            type: String,
            required: [true, "Media must have a name"],
            unique: true,
            trim: true,
            minlength: [6, "Name must be at least 6 characters"],
            maxlength: [40, "Name must be less than 40 characters"],
            // validate: {
            //     validator: (val: string) =>
            //         validator.isAlphanumeric(val, "en-US", { ignore: " " }),
            //     message: "Name must only contain letters and numbers",
            // },
        },
        slug: String,
        ratingAverage: {
            type: Number,
            default: 4.5,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating must be at most 5"],
        },
        ratingQuantity: { type: Number, default: 0 },
        rating: {
            type: Number,
            default: 2.5,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating must be at most 5"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, "Description must be less than 200 characters"],
            minlength: [10, "Description must be more than 10 characters"],
        },
        price: {
            type: Number,
            required: [true, "Media must have a price"],
            min: [1, "Price must be at least 1"],
        },
        discount: {
            type: Number,
            validate: {
                validator: function (this: IMedia, val: number) {
                    return val < this.price;
                },
                message: "Discount of ({VALUE}) should be lower than the price",
            },
        },
        coverImage: String,
        backGroundImage: String,
        mediaType: {
            type: String,
            enum: {
                values: ["jpg", "png", "mp4", "mp3"],
                message:
                    "Incorrect media format — accepted formats: jpg, png, mp4, or mp3",
            },
            required: true,
        },
        // media: {
        //     type: String,
        //     required: [true, "Media must have an image/video/audio"],
        // },
        media: {
            url: String,
            type: {
                type: String,
                enum: {
                    values: ["image", "video", "audio"],
                    message: "Media type must be image, video, or audio",
                },
                required: [true, "Media type is required"],
            },
        },
        createdAt: { type: Date, default: Date.now },
        secretNft: { type: Boolean, default: false },
        tags: [String],
        category: {
            type: String,
            required: [true, "Media must have a category"],
        },
        creator: {
            type: String,
            required: [true, "Media must have a creator"],
        },
        maxgroupSize: Number,
        startDates: [Date],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ----- VIRTUAL -----
mediaSchema.virtual("ratingAverage-virtuals").get(function (this: IMedia) {
    return this.ratingAverage / 7;
});

// ----- DOCUMENT MIDDLEWARE -----
mediaSchema.pre<HydratedDocument<IMedia>>("save", function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// mediaSchema.pre<HydratedDocument<IMedia>>("save", function (next) {
//     console.log("Media will now save in DB...");
//     next();
// });

mediaSchema.post<HydratedDocument<IMedia>>("save", function (doc, next) {
    console.log("Media saved successfully:", doc);
    next();
});

// ----- QUERY MIDDLEWARE -----
mediaSchema.pre<Query<IMedia[], IMedia>>(/^find/, function (next) {
    this.find({ secretNft: { $ne: true } });
    (this as Query<IMedia[], IMedia> & { start?: number }).start = Date.now();
    next();
});

mediaSchema.post<Query<IMedia[], IMedia>>(/^find/, function (doc, next) {
    // console.log("DB query results:", doc);
    const startTime = (this as Query<IMedia[], IMedia> & { start?: number })
        .start;
    if (startTime) {
        console.log(`DB query took: ${Date.now() - startTime} ms`);
    }
    next();
});

// ----- AGGREGATE MIDDLEWARE -----
mediaSchema.pre("aggregate", function (next) {
    this.pipeline().unshift({ $match: { secretNft: { $ne: true } } });
    next();
});

// ----- MODEL -----
export const MediaModel: Model<IMedia> = mongoose.model<IMedia>(
    "Media",
    mediaSchema
);
