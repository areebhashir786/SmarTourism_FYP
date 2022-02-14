const express = require("express");
const {
  getAllHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelDetails,
  createHotelReview,
  getHotelReviews,
  deleteReview,
  getAdminHotels,
} = require("../controllers/hotelController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

router.route("/hotels").get(getAllHotels);

router
  .route("/admin/hotels")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminHotels);

router
  .route("/admin/hotel/new")
  .post(isAuthenticatedUser, authorizeRoles("admin"), createHotel);

router
  .route("/admin/hotel/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateHotel)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteHotel);

router.route("/hotel/:id").get(getHotelDetails);

router.route("/hotel_review").put(isAuthenticatedUser, createHotelReview);

router
  .route("/hotel_reviews")
  .get(getHotelReviews)
  .delete(isAuthenticatedUser, deleteReview);

module.exports = router;
