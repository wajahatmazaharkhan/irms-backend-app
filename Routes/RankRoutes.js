import express from 'express';
import {getInternRankings} from '../Controllers/RankController.js';
const RankRouter = express.Router();

// Get all rankings
RankRouter.get("/intern-rankings",getInternRankings);

export default RankRouter;
