import { useCallback, useEffect, useState } from "react"

import { Input } from "@/components/ui/input"

import { debounce } from "../lib/debounce"

export function DebouncedInput({
	value: initialValue,
	onChange,
	debounceMs = 500,
	...props
}: {
	value: string | number
	onChange: (value: string | number) => void
	debounceMs?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
	const [value, setValue] = useState(initialValue)

	useEffect(() => {
		setValue(initialValue)
	}, [initialValue])

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedOnChange = useCallback(
		debounce((newValue: string | number) => {
			onChange(newValue)
		}, debounceMs),
		[debounceMs, onChange],
	)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		setValue(newValue)
		debouncedOnChange(newValue)
	}

	return <Input {...props} value={value} onChange={handleChange} />
}
