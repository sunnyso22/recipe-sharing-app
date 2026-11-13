"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { type ReactNode, startTransition, useActionState } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldPathValue,
  useFieldArray,
  useForm,
} from "react-hook-form";

import { createRecipeAction } from "@/app/recipes/new/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DESCRIPTION_LIMIT,
  emptyInstruction,
  emptyQuantity,
  INSTRUCTION_LIMIT,
  recipeFormSchema,
  type RecipeFormState,
  type RecipeFormValues,
} from "@/lib/recipes/form";

type RecipeTextPath = {
  [Path in FieldPath<RecipeFormValues>]: FieldPathValue<
    RecipeFormValues,
    Path
  > extends string
    ? Path
    : never;
}[FieldPath<RecipeFormValues>];

const emptyRecipe: RecipeFormValues = {
  title: "",
  description: "",
  ingredients: [emptyQuantity()],
  seasonings: [emptyQuantity()],
  instructions: [emptyInstruction()],
};

const listErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "";
  }

  const record = error as { message?: unknown; root?: { message?: unknown } };

  if (typeof record.message === "string" && record.message.length > 0) {
    return record.message;
  }

  return typeof record.root?.message === "string" ? record.root.message : "";
};

const cloneRecipeValues = (values: RecipeFormValues): RecipeFormValues => {
  return {
    title: values.title,
    description: values.description,
    ingredients: values.ingredients.map((item) => ({ ...item })),
    seasonings: values.seasonings.map((item) => ({ ...item })),
    instructions: values.instructions.map((item) => ({ ...item })),
  };
};

const RecipeForm = ({
  action = createRecipeAction,
  defaultValues = emptyRecipe,
  submitLabel = "Save recipe",
  pendingLabel = "Saving...",
}: {
  action?: (
    state: RecipeFormState,
    values: RecipeFormValues,
  ) => Promise<RecipeFormState>;
  defaultValues?: RecipeFormValues;
  submitLabel?: string;
  pendingLabel?: string;
}) => {
  const [state, submitRecipe, pending] = useActionState(action, {
    message: "",
  });
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: cloneRecipeValues(defaultValues),
  });
  const ingredients = useFieldArray({
    control: form.control,
    name: "ingredients",
  });
  const seasonings = useFieldArray({
    control: form.control,
    name: "seasonings",
  });
  const instructions = useFieldArray({
    control: form.control,
    name: "instructions",
  });
  const listMessage =
    listErrorMessage(form.formState.errors.ingredients) ||
    listErrorMessage(form.formState.errors.seasonings) ||
    listErrorMessage(form.formState.errors.instructions);

  return (
    <form
      noValidate
      className="flex flex-col gap-8"
      onSubmit={form.handleSubmit((values) => {
        startTransition(() => {
          submitRecipe(values);
        });
      })}
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-0">
          <div className="flex aspect-3/2 h-full flex-col items-center justify-center gap-3 bg-muted px-6 text-center text-muted-foreground">
            <ImagePlus className="size-8" aria-hidden />
            <p>Image upload coming soon</p>
          </div>
        </Card>
        <Card>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <FieldGroup className="min-h-0 flex-1 gap-4">
              <RecipeTextField
                control={form.control}
                name="title"
                label="Title"
                placeholder="Weeknight tomato pasta"
                maxLength={255}
              />
              <RecipeTextField
                control={form.control}
                name="description"
                label="Description"
                placeholder="A short note on what makes this recipe worth cooking."
                multiline
                fill
                maxLength={DESCRIPTION_LIMIT}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuantityFields
          title="Ingredients"
          rows={ingredients.fields}
          removeLabel="Remove ingredient"
          onAdd={() => {
            ingredients.append(emptyQuantity());
          }}
          onRemove={ingredients.remove}
          renderName={(index) => (
            <RecipeTextField
              control={form.control}
              name={`ingredients.${index}.name`}
              label="Name"
              placeholder={index === 0 ? "Tomatoes" : undefined}
              hideLabel
              maxLength={255}
            />
          )}
          renderQuantity={(index) => (
            <RecipeTextField
              control={form.control}
              name={`ingredients.${index}.quantity`}
              label="Quantity"
              placeholder={index === 0 ? "4" : undefined}
              hideLabel
              maxLength={255}
            />
          )}
        />
        <QuantityFields
          title="Seasonings"
          rows={seasonings.fields}
          removeLabel="Remove seasoning"
          onAdd={() => {
            seasonings.append(emptyQuantity());
          }}
          onRemove={seasonings.remove}
          renderName={(index) => (
            <RecipeTextField
              control={form.control}
              name={`seasonings.${index}.name`}
              label="Name"
              placeholder={index === 0 ? "Salt" : undefined}
              hideLabel
              maxLength={255}
            />
          )}
          renderQuantity={(index) => (
            <RecipeTextField
              control={form.control}
              name={`seasonings.${index}.quantity`}
              label="Quantity"
              placeholder={index === 0 ? "1 tsp" : undefined}
              hideLabel
              maxLength={255}
            />
          )}
        />
      </div>

      <Card>
        <CardContent>
          <FieldSet className="gap-4">
            <FieldLegend>
              <h2 className="font-heading text-2xl font-medium">
                Instructions
              </h2>
            </FieldLegend>
            <FieldGroup className="gap-4">
              {instructions.fields.map((instruction, index) => (
                <div key={instruction.id} className="flex items-start gap-3">
                  <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <RecipeTextField
                      control={form.control}
                      name={`instructions.${index}.description`}
                      label={`Step ${index + 1}`}
                      placeholder={
                        index === 0
                          ? "Simmer until the sauce thickens."
                          : undefined
                      }
                      hideLabel
                      multiline
                      maxLength={INSTRUCTION_LIMIT}
                    />
                  </div>
                  {instructions.fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-1"
                      aria-label={`Remove step ${index + 1}`}
                      onClick={() => {
                        instructions.remove(index);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              ))}
            </FieldGroup>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => {
                instructions.append(emptyInstruction());
              }}
            >
              <Plus />
              Add
            </Button>
          </FieldSet>
        </CardContent>
      </Card>

      {listMessage ? <FieldError>{listMessage}</FieldError> : null}
      {state.message ? <FieldError>{state.message}</FieldError> : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
};

const RecipeTextField = ({
  control,
  name,
  label,
  placeholder,
  hideLabel = false,
  multiline = false,
  fill = false,
  maxLength,
}: {
  control: Control<RecipeFormValues>;
  name: RecipeTextPath;
  label: string;
  placeholder?: string;
  hideLabel?: boolean;
  multiline?: boolean;
  fill?: boolean;
  maxLength?: number;
}) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          className={fill ? "min-h-0 flex-1" : undefined}
        >
          <FieldLabel
            htmlFor={field.name}
            className={hideLabel ? "sr-only" : undefined}
          >
            {label}
          </FieldLabel>
          {multiline ? (
            <Textarea
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder={placeholder}
              maxLength={maxLength}
              className={
                fill ? "min-h-28 flex-1 field-sizing-fixed" : "min-h-12"
              }
            />
          ) : (
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder={placeholder}
              maxLength={maxLength}
            />
          )}
          {fieldState.invalid ? (
            <FieldError errors={[fieldState.error]} />
          ) : null}
        </Field>
      )}
    />
  );
};

const QuantityFields = ({
  title,
  rows,
  removeLabel,
  onAdd,
  onRemove,
  renderName,
  renderQuantity,
}: {
  title: string;
  rows: { id: string }[];
  removeLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderName: (index: number) => ReactNode;
  renderQuantity: (index: number) => ReactNode;
}) => {
  return (
    <Card>
      <CardContent>
        <FieldSet className="gap-4">
          <FieldLegend>
            <h2 className="font-heading text-2xl font-medium">{title}</h2>
          </FieldLegend>
          <FieldGroup className="gap-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-start"
              >
                {renderName(index)}
                {renderQuantity(index)}
                {rows.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${removeLabel} ${index + 1}`}
                    onClick={() => {
                      onRemove(index);
                    }}
                  >
                    <Trash2 />
                  </Button>
                ) : (
                  <span className="hidden size-9 sm:block" aria-hidden />
                )}
              </div>
            ))}
          </FieldGroup>
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={onAdd}
          >
            <Plus />
            Add
          </Button>
        </FieldSet>
      </CardContent>
    </Card>
  );
};

const RecipeFormSkeleton = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="aspect-3/2 animate-pulse rounded-4xl bg-muted" />
        <div className="flex flex-col gap-4 lg:py-4">
          <div className="h-16 animate-pulse rounded-3xl bg-muted" />
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-4xl bg-muted" />
        <div className="h-56 animate-pulse rounded-4xl bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-4xl bg-muted" />
    </div>
  );
};

export { RecipeForm, RecipeFormSkeleton };
