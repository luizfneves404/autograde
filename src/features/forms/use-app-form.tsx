import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

type Option = {
	label: string;
	value: string;
	description?: string;
};

function FieldShell({
	label,
	description,
	error,
	children,
	className,
}: {
	label: string;
	description?: string;
	error?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-2", className)}>
			<div className="space-y-1">
				<Label>{label}</Label>
				{description ? (
					<p className="text-xs text-muted-foreground">{description}</p>
				) : null}
			</div>
			{children}
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}

function getFieldError(errors: unknown[]): string | undefined {
	const firstError = errors[0];

	if (typeof firstError === "string") {
		return firstError;
	}

	if (firstError instanceof Error) {
		return firstError.message;
	}

	return undefined;
}

type CommonFieldProps = {
	label: string;
	description?: string;
	placeholder?: string;
	className?: string;
};

function TextField(props: CommonFieldProps) {
	const field = useFieldContext<string>();
	const error = getFieldError(field.state.meta.errors);

	return (
		<FieldShell
			label={props.label}
			description={props.description}
			error={error}
			className={props.className}
		>
			<Input
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				placeholder={props.placeholder}
			/>
		</FieldShell>
	);
}

function NumberField(props: CommonFieldProps & { min?: number; max?: number }) {
	const field = useFieldContext<number>();
	const error = getFieldError(field.state.meta.errors);

	return (
		<FieldShell
			label={props.label}
			description={props.description}
			error={error}
			className={props.className}
		>
			<Input
				type="number"
				value={Number.isNaN(field.state.value) ? "" : field.state.value}
				min={props.min}
				max={props.max}
				onBlur={field.handleBlur}
				onChange={(event) =>
					field.handleChange(
						event.target.value === "" ? 0 : Number(event.target.value),
					)
				}
				placeholder={props.placeholder}
			/>
		</FieldShell>
	);
}

function TextareaField(props: CommonFieldProps & { rows?: number }) {
	const field = useFieldContext<string>();
	const error = getFieldError(field.state.meta.errors);

	return (
		<FieldShell
			label={props.label}
			description={props.description}
			error={error}
			className={props.className}
		>
			<Textarea
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				placeholder={props.placeholder}
				rows={props.rows}
			/>
		</FieldShell>
	);
}

function CheckboxField(props: CommonFieldProps) {
	const field = useFieldContext<boolean>();
	const error = getFieldError(field.state.meta.errors);

	return (
		<FieldShell
			label={props.label}
			description={props.description}
			error={error}
			className={props.className}
		>
			<div className="flex items-center gap-3 rounded-md border p-3 text-sm">
				<Checkbox
					checked={field.state.value}
					onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
					onBlur={field.handleBlur}
				/>
				<span>{props.placeholder ?? props.label}</span>
			</div>
		</FieldShell>
	);
}

function SelectField(
	props: CommonFieldProps & {
		options: Option[];
		onValueChange?: (value: string) => void;
	},
) {
	const field = useFieldContext<string>();
	const error = getFieldError(field.state.meta.errors);

	return (
		<FieldShell
			label={props.label}
			description={props.description}
			error={error}
			className={props.className}
		>
			<Select
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => {
					field.handleChange(event.target.value);
					props.onValueChange?.(event.target.value);
				}}
			>
				<option value="">{props.placeholder ?? "Selecione uma opcao"}</option>
				{props.options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</Select>
		</FieldShell>
	);
}

function CheckboxGroupField(
	props: CommonFieldProps & {
		options: Option[];
		emptyMessage?: string;
	},
) {
	const field = useFieldContext<string[]>();
	const error = getFieldError(field.state.meta.errors);
	const selectedValues = new Set(field.state.value);

	return (
		<FieldShell
			label={props.label}
			description={props.description}
			error={error}
			className={props.className}
		>
			<div className="rounded-md border">
				{props.options.length === 0 ? (
					<p className="p-3 text-sm text-muted-foreground">
						{props.emptyMessage ?? "Nenhuma opcao disponivel."}
					</p>
				) : (
					<div className="max-h-64 space-y-2 overflow-auto p-3">
						{props.options.map((option) => {
							const isChecked = selectedValues.has(option.value);
							return (
								<div
									key={option.value}
									className="flex items-start gap-3 rounded-md border p-3 text-sm"
								>
									<Checkbox
										checked={isChecked}
										onCheckedChange={(checked) => {
											const nextValue = checked
												? [...field.state.value, option.value]
												: field.state.value.filter(
														(value) => value !== option.value,
													);
											field.handleChange(nextValue);
										}}
										onBlur={field.handleBlur}
									/>
									<span className="space-y-1">
										<span className="block font-medium">{option.label}</span>
										{option.description ? (
											<span className="block text-xs text-muted-foreground">
												{option.description}
											</span>
										) : null}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
			{field.state.value.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{field.state.value.map((item) => (
						<Badge key={item} variant="secondary">
							{item}
						</Badge>
					))}
				</div>
			) : null}
		</FieldShell>
	);
}

function SubmitButton({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button type="submit" className={className} disabled={isSubmitting}>
					{children ?? "Salvar"}
				</Button>
			)}
		</form.Subscribe>
	);
}

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
		NumberField,
		TextareaField,
		CheckboxField,
		SelectField,
		CheckboxGroupField,
	},
	formComponents: {
		SubmitButton,
	},
	fieldContext,
	formContext,
});
