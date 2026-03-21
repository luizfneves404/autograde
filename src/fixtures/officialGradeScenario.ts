/** Shared scenario aligned with `gradeOptimizer` integration tests (official CSV). */
export const OFFICIAL_TARGET_COURSE_CODES = [
	"INF1721",
	"INF1027",
	"INF1041",
	"ENG4011",
	"INF1407",
	"ENG4451",
	"INF1643",
	"ENG4421",
] as const;

export const OFFICIAL_USER_DEST_CODES = ["CEG", "QQC"] as const;

export const OFFICIAL_MIN_CREDIT_LOAD = 26;

export const OFFICIAL_GRADE_COUNT_WITH_VACANCY_OVERRIDE = 80;

export const OFFICIAL_VISIBLE_GRADE_UI_LIMIT = 50;
