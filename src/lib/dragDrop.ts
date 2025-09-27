/**
 * Canonical drag and drop operations for form builder
 * Provides type-safe, atomic operations with undo/redo support
 */

import { z } from 'zod';
import { DragOperation, DraggableItem, BulkOperation } from './validation';

export interface DragDropContext<T extends DraggableItem = DraggableItem> {
  items: T[];
  sections?: FormSection[];
  constraints?: DragConstraints;
}

export interface FormSection {
  id: string;
  type: string;
  title?: string;
  accepts: string[];
  maxItems?: number;
  order: number;
}

export interface DragConstraints {
  maxItemsPerSection?: number;
  allowCrossSectionDrag?: boolean;
  allowDuplication?: boolean;
  validateDrop?: (source: T, target: DragTarget) => boolean;
}

export interface DragTarget {
  index: number;
  sectionId?: string;
}

export interface DragResult<T extends DraggableItem = DraggableItem> {
  success: boolean;
  items: T[];
  operation: DragOperation;
  error?: string;
}

/**
 * Core drag and drop operations
 */
export class DragDropManager<T extends DraggableItem = DraggableItem> {
  private history: DragOperation[] = [];
  private maxHistorySize = 50;

  constructor(private context: DragDropContext<T>) {}

  /**
   * Move an item to a new position
   */
  moveItem(
    sourceId: string,
    targetIndex: number,
    targetSectionId?: string
  ): DragResult<T> {
    const sourceIndex = this.context.items.findIndex(item => item.id === sourceId);
    if (sourceIndex === -1) {
      return { success: false, items: this.context.items, operation: null!, error: 'Source item not found' };
    }

    const sourceItem = this.context.items[sourceIndex];

    // Validate the move operation
    const validationResult = this.validateMove(sourceItem, { index: targetIndex, sectionId: targetSectionId });
    if (!validationResult.valid) {
      return { success: false, items: this.context.items, operation: null!, error: validationResult.error };
    }

    // Perform the move
    const newItems = [...this.context.items];
    const [movedItem] = newItems.splice(sourceIndex, 1);

    // Update item order and section
    const updatedItem = {
      ...movedItem,
      order: targetIndex,
      updated_at: new Date(),
    } as T;

    // Insert at target position
    newItems.splice(targetIndex, 0, updatedItem);

    // Reorder all items to maintain consistency
    const reorderedItems = this.reorderItems(newItems);

    // Create operation record
    const operation: DragOperation = {
      action: 'move',
      source: {
        type: this.getItemType(sourceItem),
        id: sourceId,
        index: sourceIndex,
      },
      target: {
        index: targetIndex,
        section_id: targetSectionId,
      },
      timestamp: new Date(),
    };

    this.addToHistory(operation);

    return {
      success: true,
      items: reorderedItems,
      operation,
    };
  }

  /**
   * Copy an item to a new position
   */
  copyItem(
    sourceId: string,
    targetIndex: number,
    targetSectionId?: string
  ): DragResult<T> {
    if (!this.context.constraints?.allowDuplication) {
      return { success: false, items: this.context.items, operation: null!, error: 'Duplication not allowed' };
    }

    const sourceItem = this.context.items.find(item => item.id === sourceId);
    if (!sourceItem) {
      return { success: false, items: this.context.items, operation: null!, error: 'Source item not found' };
    }

    // Create a copy with new ID
    const copiedItem = {
      ...sourceItem,
      id: this.generateId(),
      order: targetIndex,
      created_at: new Date(),
      updated_at: new Date(),
    } as T;

    const newItems = [...this.context.items];
    newItems.splice(targetIndex, 0, copiedItem);

    const reorderedItems = this.reorderItems(newItems);

    const operation: DragOperation = {
      action: 'copy',
      source: {
        type: this.getItemType(sourceItem),
        id: sourceId,
        index: this.context.items.findIndex(item => item.id === sourceId),
      },
      target: {
        index: targetIndex,
        section_id: targetSectionId,
      },
      timestamp: new Date(),
    };

    this.addToHistory(operation);

    return {
      success: true,
      items: reorderedItems,
      operation,
    };
  }

  /**
   * Delete an item
   */
  deleteItem(itemId: string): DragResult<T> {
    const sourceIndex = this.context.items.findIndex(item => item.id === itemId);
    if (sourceIndex === -1) {
      return { success: false, items: this.context.items, operation: null!, error: 'Item not found' };
    }

    const sourceItem = this.context.items[sourceIndex];
    const newItems = [...this.context.items];
    newItems.splice(sourceIndex, 1);

    const reorderedItems = this.reorderItems(newItems);

    const operation: DragOperation = {
      action: 'delete',
      source: {
        type: this.getItemType(sourceItem),
        id: itemId,
        index: sourceIndex,
      },
      target: {
        index: -1, // Indicates deletion
      },
      timestamp: new Date(),
    };

    this.addToHistory(operation);

    return {
      success: true,
      items: reorderedItems,
      operation,
    };
  }

  /**
   * Reorder multiple items at once
   */
  reorderItems(items: T[]): T[] {
    return items
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        ...item,
        order: index,
        updated_at: new Date(),
      }));
  }

  /**
   * Bulk operations for efficiency
   */
  bulkOperation(operation: BulkOperation): DragResult<T> {
    let newItems = [...this.context.items];

    switch (operation.operation) {
      case 'reorder':
        for (const item of operation.items) {
          const index = newItems.findIndex(i => i.id === item.id);
          if (index !== -1 && item.new_order !== undefined) {
            newItems[index] = { ...newItems[index], order: item.new_order };
          }
        }
        newItems = this.reorderItems(newItems);
        break;

      case 'update_multiple':
        for (const item of operation.items) {
          const index = newItems.findIndex(i => i.id === item.id);
          if (index !== -1 && item.updates) {
            newItems[index] = { ...newItems[index], ...item.updates, updated_at: new Date() };
          }
        }
        break;

      case 'delete_multiple':
        const idsToDelete = new Set(operation.items.map(item => item.id));
        newItems = newItems.filter(item => !idsToDelete.has(item.id));
        newItems = this.reorderItems(newItems);
        break;
    }

    return {
      success: true,
      items: newItems,
      operation: null!, // Bulk operations don't generate single drag operations
    };
  }

  /**
   * Get operation history
   */
  getHistory(): DragOperation[] {
    return [...this.history];
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.history = [];
  }

  private validateMove(item: T, target: DragTarget): { valid: boolean; error?: string } {
    // Check if target section accepts this item type
    if (target.sectionId && this.context.sections) {
      const section = this.context.sections.find(s => s.id === target.sectionId);
      if (section && !section.accepts.includes(this.getItemType(item))) {
        return { valid: false, error: 'Item type not allowed in target section' };
      }

      // Check section capacity
      if (section?.maxItems) {
        const itemsInSection = this.context.items.filter(i =>
          this.getItemSection(i) === target.sectionId
        ).length;
        if (itemsInSection >= section.maxItems) {
          return { valid: false, error: 'Target section is at capacity' };
        }
      }
    }

    // Custom validation
    if (this.context.constraints?.validateDrop) {
      if (!this.context.constraints.validateDrop(item, target)) {
        return { valid: false, error: 'Custom validation failed' };
      }
    }

    return { valid: true };
  }

  private getItemType(item: T): 'contact_field' | 'qualifier' | 'consent' {
    // This would be determined based on item properties
    // For now, return a default type
    return 'contact_field';
  }

  private getItemSection(item: T): string | undefined {
    // This would be determined based on item properties
    return undefined;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private addToHistory(operation: DragOperation): void {
    this.history.push(operation);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }
}

/**
 * Utility functions for common drag/drop scenarios
 */
export const dragDropUtils = {
  /**
   * Create a drag drop manager with sensible defaults
   */
  createManager<T extends DraggableItem>(
    items: T[],
    options?: Partial<DragDropContext<T>>
  ): DragDropManager<T> {
    return new DragDropManager({
      items,
      constraints: {
        allowCrossSectionDrag: true,
        allowDuplication: false,
        maxItemsPerSection: 20,
        ...options?.constraints,
      },
      sections: options?.sections,
    });
  },

  /**
   * Validate drag operation before attempting
   */
  validateDragOperation(operation: Partial<DragOperation>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      DragOperation.partial().parse(operation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => e.message));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Convert drag operation to undo operation
   */
  createUndoOperation(operation: DragOperation): DragOperation {
    return {
      ...operation,
      source: operation.target,
      target: operation.source,
      timestamp: new Date(),
    };
  },

  /**
   * Serialize drag operations for persistence
   */
  serializeDragHistory(history: DragOperation[]): string {
    return JSON.stringify(history.map(op => ({
      ...op,
      timestamp: op.timestamp.toISOString(),
    })));
  },

  /**
   * Deserialize drag operations from storage
   */
  deserializeDragHistory(serialized: string): DragOperation[] {
    const parsed = JSON.parse(serialized);
    return parsed.map((op: any) => ({
      ...op,
      timestamp: new Date(op.timestamp),
    }));
  },
};