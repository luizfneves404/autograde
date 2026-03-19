import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { type ChangeEvent, useRef } from "react";
import sampleCsvUrl from "@/assets/HORARIO_DAS_DISCIPLINAS_18032026.csv?url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { getCourseList } from "@/stores/selectors";

function RootLayout() {
	const importJsonText = useAppStore((state) => state.importJsonText);
	const importCsvFile = useAppStore((state) => state.importCsvFile);
	const exportAppData = useAppStore((state) => state.exportAppData);
	const generateGrades = useAppStore((state) => state.generateGrades);
	const courses = useAppStore((state) => state.courses);
	const grades = useAppStore((state) => state.grades);
	const constraintCount = useAppStore(
		(state) => state.preferenceSet.hardConstraints.length,
	);
	const jsonInputRef = useRef<HTMLInputElement | null>(null);
	const csvInputRef = useRef<HTMLInputElement | null>(null);

	const handleImport = async (
		event: ChangeEvent<HTMLInputElement>,
		handler: (file: File) => Promise<void> | void,
		successMessage: string,
	) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		try {
			await handler(file);
			window.alert(successMessage);
		} catch (error) {
			window.alert(
				error instanceof Error ? error.message : "Falha ao importar arquivo.",
			);
		} finally {
			event.target.value = "";
		}
	};

	const handleImportBundledCsv = async () => {
		try {
			const response = await fetch(sampleCsvUrl);
			if (!response.ok) {
				throw new Error("Falha ao carregar o CSV oficial.");
			}

			await importCsvFile(await response.blob());
			window.alert("CSV oficial importado com sucesso.");
		} catch (error) {
			window.alert(
				error instanceof Error ? error.message : "Falha ao importar arquivo.",
			);
		}
	};

	const handleExport = () => {
		const blob = new Blob([exportAppData()], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `autograde_data_${new Date().toISOString()}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleGenerateGrades = () => {
		try {
			generateGrades();
			window.alert("Grades geradas com sucesso.");
		} catch (error) {
			window.alert(
				error instanceof Error ? error.message : "Falha ao gerar grades.",
			);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-card">
				<div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
						<div className="space-y-2">
							<h1 className="text-2xl font-semibold">AutoGrade</h1>
							<p className="text-sm text-muted-foreground">
								Seu assistente inteligente para otimizacao de grades horarias
							</p>
							<div className="flex flex-wrap gap-2">
								<Badge variant="secondary">
									{`${getCourseList(courses).length.toString()} disciplinas`}
								</Badge>
								<Badge variant="secondary">
									{`${constraintCount.toString()} restricoes`}
								</Badge>
								<Badge variant="secondary">
									{`${grades.length.toString()} grades`}
								</Badge>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<input
								ref={jsonInputRef}
								type="file"
								accept=".json,application/json"
								className="hidden"
								onChange={(event) =>
									handleImport(
										event,
										async (file) => {
											importJsonText(await file.text());
										},
										"JSON importado com sucesso.",
									)
								}
							/>
							<input
								ref={csvInputRef}
								type="file"
								accept=".csv,text/csv"
								className="hidden"
								onChange={(event) =>
									handleImport(
										event,
										importCsvFile,
										"CSV importado com sucesso.",
									)
								}
							/>
							<Button
								variant="outline"
								onClick={() => jsonInputRef.current?.click()}
							>
								Importar JSON
							</Button>
							<Button
								variant="outline"
								onClick={() => csvInputRef.current?.click()}
							>
								Importar CSV do meu computador
							</Button>
							<Button variant="outline" onClick={handleImportBundledCsv}>
								Importar CSV oficial
							</Button>
							<Button variant="outline" onClick={handleExport}>
								Exportar
							</Button>
							<Button onClick={handleGenerateGrades}>Gerar grades</Button>
						</div>
					</div>
					<nav className="flex flex-wrap items-center gap-2 text-sm">
						<Link
							to="/courses"
							search={{ page: 1, query: "" }}
							className="rounded-md px-3 py-2"
							activeProps={{
								className: "bg-primary text-primary-foreground",
							}}
						>
							Disciplinas
						</Link>
						<Link
							to="/grades"
							className="rounded-md px-3 py-2"
							activeProps={{
								className: "bg-primary text-primary-foreground",
							}}
						>
							Grades
						</Link>
						<Link
							to="/preferences"
							className="rounded-md px-3 py-2"
							activeProps={{
								className: "bg-primary text-primary-foreground",
							}}
						>
							Preferencias
						</Link>
						<Link
							to="/manual"
							className="rounded-md px-3 py-2"
							activeProps={{
								className: "bg-primary text-primary-foreground",
							}}
						>
							Grade Manual
						</Link>
					</nav>
				</div>
			</header>
			<main className="mx-auto max-w-7xl px-6 py-8">
				<Outlet />
			</main>
		</div>
	);
}

export const Route = createRootRoute({
	component: RootLayout,
});
