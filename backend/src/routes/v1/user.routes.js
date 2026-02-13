const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, deactivateAccount } = require('../../controllers/user.controller');
const { protect } = require('../../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate.middleware');

router.use(protect);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with task count
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  '/profile',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters'),
    validate,
  ],
  updateProfile
);

/**
 * @swagger
 * /api/v1/users/profile:
 *   delete:
 *     summary: Deactivate own account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.delete('/profile', deactivateAccount);

module.exports = router;
