const Group = require('../models/group');

// Create a new study group
exports.createGroup = async (req, res) => {
    try {
        const { name, course, topic, description, isPublic, meetingOptions } = req.body;
        
        // Get user ID from authentication (will be added when login is ready)
        const userId = req.user?.id || 'temp_user_id'; // Temporary until login is ready
        
        // Create new group
        const group = new Group({
            name,
            course,
            topic,
            description,
            creator: userId,
            isPublic: isPublic !== undefined ? isPublic : true,
            meetingOptions: meetingOptions || {},
            members: [userId] // Add creator as first member
        });
        
        await group.save();
        
        res.status(201).json({
            success: true,
            message: 'Study group created successfully',
            data: group
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create study group',
            error: error.message
        });
    }
};

// Get all public groups
exports.getPublicGroups = async (req, res) => {
    try {
        const groups = await Group.find({ isPublic: true, status: 'active' })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: groups
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch groups',
            error: error.message
        });
    }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('creator', 'name email')
            .populate('members', 'name email');
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: group
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch group',
            error: error.message
        });
    }
};

// Update group
exports.updateGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        
        // Check if user is creator
        const userId = req.user?.id || 'temp_user_id';
        if (group.creator.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only group creator can update this group'
            });
        }
        
        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Group updated successfully',
            data: updatedGroup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update group',
            error: error.message
        });
    }
};