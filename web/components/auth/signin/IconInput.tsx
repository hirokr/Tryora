import type { ReactNode, RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IconInputProps = {
	id: string;
	name?: string;
	label: string;
	type: string;
	placeholder: string;
	autoComplete?: string;
	icon: ReactNode;
	inputRef?: RefObject<HTMLInputElement | null>;
};

export default function IconInput({
	id,
	name,
	label,
	type,
	placeholder,
	autoComplete,
	icon,
	inputRef,
}: IconInputProps) {
	return (
		<div data-field>
			<Label
				htmlFor={id}
				className='mb-2 block text-sm font-medium text-muted-foreground'
			>
				{label}
			</Label>
			<div className='relative'>
				<span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
					{icon}
				</span>
				<Input
					ref={inputRef}
					id={id}
					name={name}
					type={type}
					placeholder={placeholder}
					autoComplete={autoComplete}
					className='h-11 rounded-xl border border-input bg-card/90 pl-10 pr-4 text-sm text-foreground shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary'
				/>
			</div>
		</div>
	);
}
