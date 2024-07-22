const { check, validationResult } = require('express-validator');

const TaskUpdate =()=> [
    check('title').optional().isString().withMessage('Title should be a string'),
    check('description').optional().isString().withMessage('Description should be a string'),
    check('status').optional().isIn(['pending','completed']).withMessage('Invalid status'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
module.exports=TaskUpdate;


