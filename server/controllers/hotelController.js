const Hotel = require("../models/hotelModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");

// Create Hotel -- Admin
exports.createHotel = catchAsyncErrors(async (req, res, next) => {
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "hotels",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const hotel = await Hotel.create(req.body);

  res.status(201).json({
    success: true,
    hotel,
  });
});

// Get All Hotels
exports.getAllHotels = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 8;
  const hotelsCount = await Hotel.countDocuments();

  const apiFeature = new ApiFeatures(Hotel.find(), req.query).search().filter();

  let hotels = await apiFeature.query;

  let filteredHotelsCount = hotels.length;

  apiFeature.pagination(resultPerPage);

  hotels = await apiFeature.query;

  res.status(200).json({
    success: true,
    hotels,
    hotelsCount,
    resultPerPage,
    filteredHotelsCount,
  });
});

// Get All Hotel (Admin)
exports.getAdminHotels = catchAsyncErrors(async (req, res, next) => {
  const hotels = await Hotel.find();

  res.status(200).json({
    success: true,
    hotels,
  });
});

// Get Hotel Details
exports.getHotelDetails = catchAsyncErrors(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ErrorHander("Hotel not found", 404));
  }

  res.status(200).json({
    success: true,
    hotel,
  });
});

// Update Hotel -- Admin

exports.updateHotel = catchAsyncErrors(async (req, res, next) => {
  let hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ErrorHander("Hotel not found", 404));
  }

  // Images Start Here
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting Images From Cloudinary
    for (let i = 0; i < hotel.images.length; i++) {
      await cloudinary.v2.uploader.destroy(hotel.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "hotels",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    hotel,
  });
});

// Delete Hotel

exports.deleteHotel = catchAsyncErrors(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ErrorHander("Hotel not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < hotel.images.length; i++) {
    await cloudinary.v2.uploader.destroy(hotel.images[i].public_id);
  }

  await hotel.remove();

  res.status(200).json({
    success: true,
    message: "Hotel Delete Successfully",
  });
});

// Create New Review or Update the review
exports.createHotelReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, hotelId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const hotel = await Hotel.findById(hotelId);

  const isReviewed = hotel.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    hotel.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    hotel.reviews.push(review);
    hotel.numOfReviews = hotel.reviews.length;
  }

  let avg = 0;

  hotel.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  hotel.ratings = avg / hotel.reviews.length;

  await hotel.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a hotel
exports.getHotelReviews = catchAsyncErrors(async (req, res, next) => {
  const hotel = await Hotel.findById(req.query.id);

  if (!hotel) {
    return next(new ErrorHander("Hotel not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: hotel.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const hotel = await Hotel.findById(req.query.hotelId);

  if (!hotel) {
    return next(new ErrorHander("Hotel not found", 404));
  }

  const reviews = hotel.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Hotel.findByIdAndUpdate(
    req.query.hotelId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
