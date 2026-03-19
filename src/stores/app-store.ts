import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore, type StateCreator, type StoreApi } from "zustand/vanilla";
import type {
	AppData,
	Course,
	Grade,
	PreferenceSet,
	UIConstraint,
} from "@/types";
import { AppDataSchema } from "@/types";
import { parseCSVData } from "@/utils/csvParser";
import { generateOptimizedGrades } from "@/utils/gradeOptimizer";

const STORAGE_KEY = "autograde_data";

const defaultPreferenceSet: PreferenceSet = {
	hardConstraints: [],
	userDestCodes: [],
	ignoreLackOfVacancies: false,
};

type GenerateOptimizedGrades = typeof generateOptimizedGrades;

interface AppStoreDependencies {
	generateOptimizedGrades: GenerateOptimizedGrades;
}

interface AppStoreState {
	courses: Record<string, Course>;
	preferenceSet: PreferenceSet;
	grades: Grade[];
	manualSelectedClassIds: string[];
}

interface AppStoreActions {
	setCourses: (courses: Record<string, Course>) => void;
	upsertCourse: (course: Course) => void;
	deleteCourse: (courseCode: string) => void;
	setPreferenceSet: (preferenceSet: PreferenceSet) => void;
	upsertConstraint: (constraint: UIConstraint) => void;
	deleteConstraint: (constraintId: string) => void;
	setUserDestCodes: (userDestCodes: string[]) => void;
	setIgnoreLackOfVacancies: (ignoreLackOfVacancies: boolean) => void;
	setGrades: (grades: Grade[]) => void;
	clearGrades: () => void;
	setManualSelectedClassIds: (ids: string[]) => void;
	replaceAppData: (data: AppData) => void;
	exportAppData: () => string;
	importJsonText: (content: string) => void;
	importCsvFile: (file: Blob) => Promise<void>;
	generateGrades: () => void;
}

export type AppStore = AppStoreState & AppStoreActions;

function formatValidationErrors(error: {
	issues: Array<{ path: PropertyKey[]; message: string }>;
}): string {
	return error.issues
		.map((issue) => {
			const path = issue.path.length > 0 ? issue.path.join(".") : "root";
			return `${path}: ${issue.message}`;
		})
		.join("\n");
}

function getInitialState(initialState?: Partial<AppStoreState>): AppStoreState {
	return {
		courses: initialState?.courses ?? {},
		preferenceSet: initialState?.preferenceSet ?? defaultPreferenceSet,
		grades: initialState?.grades ?? [],
		manualSelectedClassIds: initialState?.manualSelectedClassIds ?? [],
	};
}

function createAppStoreState(
	initialState?: Partial<AppStoreState>,
	dependencies: AppStoreDependencies = {
		generateOptimizedGrades,
	},
): StateCreator<AppStore> {
	return (set, get) => ({
		...getInitialState(initialState),
		setCourses: (courses) => {
			set({ courses, grades: [] });
		},
		upsertCourse: (course) => {
			set((state) => ({
				courses: { ...state.courses, [course.code]: course },
				grades: [],
			}));
		},
		deleteCourse: (courseCode) => {
			set((state) => {
				const courses = { ...state.courses };
				delete courses[courseCode];
				return { courses, grades: [] };
			});
		},
		setPreferenceSet: (preferenceSet) => {
			set({ preferenceSet, grades: [] });
		},
		upsertConstraint: (constraint) => {
			set((state) => {
				const existing = state.preferenceSet.hardConstraints.some(
					(item) => item.id === constraint.id,
				);

				return {
					preferenceSet: {
						...state.preferenceSet,
						hardConstraints: existing
							? state.preferenceSet.hardConstraints.map((item) =>
									item.id === constraint.id ? constraint : item,
								)
							: [...state.preferenceSet.hardConstraints, constraint],
					},
					grades: [],
				};
			});
		},
		deleteConstraint: (constraintId) => {
			set((state) => ({
				preferenceSet: {
					...state.preferenceSet,
					hardConstraints: state.preferenceSet.hardConstraints.filter(
						(item) => item.id !== constraintId,
					),
				},
				grades: [],
			}));
		},
		setUserDestCodes: (userDestCodes) => {
			set((state) => ({
				preferenceSet: {
					...state.preferenceSet,
					userDestCodes,
				},
				grades: [],
			}));
		},
		setIgnoreLackOfVacancies: (ignoreLackOfVacancies) => {
			set((state) => ({
				preferenceSet: {
					...state.preferenceSet,
					ignoreLackOfVacancies,
				},
				grades: [],
			}));
		},
		setGrades: (grades) => {
			set({ grades });
		},
		clearGrades: () => {
			set({ grades: [] });
		},
		setManualSelectedClassIds: (ids) => {
			set({ manualSelectedClassIds: ids });
		},
		replaceAppData: (data) => {
			set({
				courses: data.courses,
				preferenceSet: data.preferenceSet,
				grades: [],
			});
		},
		exportAppData: () => {
			const { courses, preferenceSet } = get();
			return JSON.stringify({ courses, preferenceSet }, null, 2);
		},
		importJsonText: (content) => {
			const parsed = JSON.parse(content);
			const result = AppDataSchema.safeParse(parsed);

			if (!result.success) {
				throw new Error(formatValidationErrors(result.error));
			}

			get().replaceAppData(result.data);
		},
		importCsvFile: async (file) => {
			const parsedCourses = parseCSVData(await file.arrayBuffer());
			set((state) => ({
				courses: { ...state.courses, ...parsedCourses },
				grades: [],
			}));
		},
		generateGrades: () => {
			const { courses, preferenceSet } = get();
			const grades = dependencies.generateOptimizedGrades(
				courses,
				preferenceSet.hardConstraints
					.filter((constraint) => constraint.enabled)
					.map((constraint) => constraint.expression),
				preferenceSet.userDestCodes,
				preferenceSet.ignoreLackOfVacancies,
				() => undefined,
			);
			set({ grades });
		},
	});
}

export function createPlainAppStore(
	initialState?: Partial<AppStoreState>,
	dependencies?: Partial<AppStoreDependencies>,
): StoreApi<AppStore> {
	return createStore<AppStore>()(
		createAppStoreState(initialState, {
			generateOptimizedGrades:
				dependencies?.generateOptimizedGrades ?? generateOptimizedGrades,
		}),
	);
}

export const appStore = createStore<AppStore>()(
	persist(createAppStoreState(), {
		name: STORAGE_KEY,
		partialize: (state) => ({
			courses: state.courses,
			preferenceSet: state.preferenceSet,
			manualSelectedClassIds: state.manualSelectedClassIds,
		}),
	}),
);

export function useAppStore<T>(selector: (state: AppStore) => T): T {
	return useStore(appStore, selector);
}
