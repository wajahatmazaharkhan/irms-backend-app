import express  from'express';
const router = express.Router();
import {
    assignInternToHR,
    getInternsByHR,
    checkInternAssignment,
    batchCheckInternAssignments,
    getInternsTaskCompletions,
}  from '../Controllers/HrInternAssociation.js';

import { ensureAuthenticated } from '../Middlewares/Auth.js';

// Route to assign an intern to an HR
router.post('/assign-intern', assignInternToHR);

// Route to get interns by HR ID
router.get('/hr/interns/:hrId', getInternsByHR);

// Route to check if a single intern is assigned
router.get('/intern/assigned/:internId', checkInternAssignment);

// Route to batch check interns for assignment
router.post('/interns/assigned', batchCheckInternAssignments);

router.get('/interns/getTask',ensureAuthenticated,getInternsTaskCompletions)
export default  router;
