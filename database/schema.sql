DROP TABLE IF EXISTS results CASCADE;
CREATE TABLE results (
	task TEXT,								-- which task was undertaken
	participant TEXT,						-- a unique identifier for the participant
	runtime TEXT,							-- the runtime of the task
	created_at TIMESTAMP WITH TIME ZONE,	-- when the task was completed
	updated_at TIMESTAMP WITH TIME ZONE,	-- when the task record was updated
	mode TEXT,								-- the task information, what mode it's in
	agent TEXT,								-- the user agent of the user performing the task
	robot_count INTEGER						-- the number of roboots involved in the task.
);
