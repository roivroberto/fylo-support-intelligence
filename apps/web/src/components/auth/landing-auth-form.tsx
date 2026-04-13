"use client";

import { useState } from "react";

type AuthMode = "sign-in" | "sign-up";

export type LandingAuthFormProps = {
	mode: AuthMode;
	submitLabel: string;
	onSuccess: () => void;
	onSubmit: (values: {
		email: string;
		password: string;
		name?: string;
	}) => Promise<void>;
};

function EyeIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

function EyeOffIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		>
			<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
			<line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	);
}

export function LandingAuthForm({
	mode,
	submitLabel,
	onSuccess,
	onSubmit,
}: LandingAuthFormProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setIsPending(true);
		try {
			await onSubmit({
				...(mode === "sign-up" ? { name: name.trim() } : {}),
				email: email.trim(),
				password,
			});
			onSuccess();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to complete authentication",
			);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			{mode === "sign-up" ? (
				<div className="flex flex-col">
					<label
						htmlFor="auth-name"
						className="mono text-[10px] uppercase mb-2 opacity-50"
					>
						Name
					</label>
					<input
						id="auth-name"
						type="text"
						placeholder="John Doe"
						autoComplete="name"
						required
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="debossed-input p-4 rounded mono text-sm"
					/>
				</div>
			) : null}
			<div className="flex flex-col">
				<label
					htmlFor="auth-email"
					className="mono text-[10px] uppercase mb-2 opacity-50"
				>
					Email
				</label>
				<input
					id="auth-email"
					type="email"
					placeholder="john@acme.com"
					autoComplete="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="debossed-input p-4 rounded mono text-sm"
				/>
			</div>
			<div className="flex flex-col">
				<label
					htmlFor="auth-password"
					className="mono text-[10px] uppercase mb-2 opacity-50"
				>
					Password
				</label>
				<div className="relative">
					<input
						id="auth-password"
						type={showPassword ? "text" : "password"}
						placeholder="••••••••"
						autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="debossed-input p-4 pr-12 rounded mono text-sm w-full"
					/>
					<button
						type="button"
						onClick={() => setShowPassword((s) => !s)}
						className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? <EyeOffIcon /> : <EyeIcon />}
					</button>
				</div>
			</div>
			{error ? (
				<p className="text-xs text-red-400/90 mono">{error}</p>
			) : null}
			<button
				type="submit"
				disabled={isPending}
				className="btn-primary w-full py-4"
			>
				{isPending ? "Submitting..." : submitLabel}
			</button>
		</form>
	);
}
