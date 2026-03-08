"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type Props = { children: ReactNode; fallback?: ReactNode; onReset?: () => void };
type State = { hasError: boolean };

export class QueueTableErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("QueueTableErrorBoundary:", error, info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback;
			return (
				<div className="app-card p-5">
					<p className="app-body mb-3 text-[rgba(240,240,240,0.7)]">
						Something went wrong displaying the queue.
					</p>
					<button
						type="button"
						onClick={() => {
							this.setState({ hasError: false });
							this.props.onReset?.();
						}}
						className="app-btn app-btn--sm"
					>
						Try again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
