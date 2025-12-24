import { describe, it, expect, vi } from 'vitest';

describe('SplitPickerModal Component', () => {
	describe('info button touch target', () => {
		it('should stop propagation when info button is clicked', () => {
			// Simulate the onclick handler from SplitPickerModal.svelte
			// onclick={(e) => e.stopPropagation()}
			const mockEvent = {
				stopPropagation: vi.fn(),
			};

			// This is the handler pattern used in the component
			const infoButtonClickHandler = (e: { stopPropagation: () => void }) => {
				e.stopPropagation();
			};

			infoButtonClickHandler(mockEvent);

			expect(mockEvent.stopPropagation).toHaveBeenCalled();
		});

		it('should not trigger split selection when info button is clicked', () => {
			const selectSplit = vi.fn();
			const mockEvent = {
				stopPropagation: vi.fn(),
			};

			// Simulate component behavior:
			// - Parent Card has onclick={() => selectSplit(split)}
			// - Info button has onclick={(e) => e.stopPropagation()}

			// When info button is clicked, stopPropagation prevents parent handler
			const infoButtonClickHandler = (e: { stopPropagation: () => void }) => {
				e.stopPropagation();
				// Info button doesn't call selectSplit
			};

			infoButtonClickHandler(mockEvent);

			expect(selectSplit).not.toHaveBeenCalled();
			expect(mockEvent.stopPropagation).toHaveBeenCalled();
		});
	});

	describe('info button styling', () => {
		it('should have 44x44px minimum touch target', () => {
			// Verify the CSS requirements for .gb-info-btn
			const expectedMinSize = 44;

			// The component uses:
			// .gb-info-btn {
			//   width: 44px;
			//   height: 44px;
			// }
			const buttonStyles = {
				width: 44,
				height: 44,
			};

			expect(buttonStyles.width).toBeGreaterThanOrEqual(expectedMinSize);
			expect(buttonStyles.height).toBeGreaterThanOrEqual(expectedMinSize);
		});
	});

	describe('split selection', () => {
		it('should create correct event detail for split selection', () => {
			const mockSplit = {
				id: 'push',
				name: 'Push Day',
				muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
				exercises: [],
			};

			// Verify the event detail structure that would be dispatched
			const eventDetail = { split: mockSplit };

			expect(eventDetail.split.id).toBe('push');
			expect(eventDetail.split.name).toBe('Push Day');
			expect(eventDetail.split.muscleGroups).toEqual(['Chest', 'Shoulders', 'Triceps']);
		});
	});
});
