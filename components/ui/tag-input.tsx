import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { X } from 'lucide-react';

export interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxTagLength?: number;
}

export function TagInput({
  value = [],
  onChange,
  maxTags = 5,
  maxTagLength = 20,
  placeholder = 'Enter tags...',
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();

    if (!trimmedTag || value.includes(trimmedTag) || value.length >= maxTags) {
      return;
    }

    // Limit tag length
    const processedTag = trimmedTag.slice(0, maxTagLength);

    onChange([...value, processedTag]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter or comma
    if ((e.key === 'Enter' || e.key === ',') && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    }
    // Remove last tag on Backspace if input is empty
    else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  // Focus the input when clicking the container
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn(
        'flex flex-wrap gap-2 rounded-md border bg-background p-2 focus-within:ring-2 focus-within:ring-ring',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-sm">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          )}
        </Badge>
      ))}

      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={() => {
          if (inputValue) {
            addTag(inputValue);
          }
        }}
        className={cn(
          'min-w-28 flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
          disabled && 'cursor-not-allowed',
        )}
        placeholder={value.length < maxTags ? placeholder : ''}
        disabled={disabled || value.length >= maxTags}
      />
    </div>
  );
}
