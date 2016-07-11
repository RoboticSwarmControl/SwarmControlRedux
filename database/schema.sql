DROP TABLE IF EXISTS results CASCADE;
CREATE TABLE results (
	id SERIAL NOT NULL UNIQUE,									-- index of the result
	task TEXT NOT NULL,											-- which task was undertaken
	participant TEXT NOT NULL DEFAULT 'sql',					-- a unique identifier for the participant
	runtime TEXT NOT NULL,										-- the runtime of the task
	ending TEXT NOT NULL,										-- if the run was ended without winning
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),	-- when the task was completed
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),	-- when the task record was updated
	mode TEXT NOT NULL,											-- the task information, what mode it's in
	agent TEXT NOT NULL,										-- the user agent of the user performing the task
	robot_count INTEGER NOT NULL DEFAULT 0						-- the number of roboots involved in the task.
);
