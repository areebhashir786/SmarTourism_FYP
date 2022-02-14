const Restaurant = require("../models/restaurantModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");

// Create Restaurant -- Admin
exports.createRestaurant = catchAsyncErrors(async (req, res, next) => {
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "restaurants",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const restaurant = await Restaurant.create(req.body);

  res.status(201).json({
    success: true,
    restaurant,
  });
});

// Get All Restaurants
exports.getAllRestaurants = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 8;
  const restaurantsCount = await Restaurant.countDocuments();

  const apiFeature = new ApiFeatures(Restaurant.find(), req.query)
    .search()
    .filter();

  let restaurants = await apiFeature.query;

  let filteredRestaurantsCount = restaurants.length;

  apiFeature.pagination(resultPerPage);

  restaurants = await apiFeature.query;

  res.status(200).json({
    success: true,
    restaurants,
    restaurantsCount,
    resultPerPage,
    filteredRestaurantsCount,
  });
});

// Get All Restaurant (Admin)
exports.getAdminRestaurants = catchAsyncErrors(async (req, res, next) => {
  const restaurants = await Restaurant.find();

  res.status(200).json({
    success: true,
    restaurants,
  });
});

// Get Restaurant Details
exports.getRestaurantDetails = catchAsyncErrors(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(new ErrorHander("Restaurant not found", 404));
  }

  res.status(200).json({
    success: true,
    restaurant,
  });
});

// Update Restaurant -- Admin

exports.updateRestaurant = catchAsyncErrors(async (req, res, next) => {
  let restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(new ErrorHander("Restaurant not found", 404));
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
    for (let i = 0; i < restaurant.images.length; i++) {
      await cloudinary.v2.uploader.destroy(restaurant.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "restaurants",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    restaurant,
  });
});

// Delete Restaurant

exports.deleteRestaurant = catchAsyncErrors(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(new ErrorHander("Restaurant not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < restaurant.images.length; i++) {
    await cloudinary.v2.uploader.destroy(restaurant.images[i].public_id);
  }

  await restaurant.remove();

  res.status(200).json({
    success: true,
    message: "Restaurant Delete Successfully",
  });
});

// Create New Review or Update the review
exports.createRestaurantReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, restaurantId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const restaurant = await Restaurant.findById(restaurantId);

  const isReviewed = restaurant.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    restaurant.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    restaurant.reviews.push(review);
    restaurant.numOfReviews = restaurant.reviews.length;
  }

  let avg = 0;

  restaurant.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  restaurant.ratings = avg / restaurant.reviews.length;

  await restaurant.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a restaurant
exports.getRestaurantReviews = catchAsyncErrors(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.query.id);

  if (!restaurant) {
    return next(new ErrorHander("Restaurant not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: restaurant.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.query.restaurantId);

  if (!restaurant) {
    return next(new ErrorHander("Restaurant not found", 404));
  }

  const reviews = restaurant.reviews.filter(
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

  await Restaurant.findByIdAndUpdate(
    req.query.restaurantId,
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
