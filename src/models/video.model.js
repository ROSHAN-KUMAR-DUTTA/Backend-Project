import mongoose, { Schema, model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = Schema(
    {
        videoFile: {
            type: String,
            required: true,
        },
        thumbnail: {
            tryep: String,
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        duration: {
            type: Number,
            default: 0,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model('Video', videoSchema);
