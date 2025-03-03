import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { FileUpload } from "@/types/submission"

export interface FileInputProps {
  value?: FileUpload | null
  onChange: (file: FileUpload | null) => void
  onUpload?: (file: File) => Promise<string>
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
  className?: string
  error?: string
}

export function FileInput({
  value,
  onChange,
  onUpload,
  accept = {
    'text/plain': ['.txt'],
    'text/x-python': ['.py'],
    'application/javascript': ['.js'],
    'application/json': ['.json'],
    'text/markdown': ['.md'],
    'text/yaml': ['.yaml', '.yml'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  className,
  error,
}: FileInputProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      
      // Create file upload object
      const fileUpload: FileUpload = {
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadStatus: 'pending',
      }
      
      onChange(fileUpload)
      
      // If onUpload function was provided, use it
      if (onUpload) {
        try {
          setIsUploading(true)
          setUploadError(null)
          
          // Start fake progress to show activity
          const interval = setInterval(() => {
            setUploadProgress((prev) => {
              const next = Math.min(prev + 5, 95)
              return next
            })
          }, 100)
          
          // Upload the file
          const storageKey = await onUpload(file)
          
          // Update with completed status
          clearInterval(interval)
          setUploadProgress(100)
          
          // Update the file upload object with storage key
          onChange({
            ...fileUpload,
            storageKey,
            uploadStatus: 'completed',
          })
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to upload file'
          setUploadError(errorMessage)
          onChange({
            ...fileUpload,
            uploadStatus: 'failed',
          })
        } finally {
          setIsUploading(false)
        }
      }
    },
    [disabled, onChange, onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled,
    multiple: false,
  })

  const removeFile = () => {
    onChange(null)
    setUploadError(null)
    setUploadProgress(0)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Show file preview if we have a file */}
      {value && (
        <div className="flex items-center justify-between rounded-md border p-3 bg-background">
          <div className="flex items-center space-x-2">
            <File className="h-6 w-6 flex-shrink-0 text-blue-500" />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-foreground truncate">
                {value.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {(value.fileSize / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            disabled={isUploading || disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}

      {/* Show progress bar if uploading */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Show error message */}
      {(error || uploadError) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error || uploadError}</span>
        </div>
      )}

      {/* Only show dropzone if no file is selected */}
      {!value && (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            error && "border-destructive",
            disabled && "opacity-50 cursor-not-allowed bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Click to upload</span> or drag and
              drop
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Python, JavaScript, JSON, Text, Markdown, or YAML (max {maxSize / 1024 / 1024}MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}