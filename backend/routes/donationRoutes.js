const express = require('express');
const router = express.Router();
const {
  getDonations,
  getDonationById,
  createDonation,
} = require('../controllers/donationController');

router.route('/')
  .get(getDonations)
  .post(createDonation);

router.route('/:id')
  .get(getDonationById);

module.exports = router;
