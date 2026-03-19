import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { type ReactNode, useId } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
} from "@/components/ui/combobox";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

type Option = {
	label: string;
	value: string;
	description?: string;
};

type CommonFieldProps = {
	label: string;
	description?: string;
	placeholder?: string;
	className?: string;
};

function getFieldState(
	errors: unknown[],
	isTouched: boolean,
	formState: unknown,
) {
	const state = formState as {
		isSubmitted?: boolean;
		submissionAttempts?: number;
	};
	const shouldShowError =
		errors.length > 0 &&
		(isTouched ||
			Boolean(state.isSubmitted) ||
			(state.submissionAttempts ?? 0) > 0);

	return {
		isInvalid: shouldShowError,
		shouldShowError,
	};
}

function getDescribedBy(
	descriptionId: string | undefined,
	errorId: string | undefined,
) {
	return [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
}

function TextField(props: CommonFieldProps) {
	const field = useFieldContext<string>();
	const fieldId = useId();
	const descriptionId = props.description
		? `${fieldId}-description`
		: undefined;
	const errorId = `${fieldId}-error`;
	const { isInvalid, shouldShowError } = getFieldState(
		field.state.meta.errors,
		field.state.meta.isTouched,
		field.form.state,
	);

	return (
		<Field data-invalid={isInvalid} className={props.className}>
			<FieldLabel htmlFor={fieldId} data-invalid={isInvalid}>
				{props.label}
			</FieldLabel>
			{props.description ? (
				<FieldDescription id={descriptionId}>
					{props.description}
				</FieldDescription>
			) : null}
			<Input
				id={fieldId}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				placeholder={props.placeholder}
				aria-invalid={isInvalid}
				aria-describedby={getDescribedBy(
					descriptionId,
					shouldShowError ? errorId : undefined,
				)}
			/>
			{shouldShowError ? (
				<FieldError id={errorId} errors={field.state.meta.errors} />
			) : null}
		</Field>
	);
}

function NumberField(props: CommonFieldProps & { min?: number; max?: number }) {
	const field = useFieldContext<number>();
	const fieldId = useId();
	const descriptionId = props.description
		? `${fieldId}-description`
		: undefined;
	const errorId = `${fieldId}-error`;
	const { isInvalid, shouldShowError } = getFieldState(
		field.state.meta.errors,
		field.state.meta.isTouched,
		field.form.state,
	);

	return (
		<Field data-invalid={isInvalid} className={props.className}>
			<FieldLabel htmlFor={fieldId} data-invalid={isInvalid}>
				{props.label}
			</FieldLabel>
			{props.description ? (
				<FieldDescription id={descriptionId}>
					{props.description}
				</FieldDescription>
			) : null}
			<Input
				id={fieldId}
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
				aria-invalid={isInvalid}
				aria-describedby={getDescribedBy(
					descriptionId,
					shouldShowError ? errorId : undefined,
				)}
			/>
			{shouldShowError ? (
				<FieldError id={errorId} errors={field.state.meta.errors} />
			) : null}
		</Field>
	);
}

function TextareaField(props: CommonFieldProps & { rows?: number }) {
	const field = useFieldContext<string>();
	const fieldId = useId();
	const descriptionId = props.description
		? `${fieldId}-description`
		: undefined;
	const errorId = `${fieldId}-error`;
	const { isInvalid, shouldShowError } = getFieldState(
		field.state.meta.errors,
		field.state.meta.isTouched,
		field.form.state,
	);

	return (
		<Field data-invalid={isInvalid} className={props.className}>
			<FieldLabel htmlFor={fieldId} data-invalid={isInvalid}>
				{props.label}
			</FieldLabel>
			{props.description ? (
				<FieldDescription id={descriptionId}>
					{props.description}
				</FieldDescription>
			) : null}
			<Textarea
				id={fieldId}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				placeholder={props.placeholder}
				rows={props.rows}
				aria-invalid={isInvalid}
				aria-describedby={getDescribedBy(
					descriptionId,
					shouldShowError ? errorId : undefined,
				)}
			/>
			{shouldShowError ? (
				<FieldError id={errorId} errors={field.state.meta.errors} />
			) : null}
		</Field>
	);
}

function CheckboxField(props: CommonFieldProps) {
	const field = useFieldContext<boolean>();
	const fieldId = useId();
	const descriptionId = props.description
		? `${fieldId}-description`
		: undefined;
	const errorId = `${fieldId}-error`;
	const { isInvalid, shouldShowError } = getFieldState(
		field.state.meta.errors,
		field.state.meta.isTouched,
		field.form.state,
	);

	return (
		<Field data-invalid={isInvalid} className={props.className}>
			<div
				className={cn(
					"flex items-start gap-3 rounded-md border p-3 text-sm",
					isInvalid && "border-destructive",
				)}
			>
				<Checkbox
					id={fieldId}
					checked={field.state.value}
					onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
					onBlur={field.handleBlur}
					aria-invalid={isInvalid}
					aria-describedby={getDescribedBy(
						descriptionId,
						shouldShowError ? errorId : undefined,
					)}
				/>
				<div className="grid gap-1.5">
					<FieldLabel htmlFor={fieldId} data-invalid={isInvalid}>
						{props.label}
					</FieldLabel>
					{props.placeholder ? (
						<p className="text-sm text-muted-foreground">{props.placeholder}</p>
					) : null}
					{props.description ? (
						<FieldDescription id={descriptionId}>
							{props.description}
						</FieldDescription>
					) : null}
				</div>
			</div>
			{shouldShowError ? (
				<FieldError id={errorId} errors={field.state.meta.errors} />
			) : null}
		</Field>
	);
}

function SelectField(
	props: CommonFieldProps & {
		options: Option[];
		onValueChange?: (value: string) => void;
	},
) {
	const field = useFieldContext<string>();
	const fieldId = useId();
	const descriptionId = props.description
		? `${fieldId}-description`
		: undefined;
	const errorId = `${fieldId}-error`;
	const { isInvalid, shouldShowError } = getFieldState(
		field.state.meta.errors,
		field.state.meta.isTouched,
		field.form.state,
	);

	return (
		<Field data-invalid={isInvalid} className={props.className}>
			<FieldLabel htmlFor={fieldId} data-invalid={isInvalid}>
				{props.label}
			</FieldLabel>
			{props.description ? (
				<FieldDescription id={descriptionId}>
					{props.description}
				</FieldDescription>
			) : null}
			<Select
				value={field.state.value || ""}
				onValueChange={(value) => {
					field.handleChange(value);
					props.onValueChange?.(value);
				}}
				onOpenChange={(open) => {
					if (!open) field.handleBlur();
				}}
			>
				<SelectTrigger
					id={fieldId}
					aria-invalid={isInvalid}
					aria-describedby={getDescribedBy(
						descriptionId,
						shouldShowError ? errorId : undefined,
					)}
				>
					<SelectValue
						placeholder={props.placeholder ?? "Selecione uma opcao"}
					/>
				</SelectTrigger>
				<SelectContent>
					{props.options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{shouldShowError ? (
				<FieldError id={errorId} errors={field.state.meta.errors} />
			) : null}
		</Field>
	);
}

function CheckboxGroupField(
	props: CommonFieldProps & {
		options: Option[];
		emptyMessage?: string;
	},
) {
	const field = useFieldContext<string[]>();
	const fieldId = useId();
	const descriptionId = props.description
		? `${fieldId}-description`
		: undefined;
	const errorId = `${fieldId}-error`;
	const { isInvalid, shouldShowError } = getFieldState(
		field.state.meta.errors,
		field.state.meta.isTouched,
		field.form.state,
	);

	return (
		<Field data-invalid={isInvalid} className={props.className}>
			<FieldLabel htmlFor={fieldId} data-invalid={isInvalid}>
				{props.label}
			</FieldLabel>

			{props.description && (
				<FieldDescription id={descriptionId}>
					{props.description}
				</FieldDescription>
			)}

			<Combobox
				multiple
				virtualized={props.options.length > 50}
				items={props.options}
				value={field.state.value}
				onValueChange={(value) =>
					field.handleChange(value === null ? [] : value)
				}
			>
				<ComboboxChips
					aria-invalid={isInvalid}
					aria-describedby={getDescribedBy(
						descriptionId,
						shouldShowError ? errorId : undefined,
					)}
					onBlur={field.handleBlur}
				>
					<ComboboxValue>
						{field.state.value.map((val) => {
							const selectedOption = props.options.find((o) => o.value === val);
							return (
								<ComboboxChip key={val}>
									{selectedOption?.label ?? val}
								</ComboboxChip>
							);
						})}
					</ComboboxValue>

					<ComboboxChipsInput
						id={fieldId}
						placeholder={props.placeholder ?? "Selecionar itens"}
					/>
				</ComboboxChips>

				<ComboboxContent>
					<ComboboxList>
						{(option: Option) => (
							<ComboboxItem key={option.value} value={option.value}>
								{option.label}
							</ComboboxItem>
						)}
					</ComboboxList>

					<ComboboxEmpty>
						{props.emptyMessage ?? "Nenhuma opcao disponivel."}
					</ComboboxEmpty>
				</ComboboxContent>
			</Combobox>

			{shouldShowError && (
				<FieldError id={errorId} errors={field.state.meta.errors} />
			)}
		</Field>
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
