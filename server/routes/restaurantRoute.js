const express = require("express");
const {
  getAllRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantDetails,
  createRestaurantReview,
  getRestaurantReviews,
  deleteReview,
  getAdminRestaurants,
} = require("../controllers/restaurantController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

router.route("/restaurants").get(getAllRestaurants);

router
  .route("/admin/restaurants")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminRestaurants);

router
  .route("/admin/restaurant/new")
  .post(isAuthenticatedUser, authorizeRoles("admin"), createRestaurant);

router
  .route("/admin/restaurant/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateRestaurant)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteRestaurant);

router.route("/restaurant/:id").get(getRestaurantDetails);

router
  .route("/restaurant_review")
  .put(isAuthenticatedUser, createRestaurantReview);

router
  .route("/restaurant_reviews")
  .get(getRestaurantReviews)
  .delete(isAuthenticatedUser, deleteReview);

module.exports = router;
