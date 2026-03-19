import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DAYS } from "@/constants";
import { useAppForm } from "@/features/forms/use-app-form";
import {
	buildConstraint,
	type ConstraintFormValues,
	constraintOptions,
	validateConstraintValues,
} from "@/features/preferences/constraint-templates";
import { useAppStore } from "@/stores/app-store";
import {
	getAvailableCourseCodes,
	getAvailableDestCodes,
	getAvailableProfessors,
} from "@/stores/selectors";
import { ExprNodeSchema } from "@/types";
import { getDestCodeName } from "@/utils/destCodes";

const destinationCodesSchema = z.object({
	userDestCodes: z.array(z.string()).min(1, "Selecione pelo menos um codigo."),
});

const addConstraintSchema = z.object({
	type: z.string(),
	courses: z.array(z.string()),
	professors: z.array(z.string()),
	days: z.array(z.string()),
	max: z.number(),
	min: z.number(),
});

const constraintEditorSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome."),
	description: z.string().trim().min(1, "Informe a descricao."),
	enabled: z.boolean(),
	expressionJson: z.string().trim().min(1, "Informe a expressao."),
});

function DestinationCodesForm({
	availableDestCodes,
	initialCodes,
	onSubmit,
}: {
	availableDestCodes: string[];
	initialCodes: string[];
	onSubmit: (codes: string[]) => void;
}) {
	const form = useAppForm({
		defaultValues: {
			userDestCodes: initialCodes,
		},
		validators: {
			onChange: destinationCodesSchema,
		},
		onSubmit: ({ value }) => onSubmit(value.userDestCodes),
	});

	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.AppField name="userDestCodes">
				{(field) => (
					<field.CheckboxGroupField
						label="Codigos de destino"
						description="Selecione os codigos de destino aceitos pelo otimizador."
						options={availableDestCodes.map((code) => ({
							label: getDestCodeName(code),
							value: code,
							description: code,
						}))}
					/>
				)}
			</form.AppField>
			<form.AppForm>
				<form.SubmitButton>Salvar codigos</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

function AddConstraintForm({
	availableCourseCodes,
	availableProfessors,
	onSubmit,
}: {
	availableCourseCodes: string[];
	availableProfessors: string[];
	onSubmit: (values: ConstraintFormValues) => void;
}) {
	const [selectedType, setSelectedType] =
		useState<ConstraintFormValues["type"]>("");
	const form = useAppForm({
		defaultValues: {
			type: "",
			courses: [] as string[],
			professors: [] as string[],
			days: [] as string[],
			max: 0,
			min: 0,
		},
		validators: {
			onChange: addConstraintSchema,
		},
		onSubmit: ({ value, formApi }) => {
			const error = validateConstraintValues(value as ConstraintFormValues);
			if (error) {
				window.alert(error);
				return;
			}

			onSubmit(value as ConstraintFormValues);
			formApi.reset();
			setSelectedType("");
		},
	});

	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.AppField name="type">
				{(field) => (
					<field.SelectField
						label="Tipo de restricao"
						placeholder="Selecione uma restricao"
						options={constraintOptions}
						onValueChange={(value) =>
							setSelectedType(value as ConstraintFormValues["type"])
						}
					/>
				)}
			</form.AppField>
			{selectedType === "AVAILABLE_COURSES" ||
			selectedType === "MINIMUM_COURSES" ||
			selectedType === "FORBID_COURSE_COMBO" ||
			selectedType === "FORBID_EACH_COURSE" ? (
				<form.AppField name="courses">
					{(field) => (
						<field.CheckboxGroupField
							label="Disciplinas"
							options={availableCourseCodes.map((courseCode) => ({
								label: courseCode,
								value: courseCode,
							}))}
						/>
					)}
				</form.AppField>
			) : null}
			{selectedType === "ONLY_PROFESSORS" ? (
				<form.AppField name="professors">
					{(field) => (
						<field.CheckboxGroupField
							label="Professores"
							options={availableProfessors.map((professor) => ({
								label: professor,
								value: professor,
							}))}
						/>
					)}
				</form.AppField>
			) : null}
			{selectedType === "FORBID_DAYS" ? (
				<form.AppField name="days">
					{(field) => (
						<field.CheckboxGroupField
							label="Dias proibidos"
							options={DAYS.map((day) => ({
								label: day,
								value: day,
							}))}
						/>
					)}
				</form.AppField>
			) : null}
			{selectedType === "MAX_CREDIT_LOAD" ? (
				<form.AppField name="max">
					{(field) => <field.NumberField label="Carga maxima" min={1} />}
				</form.AppField>
			) : null}
			{selectedType === "MIN_CREDIT_LOAD" ? (
				<form.AppField name="min">
					{(field) => <field.NumberField label="Carga minima" min={1} />}
				</form.AppField>
			) : null}
			<form.AppForm>
				<form.SubmitButton>Adicionar restricao</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

function ConstraintEditorCard({
	constraintId,
	initialName,
	initialDescription,
	initialEnabled,
	initialExpressionJson,
	onDelete,
	onSubmit,
}: {
	constraintId: string;
	initialName: string;
	initialDescription: string;
	initialEnabled: boolean;
	initialExpressionJson: string;
	onDelete: () => void;
	onSubmit: (payload: {
		name: string;
		description: string;
		enabled: boolean;
		expressionJson: string;
	}) => void;
}) {
	const form = useAppForm({
		defaultValues: {
			name: initialName,
			description: initialDescription,
			enabled: initialEnabled,
			expressionJson: initialExpressionJson,
		},
		validators: {
			onChange: constraintEditorSchema,
		},
		onSubmit: ({ value }) => {
			const parsed = JSON.parse(value.expressionJson);
			const expression = ExprNodeSchema.safeParse(parsed);

			if (!expression.success) {
				window.alert("A expressao JSON nao representa uma restricao valida.");
				return;
			}

			onSubmit(value);
		},
	});

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<CardTitle>{initialName}</CardTitle>
							<Badge variant={initialEnabled ? "default" : "secondary"}>
								{initialEnabled ? "Ativa" : "Inativa"}
							</Badge>
						</div>
						<CardDescription>{constraintId}</CardDescription>
					</div>
					<Button variant="destructive" onClick={onDelete}>
						Remover
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<div className="grid gap-4 md:grid-cols-2">
						<form.AppField name="name">
							{(field) => <field.TextField label="Nome" />}
						</form.AppField>
						<form.AppField name="enabled">
							{(field) => (
								<field.CheckboxField
									label="Ativar restricao"
									placeholder="A restricao participa da geracao."
								/>
							)}
						</form.AppField>
					</div>
					<form.AppField name="description">
						{(field) => <field.TextareaField label="Descricao" rows={2} />}
					</form.AppField>
					<form.AppField name="expressionJson">
						{(field) => (
							<field.TextareaField
								label="Expressao JSON"
								description="Ajuste fino da restricao quando precisar editar a expressao diretamente."
								rows={10}
							/>
						)}
					</form.AppField>
					<form.AppForm>
						<form.SubmitButton>Salvar restricao</form.SubmitButton>
					</form.AppForm>
				</form>
			</CardContent>
		</Card>
	);
}

export function PreferencesPage() {
	const courses = useAppStore((state) => state.courses);
	const preferenceSet = useAppStore((state) => state.preferenceSet);
	const setUserDestCodes = useAppStore((state) => state.setUserDestCodes);
	const upsertConstraint = useAppStore((state) => state.upsertConstraint);
	const deleteConstraint = useAppStore((state) => state.deleteConstraint);

	const availableCourseCodes = getAvailableCourseCodes(courses);
	const availableProfessors = getAvailableProfessors(courses);
	const availableDestCodes = getAvailableDestCodes(courses);
	const activeConstraintCount = preferenceSet.hardConstraints.filter(
		(constraint) => constraint.enabled,
	).length;

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="text-3xl font-semibold tracking-tight">Preferencias</h2>
				<p className="text-muted-foreground">
					Defina codigos de destino e restricoes do otimizador
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Codigos de destino</CardTitle>
					<CardDescription>
						Estes codigos filtram as ofertas consideradas validas pelo gerador.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DestinationCodesForm
						availableDestCodes={availableDestCodes}
						initialCodes={preferenceSet.userDestCodes}
						onSubmit={setUserDestCodes}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Nova restricao</CardTitle>
					<CardDescription>
						Escolha um template e preencha apenas os parametros relevantes.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AddConstraintForm
						availableCourseCodes={availableCourseCodes}
						availableProfessors={availableProfessors}
						onSubmit={(values) => {
							upsertConstraint(buildConstraint(values));
						}}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="space-y-1">
							<CardTitle>Restricoes cadastradas</CardTitle>
							<CardDescription>
								{`${preferenceSet.hardConstraints.length.toString()} restricoes cadastradas, ${activeConstraintCount.toString()} ativas.`}
							</CardDescription>
						</div>
						{preferenceSet.hardConstraints.length > 0 ? (
							<Button
								variant="destructive"
								onClick={() => {
									if (
										window.confirm("Remover todas as restricoes cadastradas?")
									) {
										for (const constraint of preferenceSet.hardConstraints) {
											deleteConstraint(constraint.id);
										}
									}
								}}
							>
								Limpar tudo
							</Button>
						) : null}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{preferenceSet.hardConstraints.length === 0 ? (
						<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
							Nenhuma restricao configurada ainda.
						</div>
					) : (
						preferenceSet.hardConstraints.map((constraint, index) => (
							<div key={constraint.id} className="space-y-4">
								<ConstraintEditorCard
									constraintId={constraint.id}
									initialName={constraint.name}
									initialDescription={constraint.description}
									initialEnabled={constraint.enabled}
									initialExpressionJson={JSON.stringify(
										constraint.expression,
										null,
										2,
									)}
									onDelete={() => deleteConstraint(constraint.id)}
									onSubmit={(value) => {
										upsertConstraint({
											...constraint,
											name: value.name,
											description: value.description,
											enabled: value.enabled,
											expression: JSON.parse(value.expressionJson),
										});
									}}
								/>
								{index < preferenceSet.hardConstraints.length - 1 ? (
									<Separator />
								) : null}
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
