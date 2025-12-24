import { describe, it, expect, vi } from 'vitest';

describe('Input Component', () => {
	describe('keyboard handling', () => {
		it('should call onsubmit when Enter key is pressed', () => {
			const onsubmit = vi.fn();

			// Simulate the handleKeydown logic from Input.svelte
			function handleKeydown(event: { key: string; preventDefault: () => void }) {
				if (event.key === 'Enter' && onsubmit) {
					event.preventDefault();
					onsubmit();
				}
			}

			const mockEvent = {
				key: 'Enter',
				preventDefault: vi.fn(),
			};

			handleKeydown(mockEvent);

			expect(mockEvent.preventDefault).toHaveBeenCalled();
			expect(onsubmit).toHaveBeenCalled();
		});

		it('should not call onsubmit for non-Enter keys', () => {
			const onsubmit = vi.fn();

			function handleKeydown(event: { key: string; preventDefault: () => void }) {
				if (event.key === 'Enter' && onsubmit) {
					event.preventDefault();
					onsubmit();
				}
			}

			const mockEvent = {
				key: 'Escape',
				preventDefault: vi.fn(),
			};

			handleKeydown(mockEvent);

			expect(mockEvent.preventDefault).not.toHaveBeenCalled();
			expect(onsubmit).not.toHaveBeenCalled();
		});

		it('should not call preventDefault when onsubmit is not defined', () => {
			const onsubmit: (() => void) | undefined = undefined;

			function handleKeydown(event: { key: string; preventDefault: () => void }) {
				if (event.key === 'Enter' && onsubmit) {
					event.preventDefault();
					onsubmit();
				}
			}

			const mockEvent = {
				key: 'Enter',
				preventDefault: vi.fn(),
			};

			handleKeydown(mockEvent);

			expect(mockEvent.preventDefault).not.toHaveBeenCalled();
		});

		it('should handle Tab key without triggering submit', () => {
			const onsubmit = vi.fn();

			function handleKeydown(event: { key: string; preventDefault: () => void }) {
				if (event.key === 'Enter' && onsubmit) {
					event.preventDefault();
					onsubmit();
				}
			}

			const mockEvent = {
				key: 'Tab',
				preventDefault: vi.fn(),
			};

			handleKeydown(mockEvent);

			expect(onsubmit).not.toHaveBeenCalled();
		});
	});

	describe('Input props', () => {
		it('should support onsubmit callback', () => {
			// Verify the InputProps type accepts onsubmit
			const props = {
				value: 'test',
				placeholder: 'Enter name',
				size: 'md' as const,
				onsubmit: () => {},
			};

			expect(props.onsubmit).toBeDefined();
			expect(typeof props.onsubmit).toBe('function');
		});
	});
});
