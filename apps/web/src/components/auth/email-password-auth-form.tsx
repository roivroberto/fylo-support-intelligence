"use client";

import type { FormEvent } from "react";
import { useState } from "react";

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
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
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
					required
					value={email}
					onChange={(event) => {
						setEmail(event.currentTarget.value);
					}}
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="auth-password">Password</Label>
				<Input
					id="auth-password"
					type="password"
					autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
					required
					value={password}
					onChange={(event) => {
						setPassword(event.currentTarget.value);
					}}
				/>
			</div>
			{error ? <p className="text-xs text-destructive">{error}</p> : null}
			<Button type="submit" disabled={isPending}>
				{isPending ? "Submitting..." : submitLabel}
			</Button>
		</form>
	);
}

export type { AuthFormInput, AuthMode, EmailPasswordAuthFormProps };
