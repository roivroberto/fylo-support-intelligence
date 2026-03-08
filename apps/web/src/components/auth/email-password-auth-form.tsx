"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type AuthMode = "sign-in" | "sign-up";

type AuthFormInput = {
	email: string;
	password: string;
	name?: string;
};

type EmailPasswordAuthFormProps = {
	mode: AuthMode;
	submitLabel: string;
	onSubmit: (values: AuthFormInput) => Promise<void>;
};

export function EmailPasswordAuthForm({
	mode,
	submitLabel,
	onSubmit,
}: EmailPasswordAuthFormProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (isPending) {
			return;
		}

		setError(null);
		setIsPending(true);

		try {
		await onSubmit({
				...(mode === "sign-up" ? { name: name.trim() } : {}),
				email: email.trim(),
				password,
			});
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Unable to complete authentication request",
			);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<form className="grid gap-4" onSubmit={handleSubmit}>
		{mode === "sign-up" ? (
			<div className="grid gap-2">
				<Label htmlFor="auth-name">Name</Label>
				<Input
					id="auth-name"
					autoComplete="name"
					disabled={isPending}
					name="name"
					required
					value={name}
					onChange={(event) => {
						setName(event.currentTarget.value);
					}}
				/>
			</div>
		) : null}
			<div className="grid gap-2">
				<Label htmlFor="auth-email">Email</Label>
				<Input
					id="auth-email"
					type="email"
					autoComplete="email"
					disabled={isPending}
					name="email"
					required
					value={email}
					onChange={(event) => {
						setEmail(event.currentTarget.value);
					}}
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="auth-password">Password</Label>
				<div className="relative">
					<Input
						id="auth-password"
						type={showPassword ? "text" : "password"}
						autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
						disabled={isPending}
						name="password"
						required
						value={password}
						onChange={(event) => {
							setPassword(event.currentTarget.value);
						}}
						className="pr-9"
					/>
					<button
						type="button"
						tabIndex={-1}
						aria-label={showPassword ? "Hide password" : "Show password"}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
						onClick={() => setShowPassword((v) => !v)}
						disabled={isPending}
					>
						{showPassword ? (
							<EyeOff className="size-4" aria-hidden />
						) : (
							<Eye className="size-4" aria-hidden />
						)}
					</button>
				</div>
			</div>
			{error ? (
				<p aria-live="polite" className="text-xs text-destructive">
					{error}
				</p>
			) : null}
			<Button type="submit" disabled={isPending}>
				{isPending ? "Submitting..." : submitLabel}
			</Button>
		</form>
	);
}

export type { AuthFormInput, AuthMode, EmailPasswordAuthFormProps };
