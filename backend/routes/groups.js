const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
// const auth = require('../middleware/auth'); //add aftr loginn is ready

// Temporary middleware until login is ready
const tempAuth = (req, res, next) => {
    req.user = { id: 'temp_user_id', name: 'Temp User' };
    next();
};

// Routes
router.post('/', tempAuth, groupController.createGroup); // Create group
router.get('/public', groupController.getPublicGroups); // Get public groups
router.get('/:id', groupController.getGroupById); // Get specific group
router.put('/:id', tempAuth, groupController.updateGroup); // Update group

module.exports = router;